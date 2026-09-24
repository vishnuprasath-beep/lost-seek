/**
 * LostSeek - Serverless Matches API Route (/api/matches)
 * Supports:
 * - GET: Read persistent multi-signal AI matches from cloud
 * - POST: Persist new AI match results with explainable breakdown
 */

const db = require('../server/db.js');

function parseBody(req) {
  if (typeof req.body === 'object' && req.body !== null) return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return {};
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

  const url = new URL(req.url, 'http://localhost');
  const query = Object.fromEntries(url.searchParams.entries());

  try {
    // 1. GET - Retrieve matches
    if (req.method === 'GET') {
      const filter = {
        lostReportId: query.lostReportId,
        foundReportId: query.foundReportId
      };
      const matches = await db.getMatches(filter);
      return res.status(200).json({
        success: true,
        count: matches.length,
        matches
      });
    }

    // 2. POST - Save match
    if (req.method === 'POST') {
      const body = parseBody(req);
      if (!body.lostReportId || !body.foundReportId) {
        return res.status(400).json({
          success: false,
          message: 'Both lostReportId and foundReportId are required.'
        });
      }

      const match = await db.createMatch(body);
      return res.status(201).json({
        success: true,
        message: 'Match saved in cloud database.',
        match
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
      message: error.message || 'Internal server error while processing matches.'
    });
  }
};
