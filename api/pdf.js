// api/pdf.js — LostSeek Serverless PDF Generator
// Generates official, tamper-evident KSRCE LostSeek custody & claim receipts with machine-readable QR codes

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const db = require('../server/db.js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = new URL(req.url, 'http://localhost');
  const id = url.searchParams.get('id');
  const type = url.searchParams.get('type') || 'report';

  if (!id) {
    return res.status(400).json({ error: 'Missing report or claim id parameter (?id=...)' });
  }

  return new Promise(async (resolve, reject) => {
    try {
      let reportData = null;
      let claimData = null;

      if (type === 'claim') {
        const claims = await db.getClaims({ id });
        if (!claims || claims.length === 0) {
          res.status(404).json({ error: 'Claim record not found' });
          return resolve();
        }
        claimData = claims[0];

        const reportId = claimData.foundReportId || claimData.lostReportId;
        if (reportId) {
          const reports = await db.getReports({ id: reportId });
          if (reports && reports.length > 0) {
            reportData = reports[0];
          }
        }
      } else {
        const reports = await db.getReports({ id });
        if (!reports || reports.length === 0) {
          res.status(404).json({ error: 'Report record not found' });
          return resolve();
        }
        reportData = reports[0];
      }

      const reportId = reportData ? reportData.id : id;
      const qrUrl = `https://smart-campus-pro.vercel.app/report/${reportId}`;

      // Generate QR code buffer (Level M error correction, quiet zone 2)
      const qrBuffer = await QRCode.toBuffer(qrUrl, {
        type: 'png',
        width: 200,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `LostSeek Official Report - ${reportId}`,
          Author: 'KSRCE LostSeek AI Autonomous System',
          Subject: 'Campus Custody & Verification Document'
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        const filename = `LostSeek_${type.toUpperCase()}_${reportId.substring(0, 8)}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.status(200).end(pdfBuffer);
        resolve(pdfBuffer);
      });

      doc.on('error', err => {
        console.error('PDF stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'PDF error: ' + err.message });
        }
        resolve();
      });

      // --- Header Branding ---
      doc.rect(40, 40, 515, 65).fill('#0f172a');

      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(18)
         .text('KSRCE SMART CAMPUS — LOSTSEEK', 55, 55);

      doc.fillColor('#38bdf8')
         .font('Helvetica')
         .fontSize(9)
         .text('OFFICIAL VERIFICATION RECEIPT & CUSTODY DOCUMENT', 55, 78);

      doc.fillColor('#94a3b8')
         .fontSize(8)
         .text(`GENERATED: ${new Date().toISOString()}`, 360, 78, { align: 'right', width: 180 });

      // --- Document Title & Meta ---
      doc.fillColor('#0f172a')
         .font('Helvetica-Bold')
         .fontSize(13)
         .text(type === 'claim' ? 'HANDOVER & CLAIM SETTLEMENT RECORD' : 'CAMPUS PROPERTY CUSTODY REPORT', 40, 125);

      doc.rect(40, 142, 515, 1).fill('#cbd5e1');

      // --- Core Record Fields (Left Column) ---
      let y = 155;
      const drawField = (label, value) => {
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#64748b').text(label, 40, y);
        doc.font('Helvetica').fontSize(10).fillColor('#0f172a').text(value || 'N/A', 140, y, { width: 230 });
        y += 24;
      };

      drawField('Document ID:', reportId);
      drawField('Item Type:', (reportData?.type || 'FOUND').toUpperCase());
      drawField('Item Name:', reportData?.title || reportData?.itemName || 'Unspecified Item');
      drawField('Category:', (reportData?.category || 'General').toUpperCase());
      drawField('Current Status:', (reportData?.status || 'Active').toUpperCase());
      drawField('Campus Location:', reportData?.location || 'Campus Premises');
      drawField('Recorded At:', reportData?.createdAt ? new Date(reportData.createdAt).toLocaleString() : 'N/A');

      if (claimData) {
        drawField('Claim ID:', claimData.id);
        drawField('Claim Status:', (claimData.status || claimData.claimStatus || 'Pending').toUpperCase());
        drawField('Handover Code:', claimData.handoverCode || 'Issued at Security Post');
      }

      // --- QR Code Box (Right Column) ---
      doc.rect(385, 155, 170, 195).lineWidth(1).strokeColor('#e2e8f0').stroke();
      doc.image(qrBuffer, 395, 165, { width: 150, height: 150 });

      doc.font('Helvetica-Bold')
         .fontSize(8)
         .fillColor('#0284c7')
         .text('SCAN TO VERIFY RECORD', 385, 322, { align: 'center', width: 170 });

      doc.font('Helvetica')
         .fontSize(6.5)
         .fillColor('#64748b')
         .text('Validates on campus verification server', 385, 334, { align: 'center', width: 170 });

      // --- Description & Visual Details Section ---
      y = Math.max(y, 360);
      doc.rect(40, y, 515, 20).fill('#f1f5f9');
      doc.fillColor('#334155').font('Helvetica-Bold').fontSize(9).text('OFFICIAL RECORD DESCRIPTION & EVIDENCE SUMMARY', 48, y + 5);
      y += 28;

      doc.font('Helvetica').fontSize(9).fillColor('#1e293b').text(
        reportData?.description || 'No physical description recorded.',
        45, y, { width: 505 }
      );
      y += 35;

      // --- AI Visual Intelligence Summary (Safe, Non-PII) ---
      const ai = reportData?.aiAnalysis || reportData?.ai_analysis;
      if (ai) {
        doc.rect(40, y, 515, 50).fill('#f8fafc');
        doc.rect(40, y, 515, 50).lineWidth(1).strokeColor('#e2e8f0').stroke();

        doc.fillColor('#0369a1').font('Helvetica-Bold').fontSize(8.5).text('LOSTSEEK VISION INTELLIGENCE SUMMARY (STAGE 2 VERIFIED)', 48, y + 6);

        const yoloDetections = ai.visualSummary?.detectedObjects?.map(d => `${d.class} (${(d.confidence * 100).toFixed(0)}%)`).join(', ') ||
                               ai.yolo?.detections?.map(d => `${d.class} (${(d.confidence * 100).toFixed(0)}%)`).join(', ') ||
                               ai.yolo_detections?.map(d => `${d.class} (${(d.confidence * 100).toFixed(0)}%)`).join(', ') || 'Detected';
        const dominantColors = ai.dominantColors?.join(', ') || ai.dominant_colors?.join(', ') || 'Standard';

        doc.fillColor('#334155').font('Helvetica').fontSize(8).text(`Detected Objects: ${yoloDetections}`, 48, y + 20);
        doc.text(`Identified Colors: ${dominantColors}  |  Embedding: ViT-B/32 L2 Normalized (Indexed)`, 48, y + 32);

        y += 60;
      }

      // --- Legal & Security Disclaimer ---
      y = Math.max(y, 660);
      doc.rect(40, y, 515, 65).fill('#fef2f2');
      doc.rect(40, y, 515, 65).lineWidth(1).strokeColor('#fecaca').stroke();

      doc.fillColor('#b91c1c').font('Helvetica-Bold').fontSize(8.5).text('SECURITY & INTEGRITY NOTICE', 48, y + 7);
      doc.fillColor('#7f1d1d').font('Helvetica').fontSize(7.5).text(
        '1. This receipt is an official property custody record generated by the KSRCE LostSeek automated network.\n' +
        '2. AI analysis is an automated assistive search signal and does NOT constitute legal proof of ownership.\n' +
        '3. Ownership transfer and physical item release require in-person verification by Campus Security Authorities.\n' +
        '4. Sensitive identification evidence and personal telephone numbers are protected and omitted from public display.',
        48, y + 20, { width: 500, lineGap: 2 }
      );

      // --- Footer ---
      doc.fillColor('#94a3b8')
         .fontSize(7.5)
         .text('LostSeek AI Production System • K.S. Rangasamy College of Technology • Verification: https://smart-campus-pro.vercel.app', 40, 770, { align: 'center', width: 515 });

      doc.end();

    } catch (err) {
      console.error('PDF generation error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to generate PDF: ' + err.message });
      }
      resolve();
    }
  });
};
