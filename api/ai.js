/**
 * LostSeek - AI API Route (/api/ai)
 * 
 * Serverless function that provides YOLO object detection and CLIP similarity.
 * 
 * Supports:
 * - POST with ?action=yolo    → Detect objects in an image
 * - POST with ?action=clip    → Compute CLIP embeddings or similarity
 * - GET  with ?action=health  → Check AI model status
 */

const { detectObjects } = require('../server/yolo_service');
const { encodeImage, encodeText, compareImageToTexts } = require('../server/clip_service');

function parseBody(req) {
  if (typeof req.body === 'object' && req.body !== null) return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return {};
}

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-lostseek-user, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = new URL(req.url, 'http://localhost');
  const action = url.searchParams.get('action');

  try {
    // ===== HEALTH CHECK =====
    if (action === 'health' || req.method === 'GET') {
      return res.status(200).json({
        success: true,
        models: {
          yolo: { status: 'ready', model: 'yolov5n_fp32.onnx', classes: 80 },
          clipImage: { status: 'ready', model: 'clip-image-vit-32-uint8.onnx', embedding: 512 },
          clipText: { status: 'ready', model: 'clip-text-vit-32-uint8.onnx', embedding: 512 }
        },
        timestamp: new Date().toISOString()
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method Not Allowed. Use POST.' });
    }

    const body = parseBody(req);

    // ===== YOLO DETECTION =====
    if (action === 'yolo') {
      let imageInput;
      
      if (body.imageBase64) {
        imageInput = Buffer.from(body.imageBase64, 'base64');
      } else if (body.imageUrl) {
        const response = await fetch(body.imageUrl);
        if (!response.ok) {
          return res.status(400).json({ success: false, error: 'Failed to fetch image from URL' });
        }
        imageInput = Buffer.from(await response.arrayBuffer());
      } else {
        return res.status(400).json({ success: false, error: 'Provide imageBase64 or imageUrl' });
      }

      const confThreshold = body.confThreshold || 0.25;
      const result = await detectObjects(imageInput, confThreshold);

      return res.status(200).json({
        success: true,
        detections: result.detections,
        inferenceTimeMs: result.inferenceTimeMs,
        imageDimensions: result.imageDimensions
      });
    }

    // ===== CLIP EMBEDDING / SIMILARITY =====
    if (action === 'clip') {
      if (!body.mode) {
        return res.status(400).json({ success: false, error: 'Provide mode: encode_image, encode_text, or compare' });
      }

      switch (body.mode) {
        case 'encode_image': {
          let imageInput;
          if (body.imageBase64) {
            imageInput = Buffer.from(body.imageBase64, 'base64');
          } else if (body.imageUrl) {
            const response = await fetch(body.imageUrl);
            imageInput = Buffer.from(await response.arrayBuffer());
          } else {
            return res.status(400).json({ success: false, error: 'Provide imageBase64 or imageUrl' });
          }

          const result = await encodeImage(imageInput);
          return res.status(200).json({
            success: true,
            embedding: result.embedding,
            dimensions: result.dimensions,
            inferenceTimeMs: result.inferenceTimeMs
          });
        }

        case 'encode_text': {
          if (!body.text) {
            return res.status(400).json({ success: false, error: 'Provide text string' });
          }
          const result = await encodeText(body.text);
          return res.status(200).json({
            success: true,
            embedding: result.embedding,
            dimensions: result.dimensions,
            inferenceTimeMs: result.inferenceTimeMs
          });
        }

        case 'compare': {
          let imageInput;
          if (body.imageBase64) {
            imageInput = Buffer.from(body.imageBase64, 'base64');
          } else if (body.imageUrl) {
            const response = await fetch(body.imageUrl);
            imageInput = Buffer.from(await response.arrayBuffer());
          } else {
            return res.status(400).json({ success: false, error: 'Provide imageBase64 or imageUrl' });
          }

          if (!body.texts || !Array.isArray(body.texts)) {
            return res.status(400).json({ success: false, error: 'Provide texts array' });
          }

          const result = await compareImageToTexts(imageInput, body.texts);
          return res.status(200).json({
            success: true,
            scores: result.scores,
            totalTimeMs: result.totalTimeMs
          });
        }

        default:
          return res.status(400).json({ success: false, error: 'Unknown mode. Use: encode_image, encode_text, compare' });
      }
    }

    // ===== ANALYZE FOUND IMAGE =====
    if (action === 'analyze_found') {
      const imageInput = body.imageUrl || body.imageBase64 || body.photo;
      if (!imageInput) {
        return res.status(400).json({ success: false, error: 'Provide imageUrl, imageBase64, or photo' });
      }

      const aiService = require('../server/lostseek_ai_service');
      const analysis = await aiService.analyzeFoundImage(imageInput, body.lostReports);

      // Optionally update report in database if reportId provided
      if (body.reportId && analysis.status === 'completed') {
        try {
          const db = require('../server/db');
          await db.updateReport(body.reportId, { aiAnalysis: analysis });
        } catch (dbErr) {
          console.warn('Could not persist aiAnalysis to database for reportId:', body.reportId, dbErr.message);
        }
      }

      return res.status(200).json({
        success: true,
        aiAnalysis: analysis
      });
    }

    // ===== MATCH SIGNALS (YOLO + CLIP) =====
    if (action === 'match_signals') {
      const { foundReport, lostReport } = body;
      if (!foundReport || !lostReport) {
        return res.status(400).json({ success: false, error: 'Provide both foundReport and lostReport objects' });
      }

      const aiService = require('../server/lostseek_ai_service');
      const signals = await aiService.computeAiMatchSignals(foundReport, lostReport);

      return res.status(200).json({
        success: true,
        aiSignals: signals
      });
    }

    return res.status(400).json({ success: false, error: 'Unknown action. Use: ?action=yolo, ?action=clip, ?action=analyze_found, ?action=match_signals, or ?action=health' });

  } catch (error) {
    console.error('AI API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during AI inference.'
    });
  }
};

