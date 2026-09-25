/* ==========================================================================
   REPORT DETAILS MODAL (#item-details-modal)
   ========================================================================== */

function openReportDetailsModal(reportId) {
  const report = appState.lostReports.find(r => r.id === reportId) ||
                 appState.foundReports.find(r => r.id === reportId);
  if (!report) {
    showToast('Item report not found.', 'warning');
    return;
  }

  const modal = document.getElementById('item-details-modal');
  const body = document.getElementById('item-details-modal-body');
  const titleEl = document.getElementById('item-details-modal-title');
  const badgeEl = document.getElementById('item-details-modal-type-badge');
  if (!modal || !body) return;

  const isLost = appState.lostReports.some(r => r.id === reportId);
  const typeLabel = isLost ? 'Lost Item' : 'Found Item';

  if (titleEl) titleEl.textContent = report.title;
  if (badgeEl) {
    badgeEl.textContent = typeLabel;
    badgeEl.className = `badge ${isLost ? 'badge-searching' : 'badge-matched'}`;
  }

  const cat = CATEGORY_MAP[report.category] || { label: 'Item', icon: '📦' };

  body.innerHTML = `
    <div style="display: flex; gap: 18px; margin-bottom: 18px; flex-wrap: wrap;">
      ${report.photo ? `
        <div style="position: relative; width: 110px; height: 110px; border-radius: 8px; overflow: hidden; border: 1.5px solid var(--teal-bright);">
          <img src="${report.photo}" alt="${escapeHTML(report.title)}" style="width: 100%; height: 100%; object-fit: cover;">
          ${report.imageSharedForMatch ? `
            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(15, 23, 42, 0.88); color: var(--teal-bright); font-size: 0.65rem; padding: 3px 4px; text-align: center; font-weight: 600; line-height: 1.2;">
              Possible match — image shared for verification
            </div>
          ` : ''}
        </div>
      ` : `
        <div style="width: 110px; height: 110px; border-radius: 8px; background: var(--bg-subtle); display: flex; align-items: center; justify-content: center; font-size: 3rem;">
          ${cat.icon}
        </div>
      `}

      <div style="flex: 1; min-width: 220px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h4 style="margin: 0; font-size: 1.15rem; color: var(--text-primary);">${escapeHTML(report.title)}</h4>
          ${getStatusBadgeHTML(report.status)}
        </div>
        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
          📂 Category: <strong>${escapeHTML(cat.label)}</strong> • Color: <strong>${escapeHTML(report.color || 'Unspecified')}</strong>
        </div>
        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
          📍 Location: <strong>${escapeHTML(report.location)}</strong>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
          📅 Date Reported: ${formatDateTime(report.date || report.createdAt)} (${getTimeAgo(report.date || report.createdAt)})
        </div>
      </div>
    </div>

    <div style="background: var(--bg-subtle); border-radius: 8px; padding: 12px 14px; margin-bottom: 16px; border: 1px solid var(--border-subtle);">
      <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); display: block;">Description & Details</span>
      <p style="margin: 4px 0 0; font-size: 0.86rem; color: var(--text-secondary); line-height: 1.5;">
        ${escapeHTML(report.description || 'No detailed description provided.')}
      </p>
    </div>

    <!-- Contact & Handover Privacy Card -->
    ${renderContactCard(report, isLost ? 'Owner' : 'Finder')}

    <!-- Actions Area -->
    <div style="margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
      <button type="button" class="btn btn-outline" style="border-color: rgba(239, 68, 68, 0.4); color: #F87171;" onclick="closeReportDetailsModal(); openItemHelpModal('${report.id}', '${escapeHTML(report.title)}', '${escapeHTML(report.location)}')">
        <i data-lucide="shield-alert"></i>
        <span>🆘 Need Help?</span>
      </button>

      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button type="button" class="btn btn-secondary" onclick="openQrModal('${report.id}')" title="Print QR Tag">
          <i data-lucide="qr-code"></i>
          <span>QR Tag</span>
        </button>
        <button type="button" class="btn btn-secondary" onclick="downloadReportPdf('${report.id}')" title="Download Official PDF Report">
          <i data-lucide="file-text"></i>
          <span>Official PDF</span>
        </button>
        <button type="button" class="btn btn-secondary" onclick="closeReportDetailsModal()">Close</button>
        ${!isLost && appState.user?.role?.toLowerCase() === 'admin' ? `
          <button type="button" class="btn btn-primary" onclick="closeReportDetailsModal(); openAdminHandoverModal('${report.id}', 'found')">
            <i data-lucide="package-check"></i>
            <span>Safe Handover</span>
          </button>
        ` : ''}
      </div>
    </div>
  `;

  modal.classList.add('show');
  if (window.lucide) window.lucide.createIcons();
}

function closeReportDetailsModal() {
  const modal = document.getElementById('item-details-modal');
  if (modal) modal.classList.remove('show');
}
