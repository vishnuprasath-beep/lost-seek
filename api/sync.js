/**
 * LostSeek - Serverless Sync API Route (/api/sync)
 * Provides:
 * - Full state synchronization between Web, Android, and Cloud database
 * - Flushes pending offline queues (reports, claims, help requests) when internet reconnects
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
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-lostseek-user, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const user = parseUser(req);

  try {
    // If POST: process queued offline items first
    if (req.method === 'POST') {
      const body = parseBody(req);
      const queuedReports = Array.isArray(body.queuedReports) ? body.queuedReports : [];
      const queuedClaims = Array.isArray(body.queuedClaims) ? body.queuedClaims : [];
      const queuedHelp = Array.isArray(body.queuedHelpRequests) ? body.queuedHelpRequests : [];

      for (const r of queuedReports) {
        try { await db.createReport(r, user); } catch (e) { console.warn('Queue report sync error:', e.message); }
      }
      for (const c of queuedClaims) {
        try { await db.createClaim(c, user); } catch (e) { console.warn('Queue claim sync error:', e.message); }
      }
      for (const h of queuedHelp) {
        try { await db.createHelpRequest(h, user); } catch (e) { console.warn('Queue help sync error:', e.message); }
      }
    }

    // Retrieve fresh full cloud state
    const [allReports, claims, matches, helpRequests, notifications, communityAlerts] = await Promise.all([
      db.getReports({}, user),
      db.getClaims({}, user),
      db.getMatches({}),
      db.getHelpRequests({}, user),
      db.getNotifications(user ? (user.username || user.id) : null),
      db.getCommunityAlerts({ status: 'ACTIVE' })
    ]);

    const lostReports = allReports.filter(r => r.type === 'LOST');
    const foundReports = allReports.filter(r => r.type === 'FOUND');

    let userProfile = null;
    if (user && (user.username || user.id)) {
      try {
        const u = await db.getUser(user.username || user.id);
        if (u) {
          userProfile = {
            id: u.id,
            username: u.username,
            name: u.name,
            role: u.role,
            studentId: u.studentId,
            phone: u.phone || '',
            avatarUrl: u.avatarUrl || '',
            avatar: u.avatarUrl || '',
            avatar_url: u.avatarUrl || '',
            profilePicture: u.avatarUrl || '',
            profilePictureUrl: u.avatarUrl || '',
            photoUrl: u.avatarUrl || ''
          };
        }
      } catch (e) {}
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      lostReports,
      foundReports,
      claims,
      matches,
      helpRequests,
      notifications,
      communityAlerts,
      user: userProfile
    });
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
      message: error.message || 'Synchronization failed.'
    });
  }
};
