/**
 * LostSeek - Privacy-Preserving Community Alerts API Route (/api/alerts)
 * 
 * STRICT PRIVACY RULES:
 * 1. NEVER expose owner name, phone number, email, profile photo, or serial number.
 * 2. Community Alerts contain only safe generalizations: category, approximate area, safe description, status.
 * 3. Handles "I Saw Something" flow:
 *    - If student picked up the item -> signals transition to Found report
 *    - If student just saw it -> creates sighting linked to the alert, notifies reporter privately
 * 4. Automatic status expiration and closure when report is recovered/returned.
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
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-lostseek-user, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authHelper = require('../server/authHelper.js');
  const user = await authHelper.getAuthenticatedUser(req);
  const urlParts = (req.url || '').split('?');
  const queryParams = new URLSearchParams(urlParts[1] || '');

  try {
    // 1. GET - Retrieve active community alerts or alert sightings
    if (req.method === 'GET') {
      const alertId = queryParams.get('alertId') || queryParams.get('id');
      const action = queryParams.get('action');

      if (alertId && action === 'sightings') {
        const sightings = await db.getSightings(alertId);
        return res.status(200).json({ success: true, alertId, sightings });
      }

      const status = queryParams.get('status') || 'ACTIVE';
      const alerts = await db.getCommunityAlerts({ status });

      return res.status(200).json({
        success: true,
        count: alerts.length,
        alerts
      });
    }

    // 2. POST - "I Saw Something" Sighting or Alert Creation
    if (req.method === 'POST') {
      const body = parseBody(req);
      const action = body.action || queryParams.get('action') || 'sighting';

      if (action === 'sighting' || action === 'saw_something') {
        const targetAlertId = body.alertId || body.alert_id || queryParams.get('alertId') || null;
        const targetReportId = body.reportId || body.report_id || body.id || queryParams.get('reportId') || queryParams.get('id') || null;
        const location = body.approximateLocation || body.location || 'Campus Area';
        const time = body.approximateTime || body.time || 'Recently';
        const observation = body.observation || body.description || '';
        const photoUrl = body.photoUrl || body.photo_url || null;
        const pickedUp = !!body.pickedUp;

        if (!targetAlertId && !targetReportId) {
          return res.status(400).json({ success: false, message: 'Missing alertId or reportId.' });
        }
        if (!observation || !String(observation).trim()) {
          return res.status(400).json({ success: false, message: 'Please describe what you saw (where, when, or any details).' });
        }

        // Check if student picked up the item
        if (pickedUp === true) {
          return res.status(200).json({
            success: true,
            pickedUp: true,
            message: 'You have the item! Please proceed to complete the Found report for secure AI matching and handover.',
            prefill: {
              category: body.category || 'General',
              location: location,
              description: observation || 'Found item spotted and retrieved by campus student.',
              imageUrl: photoUrl || null
            }
          });
        }

        // Student only spotted it - DIRECT DELIVERY to owner (no admin by default)
        const observerId = user ? (user.username || user.id) : (body.userId || 'anonymous_student');
        const observerName = user ? (user.name || user.username) : (body.userName || 'Campus Student');

        const sighting = await db.createSighting({
          alertId: targetAlertId,
          reportId: targetReportId,
          observerId,
          observerName,
          approximateLocation: location,
          approximateTime: time,
          observation: String(observation).trim(),
          photoUrl,
          pickedUp: false
        });

        return res.status(200).json({
          success: true,
          pickedUp: false,
          message: 'Sighting sent to the person who reported this item lost.',
          sighting
        });
      }

      // Direct alert creation (if requested manually)
      const alert = await db.createCommunityAlert(body);
      return res.status(201).json({ success: true, alert });
    }

    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed.` });
  } catch (error) {
    console.error('Community Alerts Route Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while processing community alerts.'
    });
  }
};
