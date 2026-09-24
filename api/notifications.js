/**
 * LostSeek - Serverless Notifications API Route (/api/notifications)
 * Supports:
 * - GET: Read notifications for current user
 * - POST: Create new notification
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
    // 1. GET - Retrieve notifications
    if (req.method === 'GET') {
      const targetUserId = query.userId || (user ? (user.username || user.id) : null);
      const notifications = await db.getNotifications(targetUserId);
      return res.status(200).json({
        success: true,
        count: notifications.length,
        notifications
      });
    }

    // 2. POST - Create notification
    if (req.method === 'POST') {
      const body = parseBody(req);
      if (!body.message) {
        return res.status(400).json({ success: false, message: 'Notification message is required.' });
      }

      const notif = await db.createNotification(body);
      return res.status(201).json({
        success: true,
        notification: notif
      });
    }

    // 3. DELETE - Clear notifications for authenticated user
    if (req.method === 'DELETE') {
      const targetUserId = user ? (user.username || user.id) : query.userId;
      if (!targetUserId) {
        return res.status(400).json({ success: false, message: 'User identification required to clear notifications.' });
      }
      const result = await db.clearNotifications(targetUserId);
      return res.status(200).json({
        success: true,
        message: 'All notifications cleared successfully.',
        clearedCount: result.count
      });
    }

    // 4. PATCH - Mark all notifications as read for authenticated user
    if (req.method === 'PATCH') {
      const targetUserId = user ? (user.username || user.id) : query.userId;
      if (!targetUserId) {
        return res.status(400).json({ success: false, message: 'User identification required to mark notifications as read.' });
      }
      await db.markAllNotificationsRead(targetUserId);
      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read.'
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
      message: error.message || 'Internal server error while processing notifications.'
    });
  }
};
