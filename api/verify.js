/**
 * LostSeek - Public Verification API Route (/api/verify)
 * 
 * Provides safe, sanitized public information for scanned QR codes.
 * Does NOT require authentication.
 * STRICTLY REDACTS all sensitive information (phone numbers, private evidence, admin notes).
 */

const db = require('../server/db.js');

module.exports = async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed. Use GET.' });
  }

  const url = new URL(req.url, 'http://localhost');
  const reportId = (url.searchParams.get('id') || '').trim();

  if (!reportId || reportId.toLowerCase() === 'lost' || reportId.toLowerCase() === 'found') {
    return res.status(400).json({
      success: false,
      error: 'InvalidReportId',
      message: 'A valid Report ID is required (e.g. ?id=lost-1789801015785-551). Do not pass route names.'
    });
  }

  try {
    const reports = await db.getReports({ id: reportId });
    if (!reports || reports.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: `No record found in campus registry for ID: ${reportId}`
      });
    }

    const r = reports[0];

    // Sanitize visual AI summary safely
    let aiSummary = null;
    const aiAnalysis = r.aiAnalysis || r.ai_analysis;
    if (aiAnalysis && aiAnalysis.status === 'completed' && aiAnalysis.visualSummary) {
      aiSummary = {
        primaryClass: aiAnalysis.visualSummary.primaryClass || 'Object',
        objectTypes: aiAnalysis.visualSummary.objectTypes || [],
        detectedCount: aiAnalysis.visualSummary.detectedCount || 0
      };
    }

    // Return strictly sanitized public verification object
    const publicRecord = {
      id: r.id,
      type: r.type,
      title: r.title || r.itemName,
      itemName: r.itemName || r.title,
      category: r.category,
      color: r.color || 'Unspecified',
      brand: r.brand || 'Unspecified',
      location: r.location || 'Campus',
      dateTime: r.dateTime || r.createdAt,
      status: r.status,
      custody: r.custody || (r.type === 'FOUND' ? 'Campus Security Desk' : 'With Owner'),
      imageUrl: r.imageUrl || r.photo || null,
      aiSummary,
      verifiedRecord: true,
      verificationSource: 'KSRCE Campus Lost & Found Registry (LostSeek Authoritative Cloud)',
      verifiedAt: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      record: publicRecord
    });
  } catch (error) {
    console.error('Verification route error:', error);
    if (error.code === 'CONFIG_MISSING') {
      return res.status(503).json({
        success: false,
        error: 'DatabaseConfigurationMissing',
        message: 'Cloud registry temporarily in offline configuration.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to resolve public verification record.'
    });
  }
};
