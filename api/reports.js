/**
 * LostSeek - Serverless Reports API Route (/api/reports)
 */

const db = require('../server/db.js');
const { evaluateMatch } = require('../server/matcher.js');
const authHelper = require('../server/authHelper.js');

function parseBody(req) {
  if (typeof req.body === 'object' && req.body !== null) return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return {};
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-lostseek-user, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await authHelper.getAuthenticatedUser(req);
  const url = new URL(req.url, 'http://localhost');
  const query = Object.fromEntries(url.searchParams.entries());

  try {
    if (req.method === 'GET') {
      const filter = { id: query.id, type: query.type, userId: query.userId, status: query.status };
      
      // Pagination handling
      const limit = parseInt(query.limit) || 50;
      const page = parseInt(query.page) || 1;
      const offset = (page - 1) * limit;
      filter.limit = limit;
      filter.offset = offset;

      const reports = await db.getReports(filter, user);
      return res.status(200).json({ success: true, count: reports.length, reports, page, limit });
    }

    if (req.method === 'POST') {
      console.log('[DEBUG] Backend API: Received POST /api/reports. User authenticated:', !!user);
      authHelper.requireAuth(user);
      const body = parseBody(req);
      if (!body.title && !body.itemName) return res.status(400).json({ success: false, message: 'Item title/name is required.' });

      // Title & description length validation
      if (body.title && body.title.length > 200) return res.status(400).json({ success: false, message: 'Title too long' });
      if (body.description && body.description.length > 2000) return res.status(400).json({ success: false, message: 'Description too long' });

      const isFound = String(body.type || body.itemType || '').toUpperCase() === 'FOUND';
      
      const storageHelper = require('../server/storageHelper.js');
      if (body.imageUrl) body.imageUrl = await storageHelper.uploadIfBase64(body.imageUrl, 'report');
      if (body.photo) body.photo = await storageHelper.uploadIfBase64(body.photo, 'report');
      
      const img = body.imageUrl || body.photo;
      if (isFound && img && !body.aiAnalysis && !body.ai_analysis && query.analyze !== 'false') {
        try {
          const aiService = require('../server/lostseek_ai_service');
          body.aiAnalysis = await aiService.analyzeFoundImage(img);
        } catch (aiErr) {
          console.warn('Server-side AI analysis warning:', aiErr.message);
          body.aiAnalysis = { status: 'failed', error: aiErr.message };
        }
      }

      const report = await db.createReport(body, user);
      const isLost = String(report.type).toUpperCase() === 'LOST';

      const generatedMatches = [];
      
      // AWAIT the background work so it survives Vercel's execution model
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

      if (isLost) {
        try {
          await db.createCommunityAlert({
            reportId: report.id,
            category: report.category,
            approximateArea: report.location,
            description: report.description,
            reporterUser: user.username || user.id
          });
        } catch (alertErr) {
          console.warn('Community alert creation notice:', alertErr.message);
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Report created successfully.',
        report,
        matches: generatedMatches
      });
    }

    if (req.method === 'PATCH') {
      authHelper.requireAuth(user);
      const body = parseBody(req);
      const reportId = query.id || body.id;
      if (!reportId) return res.status(400).json({ success: false, message: 'Report id is required.' });

      // Prevent unauthorized updates directly in API as defense-in-depth
      const existingReport = await db.getReports({ id: reportId }, { role: 'admin' });
      if (!existingReport || existingReport.length === 0) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }
      
      const isOwner = existingReport[0].reporter_id === user.id || existingReport[0].reporterId === user.id;
      if (!isOwner && !authHelper.isStaff(user)) {
        return res.status(403).json({ success: false, message: 'Unauthorized: Can only update own reports.' });
      }

      const updated = await db.updateReport(reportId, body, user);

      if (['Recovered', 'Returned', 'Closed', 'Claim Approved'].includes(updated.status)) {
        try {
          await db.closeCommunityAlertForReport(reportId, 'CLOSED');
        } catch (e) {}
      }

      return res.status(200).json({ success: true, message: 'Report updated.', report: updated });
    }

    if (req.method === 'DELETE') {
      authHelper.requireAuth(user);
      const reportId = query.id || (parseBody(req)).id;
      if (!reportId) return res.status(400).json({ success: false, message: 'Report id required.' });

      const existingReport = await db.getReports({ id: reportId }, { role: 'admin' });
      if (existingReport && existingReport.length > 0) {
        const isOwner = existingReport[0].reporter_id === user.id || existingReport[0].reporterId === user.id;
        if (!isOwner && !authHelper.isStaff(user)) {
          return res.status(403).json({ success: false, message: 'Unauthorized: Cannot delete this report.' });
        }
      }

      try {
        const result = await db.deleteReport(reportId, user);
        return res.status(200).json(result);
      } catch (authErr) {
        return res.status(403).json({ success: false, message: authErr.message });
      }
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed.' });
  } catch (error) {
    if (error.code === 'CONFIG_MISSING') {
      return res.status(503).json({ success: false, error: 'DatabaseConfigurationMissing', message: error.message });
    }
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal error'
    });
  }
};
