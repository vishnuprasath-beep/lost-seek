/**
 * LostSeek - Serverless Claims API Route (/api/claims)
 * Supports:
 * - GET: Read all claims with authorization-based evidence protection
 * - POST: Submit a new ownership claim
 * - PATCH: Update claim status (requires Admin authorization for Approved/Rejected/Completed)
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
    // 1. GET - Retrieve claims
    if (req.method === 'GET') {
      const filter = {
        id: query.id,
        claimantId: query.claimantId,
        status: query.status
      };
      const claims = await db.getClaims(filter, user);
      return res.status(200).json({
        success: true,
        count: claims.length,
        claims
      });
    }

    // 2. POST - Create new claim
    if (req.method === 'POST') {
      const body = parseBody(req);
      if (!body.verificationEvidence && !body.evidence) {
        return res.status(400).json({
          success: false,
          message: 'Verification evidence is mandatory for ownership claims.'
        });
      }

      const claim = await db.createClaim(body, user);

      // Create notification for Admin
      await db.createNotification({
        userId: 'admin@campus.edu',
        message: `📋 New Claim submitted for "${body.itemTitle || 'Item'}" by ${user ? user.name : 'Student'}. Awaiting verification.`,
        type: 'claim'
      });

      return res.status(201).json({
        success: true,
        message: 'Claim registered and stored in cloud database.',
        claim
      });
    }

    // 3. PATCH - Update claim status
    if (req.method === 'PATCH') {
      const body = parseBody(req);
      const claimId = query.id || body.id;
      if (!claimId) {
        return res.status(400).json({ success: false, message: 'Claim id is required for update.' });
      }

      const updated = await db.updateClaim(claimId, body, user);

      // If status changed to Approved, notify claimant
      if (body.status === 'Approved' || body.claimStatus === 'Approved') {
        await db.createNotification({
          userId: updated.claimant_id,
          message: `🎉 Claim #${claimId} for "${updated.item_title}" has been APPROVED! Proceed to Campus Security Desk for safe handover.`,
          type: 'claim_approved'
        });
      }

      return res.status(200).json({
        success: true,
        message: `Claim status updated to ${body.status || body.claimStatus}.`,
        claim: updated
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
      message: error.message || 'Internal server error while processing claim.'
    });
  }
};
