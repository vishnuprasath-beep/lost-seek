/**
 * LostSeek - Serverless Image Upload API Route (/api/upload)
 * Uploads user images (from Web camera/gallery or Android APK) to permanent Vercel Blob Storage.
 * Returns the permanent HTTPS CDN URL.
 */

const { put } = require('@vercel/blob');

// Load environment variables if running locally
if (process.env.NODE_ENV !== 'production') {
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const key = trimmed.slice(0, idx).trim();
          let val = trimmed.slice(idx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) process.env[key] = val;
        }
      }
    }
  } catch (e) {}
}

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

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed. Use POST to upload images.' });
  }

  try {
    const body = parseBody(req);
    const { image, filename, type } = body || {};

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided. Provide a base64 Data URL or binary buffer in `image`.'
      });
    }

    let buffer;
    let contentType = 'image/jpeg';

    if (image.startsWith('data:')) {
      const parts = image.split(';base64,');
      contentType = parts[0].replace('data:', '') || 'image/jpeg';
      buffer = Buffer.from(parts[1], 'base64');
    } else {
      buffer = Buffer.from(image, 'base64');
      if (type) contentType = type;
    }

    // Limit image size to 10MB
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        message: 'Image size exceeds maximum limit of 10MB.'
      });
    }

    const safeName = `reports/${Date.now()}-${(filename || 'item-image.jpg').replace(/[^a-zA-Z0-9._-]/g, '')}`;

    // Upload to Vercel Blob
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const blobOptions = {
      access: 'public',
      contentType: contentType
    };
    if (token) blobOptions.token = token;

    const blob = await put(safeName, buffer, blobOptions);

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully to permanent Vercel Blob storage.',
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image to Vercel Blob storage.'
    });
  }
};
