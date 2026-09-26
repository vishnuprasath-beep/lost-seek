/* ==========================================================================
   ADMIN VERIFICATION DESK (#admin-page)
   ========================================================================== */
let currentAdminTab = 'all-reports';
let adminExpandedRowId = null;

function switchAdminTab(tabName, btnEl) {
  currentAdminTab = tabName;

  // Update tab pill active state
  const pills = document.querySelectorAll('#admin-page .tab-pill');
  pills.forEach(p => p.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  // Toggle pane visibility
  const panes = {
    'all-reports': 'admin-pane-all-reports',
    'pending-claims': 'admin-pane-pending-claims',
    'verified': 'admin-pane-verified',
    'expired': 'admin-pane-expired'
  };

  Object.keys(panes).forEach(k => {
    const pane = document.getElementById(panes[k]);
    if (pane) {
      pane.style.display = (k === tabName) ? (k === 'all-reports' || k === 'verified' || k === 'expired' ? 'block' : 'grid') : 'none';
      if (k === tabName) pane.classList.add('fade-in');
    }
  });

  renderAdminDesk();
}

function renderAdminDesk() {
  updateAdminCounts();

  if (currentAdminTab === 'all-reports') {
    renderAdminAllReports();
  } else if (currentAdminTab === 'pending-claims') {
    renderAdminPendingClaims();
  } else if (currentAdminTab === 'verified') {
    renderAdminVerified();
  } else if (currentAdminTab === 'expired') {
    renderAdminExpired();
  }
}

function updateAdminCounts() {
  const totalReports = appState.lostReports.length + appState.foundReports.length;
  const pendingClaims = appState.claims.filter(c => c.status === 'Pending Admin Review' || c.status === 'Claimed').length;
  const verifiedCount = appState.lostReports.filter(r => r.status === 'Verified').length + 
                        appState.foundReports.filter(r => r.status === 'Verified').length;
  const expiredCount = [...appState.lostReports, ...appState.foundReports].filter(isItemExpired).length;

  const countRep = document.getElementById('admin-count-reports');
  const countClm = document.getElementById('admin-count-claims');
  const countVer = document.getElementById('admin-count-verified');
  const countExp = document.getElementById('admin-count-expired');

  if (countRep) countRep.textContent = totalReports;
  if (countClm) countClm.textContent = pendingClaims;
  if (countVer) countVer.textContent = verifiedCount;
  if (countExp) countExp.textContent = expiredCount;
}

function isItemExpired(item) {
  if (!item.createdAt) return false;
  if (item.status === 'Expired' || item.status === 'Archived' || item.status === 'Donated') return true;
  const itemDate = new Date(item.createdAt).getTime();
  const diffDays = (Date.now() - itemDate) / (1000 * 3600 * 24);
  return diffDays >= 30;
}

function filterAdminReportsTable() {
  renderAdminAllReports();
}

function renderAdminAllReports() {
  const tbody = document.getElementById('admin-all-reports-tbody');
  if (!tbody) return;

  const searchInput = document.getElementById('admin-search-input')?.value.trim().toLowerCase() || '';
  const categoryFilter = document.getElementById('admin-filter-category')?.value || '';
  const statusFilter = document.getElementById('admin-filter-status')?.value || '';
  const locationFilter = document.getElementById('admin-filter-location')?.value || '';

  const allReports = [
    ...appState.lostReports.map(i => ({ ...i, itemType: 'Lost' })),
    ...appState.foundReports.map(i => ({ ...i, itemType: 'Found' }))
  ];

  // Apply filters
  const filtered = allReports.filter(item => {
    if (searchInput) {
      const matchSearch = item.title.toLowerCase().includes(searchInput) ||
                          item.id.toLowerCase().includes(searchInput) ||
                          (item.description && item.description.toLowerCase().includes(searchInput)) ||
                          (item.finderName && item.finderName.toLowerCase().includes(searchInput)) ||
                          (item.location && item.location.toLowerCase().includes(searchInput));
      if (!matchSearch) return false;
    }

    if (categoryFilter && item.category !== categoryFilter) return false;
    if (statusFilter && item.status !== statusFilter) return false;
    if (locationFilter && item.location !== locationFilter) return false;

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding: 36px; color: var(--text-muted);">
          🔍 No reports match the active filter criteria.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(item => {
    const cat = CATEGORY_MAP[item.category] || { label: 'Item', icon: '📦' };
    const badgeClass = getStatusBadgeClass(item.status);
    const isExpanded = (adminExpandedRowId === item.id);

    return `
      <tr onclick="toggleAdminRowExpand('${item.id}')" class="${isExpanded ? 'row-selected' : ''}">
        <td>
          <span class="badge ${item.itemType === 'Lost' ? 'badge-searching' : 'badge-matched'}">
            ${item.itemType}
          </span>
        </td>
        <td><code>#${escapeHTML(item.id)}</code></td>
        <td><strong>${escapeHTML(item.title)}</strong></td>
        <td>${cat.icon} ${escapeHTML(cat.label)}</td>
        <td>📍 ${escapeHTML(item.location)}</td>
        <td>${getTimeAgo(item.createdAt || item.date)}</td>
        <td><span class="badge ${badgeClass}">${item.status}</span></td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); toggleAdminRowExpand('${item.id}')">
            ${isExpanded ? '▲ Hide' : '▼ Details'}
          </button>
        </td>
      </tr>
      ${isExpanded ? `
        <tr class="admin-expand-row">
          <td colspan="8">
            <div class="admin-expanded-detail-box">
              ${item.photo ? `
                <img src="${item.photo}" class="expanded-thumb" alt="Item Preview">
              ` : `
                <div class="expanded-thumb" style="display:flex;align-items:center;justify-content:center;font-size:3rem;">
                  ${cat.icon}
                </div>
              `}
              <div>
                <h4 style="font-size: 1.1rem; margin-bottom: 6px;">${escapeHTML(item.title)}</h4>
                <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 10px;">
                  ${escapeHTML(item.description || 'No detailed notes provided.')}
                </p>
                <div class="expanded-meta-grid">
                  <div class="expanded-meta-item">
                    <span class="lbl">Campus Location</span>
                    <span class="val">${escapeHTML(item.location)}</span>
                  </div>
                  <div class="expanded-meta-item">
                    <span class="lbl">Primary Color &amp; Brand</span>
                    <span class="val">${escapeHTML(item.color || 'N/A')} • ${escapeHTML(item.brand || 'N/A')}</span>
                  </div>
                  <div class="expanded-meta-item">
                    <span class="lbl">${item.itemType === 'Found' ? 'Finder / Custody' : 'Reporter / Contact'}</span>
                    <span class="val">${escapeHTML(item.finderName || item.custody || 'Alex Rivera (Student)')}</span>
                  </div>
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); openQrModal('${item.id}')">
                  🏷️ Print QR Tag
                </button>
                ${item.status === 'Verified' ? `
                  <button class="btn btn-sm btn-accent-teal" onclick="event.stopPropagation(); adminMarkReturned('${item.id}')">
                    ✅ Mark Returned
                  </button>
                ` : ''}
                <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); adminArchiveItem('${item.id}')">
                  📁 Archive
                </button>
              </div>
            </div>
          </td>
        </tr>
      ` : ''}
    `;
  }).join('');
}

function toggleAdminRowExpand(itemId) {
  adminExpandedRowId = (adminExpandedRowId === itemId) ? null : itemId;
  renderAdminAllReports();
}

function renderAdminClaims() {
  renderAdminPendingClaims();
  if (typeof renderAdminHelpRequests === "function") {
    renderAdminHelpRequests();
  }
}

function renderAdminPendingClaims() {
  const container = document.getElementById('admin-claims-cards-grid');
  if (!container) return;

  const pendingClaims = appState.claims.filter(c => c.status === 'Pending Admin Review' || c.status === 'Claimed');

  if (pendingClaims.length === 0) {
    container.innerHTML = `
      <div class="glass-card empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">✅</div>
        <p>All claims reviewed! No claims currently pending admin verification.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = pendingClaims.map(claim => {
    const lostItem = appState.lostReports.find(r => r.id === claim.lostReportId);
    const foundItem = appState.foundReports.find(r => r.id === claim.foundReportId);

    const lostTitle = lostItem ? lostItem.title : 'Lost Item #' + claim.lostReportId;
    const foundTitle = foundItem ? foundItem.title : 'Found Item #' + claim.foundReportId;
    const lostCat = lostItem ? (CATEGORY_MAP[lostItem.category] || { icon: '📦' }) : { icon: '📦' };
    const foundCat = foundItem ? (CATEGORY_MAP[foundItem.category] || { icon: '📦' }) : { icon: '📦' };

    return `
      <div class="glass-card match-card" style="padding: 24px; border-left: 4px solid var(--warning);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <span class="badge badge-claimed">Claim Awaiting Admin Approval</span>
            <span class="sub-text" style="margin-left: 8px;">Claim ID: <code>#${escapeHTML(claim.id)}</code></span>
          </div>
          <div class="match-score-pill">
            <span>🤖 Similarity:</span>
            <strong>${claim.matchScore}%</strong>
          </div>
        </div>

        <!-- Side by side mini comparison -->
        <div class="match-card-side-by-side" style="margin-bottom: 16px;">
          <div class="match-item-pane" style="padding: 14px;">
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Reported Lost Item</div>
            <h4 style="font-size: 0.95rem; margin: 4px 0;">${lostCat.icon} ${escapeHTML(lostTitle)}</h4>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">📍 ${escapeHTML(lostItem?.location || 'Campus')}</div>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">${escapeHTML(lostItem?.description || '')}</p>
          </div>

          <div style="display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--accent);">
            ⚡ VS ⚡
          </div>

          <div class="match-item-pane" style="padding: 14px;">
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Recovered Found Item</div>
            <h4 style="font-size: 0.95rem; margin: 4px 0;">${foundCat.icon} ${escapeHTML(foundTitle)}</h4>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">📍 ${escapeHTML(foundItem?.location || 'Campus')}</div>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">${escapeHTML(foundItem?.description || '')}</p>
          </div>
        </div>

        <!-- Claimant Verification Answer Quote -->
        <div style="background: rgba(255, 255, 255, 0.04); border-left: 3px solid var(--accent); padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--accent-light); font-weight: 700; margin-bottom: 4px;">
            <span>CLAIMANT VERIFICATION STATEMENT (${escapeHTML(claim.claimantName)})</span>
            <span>Contact: ${escapeHTML(claim.contact || 'alex.rivera@campus.edu')}</span>
          </div>
          <div style="font-size: 0.9rem; color: #fff; font-style: italic;">
            "${escapeHTML(claim.verificationAnswer)}"
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <button class="btn btn-danger" onclick="adminRejectClaim('${claim.id}')">
            ❌ Reject Claim
          </button>
          <button class="btn btn-accent-teal" onclick="adminApproveClaim('${claim.id}')">
            ✅ Approve Claim
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function adminApproveClaim(claimId) {
  const claim = appState.claims.find(c => c.id === claimId);
  if (!claim) return;

  claim.status = 'Verified';

  const lost = appState.lostReports.find(r => r.id === claim.lostReportId);
  if (lost) lost.status = 'Verified';

  const found = appState.foundReports.find(r => r.id === claim.foundReportId);
  if (found) found.status = 'Verified';

  

  appState.notifications.unshift({
    id: generateId('notif'),
    message: `🎉 Great news! Claim #${claim.id.slice(0, 8)} approved! Item verified for hand-over.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  saveData();
  renderAllViews();
  showToast('Claim approved! Owner notified 🎉', 'success');
}

function adminRejectClaim(claimId) {
  const claim = appState.claims.find(c => c.id === claimId);
  if (!claim) return;

  claim.status = 'Rejected';

  const lost = appState.lostReports.find(r => r.id === claim.lostReportId);
  if (lost) lost.status = 'Searching';

  const found = appState.foundReports.find(r => r.id === claim.foundReportId);
  if (found) found.status = 'Searching';

  saveData();
  renderAllViews();
  showToast('Claim rejected', 'warning');
}

function renderAdminVerified() {
  const container = document.getElementById('admin-verified-cards-list');
  if (!container) return;

  const verifiedItems = [
    ...appState.lostReports.filter(r => r.status === 'Verified').map(i => ({ ...i, itemType: 'Lost' })),
    ...appState.foundReports.filter(r => r.status === 'Verified').map(i => ({ ...i, itemType: 'Found' }))
  ];

  if (verifiedItems.length === 0) {
    container.innerHTML = `
      <div class="glass-card empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">🤝</div>
        <p>No verified items waiting for physical return.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = verifiedItems.map(item => {
    const cat = CATEGORY_MAP[item.category] || { label: 'Item', icon: '📦' };

    return `
      <div class="glass-card report-item-card">
        <div class="report-item-top">
          <div class="item-category-avatar">${cat.icon}</div>
          <span class="badge badge-verified">Verified • Ready for Pick-Up</span>
        </div>
        <div class="report-item-body">
          <h4>${escapeHTML(item.title)}</h4>
          <p>${escapeHTML(item.description || '')}</p>
        </div>
        <div class="report-details-list">
          <span>📍 Storage: <strong>${escapeHTML(item.location)}</strong></span>
          <span>📅 Verified on: ${getTimeAgo(item.createdAt)}</span>
        </div>
        <div style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
          <button class="btn btn-sm btn-secondary" onclick="openQrModal('${item.id}')">
            🏷️ QR Tag
          </button>
          <button class="btn btn-primary btn-sm" onclick="openAdminHandoverModal('${item.id}', '${item.itemType ? item.itemType.toLowerCase() : "found"}')">
            🤝 Safe Handover
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function adminMarkReturned(itemId) {
  const lost = appState.lostReports.find(r => r.id === itemId);
  if (lost) lost.status = 'Returned';

  const found = appState.foundReports.find(r => r.id === itemId);
  if (found) found.status = 'Returned';

  const claim = appState.claims.find(c => c.lostReportId === itemId || c.foundReportId === itemId);
  if (claim) {
    claim.status = 'Returned';
    const associatedLost = appState.lostReports.find(r => r.id === claim.lostReportId);
    if (associatedLost) associatedLost.status = 'Returned';
    const associatedFound = appState.foundReports.find(r => r.id === claim.foundReportId);
    if (associatedFound) associatedFound.status = 'Returned';
  }

  

  saveData();
  renderAllViews();
  showToast('Item marked Returned and handed over to owner! 🤝', 'success');
}

function renderAdminExpired() {
  const container = document.getElementById('admin-expired-list');
  if (!container) return;

  const expiredItems = [
    ...appState.lostReports.filter(isItemExpired).map(i => ({ ...i, itemType: 'Lost' })),
    ...appState.foundReports.filter(isItemExpired).map(i => ({ ...i, itemType: 'Found' }))
  ];

  if (expiredItems.length === 0) {
    container.innerHTML = `
      <div class="glass-card empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">⏳</div>
        <p>No aging items (>30 days) found in the campus registry.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = expiredItems.map(item => {
    const cat = CATEGORY_MAP[item.category] || { label: 'Item', icon: '📦' };

    return `
      <div class="glass-card report-item-card">
        <div class="report-item-top">
          <div class="item-category-avatar">${cat.icon}</div>
          <span class="badge badge-urgent">Aging &gt; 30 Days</span>
        </div>
        <div class="report-item-body">
          <h4>${escapeHTML(item.title)}</h4>
          <p>${escapeHTML(item.description || '')}</p>
        </div>
        <div class="report-details-list">
          <span>📍 Storage: <strong>${escapeHTML(item.location)}</strong></span>
          <span>📅 Date Logged: ${getTimeAgo(item.createdAt)}</span>
          <span>Status: <strong>${escapeHTML(item.status)}</strong></span>
        </div>
        <div style="margin-top: 12px; display: flex; justify-content: flex-end; gap: 8px;">
          <button class="btn btn-sm btn-secondary" onclick="adminArchiveItem('${item.id}')">
            📁 Archive
          </button>
          <button class="btn btn-sm btn-accent-teal" onclick="adminDonateItem('${item.id}')">
            🎁 Donate to Charity
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function adminArchiveItem(itemId) {
  const lost = appState.lostReports.find(r => r.id === itemId);
  if (lost) lost.status = 'Archived';

  const found = appState.foundReports.find(r => r.id === itemId);
  if (found) found.status = 'Archived';

  saveData();
  renderAllViews();
  showToast('Item status updated to Archived 📁', 'info');
}

function adminDonateItem(itemId) {
  const lost = appState.lostReports.find(r => r.id === itemId);
  if (lost) lost.status = 'Donated';

  const found = appState.foundReports.find(r => r.id === itemId);
  if (found) found.status = 'Donated';

  saveData();
  renderAllViews();
  showToast('Item allocated to Campus Charity Donation 🎁', 'success');
}
