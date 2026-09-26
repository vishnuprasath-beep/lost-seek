/**
 * LostSeek - Serverless Claims API Route (/api/claims)
 */

const db = require('../server/db.js');
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
      const filter = { id: query.id, claimantId: query.claimantId, status: query.status };
      const claims = await db.getClaims(filter, user);
      return res.status(200).json({ success: true, count: claims.length, claims });
    }

    if (req.method === 'POST') {
      authHelper.requireAuth(user);
      const body = parseBody(req);
      if (!body.verificationEvidence && !body.evidence) {
        return res.status(400).json({ success: false, message: 'Verification evidence is mandatory.' });
      }

      const claim = await db.createClaim(body, user);

      try {
        await db.createNotification({
          userId: 'admin@campus.edu',
          message: `📋 New Claim submitted for "${body.itemTitle || 'Item'}" by ${user.name || 'Student'}.`,
          type: 'claim'
        });
      } catch (e) {}

      return res.status(201).json({ success: true, message: 'Claim registered.', claim });
    }

    if (req.method === 'PATCH') {
      authHelper.requireAuth(user);
      const body = parseBody(req);
      const claimId = query.id || body.id;
      if (!claimId) return res.status(400).json({ success: false, message: 'Claim id is required.' });

      // Only staff can update status. (Assuming DB layer enforces further rules if needed)
      if (body.status || body.claimStatus) {
        authHelper.requireRole(user, ['admin', 'supervisor', 'director']);
      }

      const updated = await db.updateClaim(claimId, body, user);

      if (body.status === 'Approved' || body.claimStatus === 'Approved') {
        try {
          await db.createNotification({
            userId: updated.claimant_id,
            message: `🎉 Claim #${claimId} for "${updated.item_title}" has been APPROVED! Proceed to Campus Security Desk.`,
            type: 'claim_approved'
          });
        } catch (e) {}
      }

      return res.status(200).json({ success: true, message: `Claim updated.`, claim: updated });
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed.' });
  } catch (error) {
    if (error.code === 'CONFIG_MISSING') return res.status(503).json({ success: false, message: error.message });
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
