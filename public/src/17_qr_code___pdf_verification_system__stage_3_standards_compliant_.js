/* ==========================================================================
   QR CODE & PDF VERIFICATION SYSTEM (STAGE 3 STANDARDS-COMPLIANT)
   ========================================================================== */
const PROD_BASE_URL = 'https://smart-campus-pro.vercel.app';
let currentQrItemId = null;

function openQrModal(itemId) {
  let item = appState.lostReports.find(r => r.id === itemId) || appState.foundReports.find(r => r.id === itemId);
  if (!item) return;

  currentQrItemId = itemId;
  const modal = document.getElementById('qr-modal');
  const canvas = document.getElementById('qr-canvas');
  const titleEl = document.getElementById('qr-item-title');
  const idEl = document.getElementById('qr-item-id');

  if (titleEl) titleEl.textContent = item.title;
  if (idEl) idEl.textContent = `ID: #${item.id} • ${item.location}`;

  // Encode genuine, standards-compliant production HTTPS verification URL
  const payload = `${PROD_BASE_URL}/report/${item.id}`;

  if (typeof QRCode === 'undefined') {
    loadScriptAsync('https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js').then(() => openQrModal(itemId)).catch(() => {});
    return;
  }
  if (canvas) {
    QRCode.toCanvas(canvas, payload, {
      width: 180,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    }, function (error) {
      if (error) console.error('QR code generation error:', error);
    });
  }

  if (modal) modal.classList.add('show');
}

function closeQrModal() {
  const modal = document.getElementById('qr-modal');
  if (modal) modal.classList.remove('show');
}

