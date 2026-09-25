/* ==========================================================================
   REPORT HISTORY AUDIT MODAL
   ========================================================================== */
function openReportHistoryModal(reportId) {
  const report = appState.lostReports.find(r => r.id === reportId) ||
                 appState.foundReports.find(r => r.id === reportId);
  if (!report) return;

  const modal = document.getElementById('report-history-modal');
  const body = document.getElementById('report-history-modal-body');
  if (!modal || !body) return;

  document.getElementById('report-history-modal-title').textContent = `Audit: ${escapeHTML(report.title)}`;
  document.getElementById('report-history-modal-sub').textContent = `Report ID #${report.id} • ${report.type || 'Item'}`;

  const history = report.history || [
    { action: 'Created', timestamp: report.date || report.createdAt, author: report.reporterName || report.finderName || 'Student', note: 'Report logged in LostSeek database.' }
  ];

  body.innerHTML = `
    <div class="timeline-history-list">
      ${history.map(evt => `
        <div class="timeline-event-item">
          <div class="timeline-event-time">${formatDateTime(evt.timestamp)} (${getTimeAgo(evt.timestamp)})</div>
          <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-primary); margin-top: 2px;">${escapeHTML(evt.action)}</div>
          <div class="timeline-event-desc">${escapeHTML(evt.note || '')}</div>
          <div style="font-size: 0.72rem; color: var(--teal-bright); margin-top: 2px;">Logged by: ${escapeHTML(evt.author || 'System')}</div>
        </div>
      `).join('')}
    </div>
    <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
      <button type="button" class="btn btn-secondary" onclick="closeReportHistoryModal()">Close</button>
    </div>
  `;

  modal.classList.add('show');
}

function closeReportHistoryModal() {
  const modal = document.getElementById('report-history-modal');
  if (modal) modal.classList.remove('show');
}
