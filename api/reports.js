/**
 * LostSeek - Serverless Reports API Route (/api/reports)
 * Supports:
 * - GET: Read all reports or filter by ?type=lost|found, ?userId=..., ?id=...
 * - POST: Create a new centralized report (type: LOST or FOUND)
 * - PATCH: Update a report (status, details)
 */

const db = require('../server/db.js');
const { evaluateMatch } = require('../server/matcher.js');

function parseBody(req) {
  if (typeof req.body === 'object' && req.body !== null) return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return {};
}

function parseUser(req) {
  const body = req.body && typeof req.body === 'object' ? req.body : null;
  if (body && (body.callerUser || body.callingUser || body.user)) {
    return body.callerUser || body.callingUser || body.user;
  }
  const userHeader = req.headers['x-lostseek-user'] || req.headers['x-user'];
  if (userHeader) {
    try {
      return JSON.parse(decodeURIComponent(userHeader));
    } catch (e) {
      try { return JSON.parse(userHeader); } catch (err) {}
    }
  }
  if (req.headers['x-user-id'] || req.headers['x-user-role']) {
    return {
      id: req.headers['x-user-id'] || 'usr-anon',
      role: req.headers['x-user-role'] || 'student',
      username: req.headers['x-user-name'] || req.headers['x-user-username'] || req.headers['x-user-id'] || 'user'
    };
  }
  return null;
}

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-lostseek-user, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const user = parseUser(req);
  const url = new URL(req.url, 'http://localhost');
  const query = Object.fromEntries(url.searchParams.entries());

  try {
    // 1. GET - Retrieve reports
    if (req.method === 'GET') {
      const filter = {
        id: query.id,
        type: query.type,
        userId: query.userId,
        status: query.status
      };
      const reports = await db.getReports(filter, user);
      return res.status(200).json({
        success: true,
        count: reports.length,
        reports
      });
    }

    // 2. POST - Create new report
    if (req.method === 'POST') {
      const body = parseBody(req);
      if (!body.title && !body.itemName) {
        return res.status(400).json({ success: false, message: 'Item title/name is required.' });
      }

      // Automatically trigger server-side visual AI analysis for FOUND reports with an image
      const isFound = String(body.type || body.itemType || '').toUpperCase() === 'FOUND';
      const img = body.imageUrl || body.photo;
      if (isFound && img && !body.aiAnalysis && !body.ai_analysis && query.analyze !== 'false') {
        try {
          const aiService = require('../server/lostseek_ai_service');
          body.aiAnalysis = await aiService.analyzeFoundImage(img);
        } catch (aiErr) {
          console.warn('Server-side AI analysis warning during report creation:', aiErr.message);
          body.aiAnalysis = { status: 'failed', error: aiErr.message };
        }
      }

      const report = await db.createReport(body, user);
      const isLost = String(report.type).toUpperCase() === 'LOST';

      // Automatic cross-account matching against real active reports in Supabase
      const generatedMatches = [];
      try {
        const candidateOppositeType = isLost ? 'FOUND' : 'LOST';
        const candidates = await db.getReports({ type: candidateOppositeType, status: 'Active' }, { role: 'admin' });

        for (const candidate of candidates) {
          const lostRep = isLost ? report : candidate;
          const foundRep = isLost ? candidate : report;

          const matchResult = await evaluateMatch(lostRep, foundRep);
          if (matchResult.isMatch) {
            const savedMatch = await db.createMatch({
              lostReportId: matchResult.lostReportId,
              foundReportId: matchResult.foundReportId,
              score: matchResult.score,
              confidence: matchResult.confidence,
              signals: matchResult.signals
            });
            generatedMatches.push(savedMatch);

            // Notify both reporters in Supabase
            const lostReporterId = lostRep.reporterId || lostRep.reporter_id;
            const foundReporterId = foundRep.reporterId || foundRep.reporter_id;

            if (lostReporterId) {
              await db.createNotification({
                userId: lostReporterId,
                type: 'match',
                message: `🔍 Potential Match: Your lost "${lostRep.title || lostRep.itemName}" matches a found item (${matchResult.score}% confidence)! Check Match Center.`
              }).catch(() => {});
            }

            if (foundReporterId) {
              await db.createNotification({
                userId: foundReporterId,
                type: 'match',
                message: `🔍 Potential Match: A lost report matching your found "${foundRep.title || foundRep.itemName}" was found (${matchResult.score}% confidence)! Check Match Center.`
              }).catch(() => {});
            }
          }
        }
      } catch (matchErr) {
        console.warn('Server-side automatic matching warning:', matchErr.message);
      }

      // If LOST report: create safe Community Alert
      if (isLost) {
        try {
          await db.createCommunityAlert({
            reportId: report.id,
            category: report.category,
            approximateArea: report.location,
            description: report.description,
            reporterUser: user ? (user.username || user.id) : null
          });
        } catch (alertErr) {
          console.warn('Community alert creation notice:', alertErr.message);
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Report created and evaluated across cloud database.',
        report,
        matches: generatedMatches
      });
    }

    // 3. PATCH - Update report
    if (req.method === 'PATCH') {
      const body = parseBody(req);
      const reportId = query.id || body.id;
      if (!reportId) {
        return res.status(400).json({ success: false, message: 'Report id is required for update.' });
      }

      const updated = await db.updateReport(reportId, body, user);

      // If status changed to Returned, Recovered, or Closed -> close community alert
      if (['Recovered', 'Returned', 'Closed', 'Claim Approved'].includes(updated.status)) {
        try {
          await db.closeCommunityAlertForReport(reportId, 'CLOSED');
        } catch (e) {}
      }

      return res.status(200).json({
        success: true,
        message: 'Report updated successfully.',
        report: updated
      });
    }

    // 4. DELETE - Remove report (strictly authorized for owner or admin)
    if (req.method === 'DELETE') {
      const reportId = query.id || (parseBody(req)).id;
      if (!reportId) {
        return res.status(400).json({ success: false, message: 'Report id is required for deletion.' });
      }

      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required to remove a report.' });
      }

      try {
        const result = await db.deleteReport(reportId, user);
        return res.status(200).json(result);
      } catch (authErr) {
        const statusCode = authErr.statusCode || (authErr.message.includes('Unauthorized') ? 403 : 500);
        return res.status(statusCode).json({
          success: false,
          message: authErr.message
        });
      }
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed.' });
  } catch (error) {
    if (error.code === 'CONFIG_MISSING') {
      return res.status(503).json({
        success: false,
        error: 'DatabaseConfigurationMissing',
        message: error.message,
        requiredEnv: error.requiredEnv
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while processing report.'
    });
  }
};