function downloadQrCode() {
  const canvas = document.getElementById('qr-canvas');
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = `LostSeek-QR-${currentQrItemId || 'tag'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('Official QR Tag downloaded successfully! 🖨️', 'success');
}

async function downloadReportPdf(reportId) {
  if (!reportId) reportId = currentQrItemId;
  if (!reportId) {
    showToast('No report specified for PDF generation', 'warning');
    return;
  }

  showToast('Generating official LostSeek PDF...', 'info');

  // Primary: Serverless Vector PDF endpoint (/api/pdf)
  try {
    const res = await fetch(`/api/pdf?id=${encodeURIComponent(reportId)}&type=report`);
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `LostSeek_REPORT_${reportId.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      showToast('Official PDF downloaded successfully! 📄', 'success');
      return;
    }
  } catch (err) {
    console.warn('Serverless PDF endpoint failed, attempting client-side fallback:', err);
  }

  // Fallback: Client-side jsPDF generator
  try {
    if (!window.jspdf) {
      await loadScriptAsync('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }
    if (window.jspdf && window.jspdf.jsPDF) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const report = appState.lostReports.find(r => r.id === reportId) ||
                     appState.foundReports.find(r => r.id === reportId) ||
                     { id: reportId, title: 'Item Report', location: 'Campus Premises', category: 'General' };

      // Header branding
      doc.setFillColor(15, 23, 42);
      doc.rect(14, 12, 182, 24, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('KSRCE SMART CAMPUS — LOSTSEEK', 20, 24);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(56, 189, 248);
      doc.text('OFFICIAL VERIFICATION RECEIPT & CUSTODY DOCUMENT', 20, 30);

      // Details
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CAMPUS PROPERTY CUSTODY REPORT', 14, 46);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('Document ID:', 14, 56);
      doc.text('Item Title:', 14, 64);
      doc.text('Category:', 14, 72);
      doc.text('Status:', 14, 80);
      doc.text('Location:', 14, 88);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(String(report.id), 55, 56);
      doc.text(String(report.title || report.itemName || 'Unspecified Item'), 55, 64);
      doc.text(String(report.category || 'General').toUpperCase(), 55, 72);
      doc.text(String(report.status || 'Active').toUpperCase(), 55, 80);
      doc.text(String(report.location || 'Campus Premises'), 55, 88);

      // Embedded QR Code
      const canvas = document.getElementById('qr-canvas');
      if (canvas) {
        const qrDataUrl = canvas.toDataURL('image/png');
        doc.addImage(qrDataUrl, 'PNG', 130, 48, 50, 50);
        doc.setFontSize(7);
        doc.setTextColor(2, 132, 199);
        doc.text('SCAN TO VERIFY RECORD', 132, 102);
      }

      // Security Notice
      doc.setFillColor(254, 242, 242);
      doc.rect(14, 115, 182, 20, 'F');
      doc.setFontSize(7.5);
      doc.setTextColor(185, 28, 28);
      doc.setFont('helvetica', 'bold');
      doc.text('SECURITY & INTEGRITY NOTICE', 18, 122);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(127, 29, 29);
      doc.text('Official campus custody document. Verification: https://smart-campus-pro.vercel.app', 18, 130);

      doc.save(`LostSeek_REPORT_${reportId.substring(0, 8)}.pdf`);
      showToast('Official PDF downloaded successfully! 📄', 'success');
      return;
    }
  } catch (clientErr) {
    console.error('Client-side PDF generation error:', clientErr);
  }

  showToast('Failed to download PDF. Please try again.', 'danger');
}

async function downloadReceiptPdf(claimId) {
  if (!claimId) return;
  showToast('Generating official handover receipt...', 'info');

  try {
    const res = await fetch(`/api/pdf?id=${encodeURIComponent(claimId)}&type=claim`);
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `LostSeek_RECEIPT_${claimId.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      showToast('Official Receipt downloaded! 📄', 'success');
      return;
    }
  } catch (err) {
    console.warn('Serverless receipt error:', err);
  }

  // Fallback to report pdf
  const claim = appState.claims.find(c => c.id === claimId);
  const repId = claim?.foundReportId || claim?.lostReportId;
  if (repId) {
    downloadReportPdf(repId);
  } else {
    showToast('Handover receipt generation unavailable', 'warning');
  }
}

async function openPublicVerification(reportId) {
  const modal = document.getElementById('public-verification-modal');
  const body = document.getElementById('public-verification-body');
  if (!modal || !body) return;

  currentQrItemId = reportId;
  modal.classList.add('show');

  body.innerHTML = `
    <div style="text-align: center; padding: 30px;">
      <div style="margin: 0 auto; width: 36px; height: 36px; border: 3px solid rgba(56, 189, 248, 0.2); border-top-color: #38bdf8; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <p style="margin-top: 14px; color: var(--text-secondary); font-size: 0.9rem;">Verifying record on campus network...</p>
    </div>
  `;

  try {
    const res = await fetch(`/api/verify?id=${encodeURIComponent(reportId)}`);
    const data = await res.json();

    if (res.ok && data.success && data.record) {
      const rec = data.record;
      body.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; padding: 14px; margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
          <i data-lucide="check-circle" style="color: #10b981; width: 26px; height: 26px; flex-shrink: 0;"></i>
          <div>
            <div style="font-weight: 700; color: #10b981; font-size: 0.95rem;">Authoritative Campus Record Verified</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHTML(rec.verificationSource)}</div>
          </div>
        </div>

        <div style="background: var(--bg-subtle, rgba(255,255,255,0.03)); border: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); border-radius: 10px; padding: 16px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div>
              <span class="badge ${rec.type === 'LOST' ? 'badge-searching' : 'badge-matched'}" style="font-size: 0.7rem;">${escapeHTML(rec.type)} ITEM</span>
              <h4 style="margin: 6px 0 0; font-size: 1.1rem; color: var(--text-primary);">${escapeHTML(rec.title || rec.itemName)}</h4>
            </div>
            <span class="status-pill status-${(rec.status || 'Active').toLowerCase()}">${escapeHTML(rec.status || 'Active')}</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.82rem; margin-top: 12px;">
            <div>
              <span style="color: var(--text-muted); display: block;">Record ID:</span>
              <code style="color: #38bdf8; font-size: 0.8rem;">#${escapeHTML(rec.id)}</code>
            </div>
            <div>
              <span style="color: var(--text-muted); display: block;">Category:</span>
              <strong style="color: var(--text-primary);">${escapeHTML(rec.category || 'General')}</strong>
            </div>
            <div>
              <span style="color: var(--text-muted); display: block;">Location:</span>
              <strong style="color: var(--text-primary);">${escapeHTML(rec.location || 'Campus Premises')}</strong>
            </div>
            <div>
              <span style="color: var(--text-muted); display: block;">Custody:</span>
              <strong style="color: #38bdf8;">${escapeHTML(rec.custody || 'Campus Security')}</strong>
            </div>
          </div>

          ${rec.aiSummary ? `
            <div style="margin-top: 12px; padding: 10px; background: rgba(56, 189, 248, 0.06); border-radius: 8px; border: 1px dashed rgba(56, 189, 248, 0.2);">
              <div style="font-size: 0.75rem; font-weight: 700; color: #38bdf8; text-transform: uppercase;">Vision AI Verification Signal</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
                Detected: <strong>${escapeHTML(rec.aiSummary.primaryClass || 'Object')}</strong> (${rec.aiSummary.detectedCount} objects correlated)
              </div>
            </div>
          ` : ''}
        </div>

        <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 18px; line-height: 1.4;">
          🔒 Private claimant evidence and personal phone numbers are protected and omitted from this public verification view.
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap;">
          <button type="button" class="btn btn-secondary" onclick="closePublicVerificationModal()">Close</button>
          <button type="button" class="btn btn-primary" onclick="downloadReportPdf('${rec.id}')">
            <i data-lucide="file-text"></i>
            <span>Download Official PDF</span>
          </button>
        </div>
      `;
    } else {
      // Not found state
      body.innerHTML = `
        <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 10px; padding: 18px; text-align: center; margin-bottom: 16px;">
          <i data-lucide="alert-triangle" style="color: #ef4444; width: 36px; height: 36px; margin-bottom: 8px;"></i>
          <h4 style="margin: 0 0 6px; color: #ef4444;">Record Not Found</h4>
          <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">
            No active campus registry record was found for ID <code>${escapeHTML(reportId)}</code>.
          </p>
        </div>
        <p style="font-size: 0.8rem; color: var(--text-muted); text-align: center;">
          The item may have been returned to its owner, archived, or the link has expired.
        </p>
        <div style="display: flex; justify-content: center; gap: 10px; margin-top: 16px;">
          <button type="button" class="btn btn-secondary" onclick="closePublicVerificationModal()">Dismiss</button>
          <button type="button" class="btn btn-primary" onclick="closePublicVerificationModal(); showPage('dashboard-page');">
            <span>Open LostSeek Portal</span>
          </button>
        </div>
      `;
    }
  } catch (err) {
    console.error('Error fetching public verification:', err);
    body.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <i data-lucide="wifi-off" style="color: #eab308; width: 32px; height: 32px; margin-bottom: 8px;"></i>
        <h4 style="margin: 0 0 6px; color: var(--text-primary);">Network Unavailable</h4>
        <p style="margin: 0 0 16px; font-size: 0.85rem; color: var(--text-secondary);">
          Could not reach campus verification server. Please check your network.
        </p>
        <button type="button" class="btn btn-secondary" onclick="closePublicVerificationModal()">Close</button>
      </div>
    `;
  }

  if (window.lucide) window.lucide.createIcons();
}

function closePublicVerificationModal() {
  const modal = document.getElementById('public-verification-modal');
  if (modal) modal.classList.remove('show');
}

function checkPublicReportUrl() {
  const path = window.location.pathname;
  const hash = window.location.hash;

  const matchPath = path.match(/\/report\/([a-zA-Z0-9_-]+)/);
  if (matchPath && matchPath[1] !== 'lost' && matchPath[1] !== 'found') {
    openPublicVerification(matchPath[1]);
    return true;
  }

  if (hash.startsWith('#report-') && hash !== '#report-lost' && hash !== '#report-found') {
    const repId = hash.replace('#report-', '');
    if (repId && repId !== 'lost' && repId !== 'found') {
      openPublicVerification(repId);
      return true;
    }
  }

  if (hash.startsWith('#claim-')) {
    openPublicVerification(hash.replace('#claim-', ''));
    return true;
  }

  return false;
}
