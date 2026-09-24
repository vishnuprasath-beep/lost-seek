/**
 * LostSeek - Serverless Help & Safety API Route (/api/help)
 * Handles:
 * - 🆘 Need Help? requests
 * - Admin Complaints Desk
 * - Handover freezing & item flagging on urgent complaints
 */

const db = require('../server/db.js');

function parseBody(req) {
  if (typeof req.body === 'object' && req.body !== null) return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return {};
}

function parseUser(req) {
  const userHeader = req.headers['x-lostseek-user'];
  if (userHeader) {
    try {
      return JSON.parse(decodeURIComponent(userHeader));
    } catch (e) {
      try { return JSON.parse(userHeader); } catch (err) {}
    }
  }
  return null;
}

module.exports = async function handler(req, res) {
  // CORS
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
    // 1. GET - Retrieve help requests
    if (req.method === 'GET') {
      const filter = {
        id: query.id,
        status: query.status,
        isUrgent: query.isUrgent !== undefined ? query.isUrgent === 'true' : undefined
      };
      const requests = await db.getHelpRequests(filter, user);
      return res.status(200).json({
        success: true,
        count: requests.length,
        helpRequests: requests
      });
    }

    // 2. POST - Submit help request
    if (req.method === 'POST') {
      const body = parseBody(req);
      if (!body.reason || !body.details) {
        return res.status(400).json({
          success: false,
          message: 'Both reason and details are required to file a help/complaint request.'
        });
      }

      const request = await db.createHelpRequest(body, user);
      return res.status(201).json({
        success: true,
        message: body.isUrgent ? 'Urgent safety complaint filed. Associated item frozen.' : 'Help request submitted to Admin Desk.',
        helpRequest: request
      });
    }

    // 3. PATCH - Update / Resolve ticket (Admin only)
    if (req.method === 'PATCH') {
      const body = parseBody(req);
      const ticketId = query.id || body.id;
      if (!ticketId) {
        return res.status(400).json({ success: false, message: 'Ticket id is required for update.' });
      }

      const updated = await db.updateHelpRequest(ticketId, body, user);
      return res.status(200).json({
        success: true,
        message: 'Help ticket updated.',
        helpRequest: updated
      });
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
      message: error.message || 'Internal server error while processing help request.'
    });
  }
};
