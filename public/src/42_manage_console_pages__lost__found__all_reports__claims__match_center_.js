/* ==========================================================================
   MANAGE CONSOLE PAGES (LOST, FOUND, ALL REPORTS, CLAIMS, MATCH CENTER)
   ========================================================================== */

let currentClaimFilterTab = 'all';

// Ensure all reports have standard type and history array
function normalizeReportsData() {
  if (!appState.lostReports) appState.lostReports = [];
  if (!appState.foundReports) appState.foundReports = [];
  if (!appState.claims) appState.claims = [];

  appState.lostReports.forEach(r => {
    r.type = 'LOST';
    r.reportType = 'LOST';
    if (!r.history) {
      r.history = [
        { action: 'Report Created', timestamp: r.date || r.createdAt || new Date().toISOString(), author: r.reporterName || 'Student', note: 'Initial lost report registered on campus.' }
      ];
    }
  });

  appState.foundReports.forEach(r => {
    r.type = 'FOUND';
    r.reportType = 'FOUND';
    if (!r.history) {
      r.history = [
        { action: 'Report Registered', timestamp: r.date || r.createdAt || new Date().toISOString(), author: r.finderName || 'Finder', note: 'Found property logged into campus registry.' }
      ];
    }
  });
}

// Update Admin Navigation Badges & Dashboard Metrics
function updateAdminMetricsAndBadges() {
  normalizeReportsData();

  const lostCount = appState.lostReports.length;
  const foundCount = appState.foundReports.length;
  const claimsCount = (appState.claims || []).filter(c => c.status === 'Pending' || c.status === 'Under Verification').length;
  const helpCount = (appState.adminHelpRequests || []).filter(r => r.status === 'New').length;
  const recoveredCount = appState.lostReports.filter(r => r.status === 'Recovered').length +
                         appState.foundReports.filter(r => r.status === 'Returned').length;

  // Real Potential Matches calculation
  let totalPotentialMatches = 0;
  appState.lostReports.forEach(r => {
    const m = findMatches(r, 'lost');
    totalPotentialMatches += m.length;
  });

  // Sidebar badges
  const lostBadge = document.getElementById('sidebar-admin-lost-badge');
  const foundBadge = document.getElementById('sidebar-admin-found-badge');
  const claimsBadge = document.getElementById('sidebar-admin-claims-badge');
  const matchesBadge = document.getElementById('sidebar-admin-matches-badge');
  const helpBadge = document.getElementById('sidebar-admin-help-badge');

  if (lostBadge) lostBadge.textContent = lostCount;
  if (foundBadge) foundBadge.textContent = foundCount;
  if (claimsBadge) claimsBadge.textContent = claimsCount;
  if (matchesBadge) matchesBadge.textContent = totalPotentialMatches;
  if (helpBadge) {
    helpBadge.textContent = helpCount;
    helpBadge.style.display = helpCount > 0 ? 'inline-block' : 'none';
  }

  // Dashboard metric cards
  const statLost = document.getElementById('admin-stat-lost-reports');
  const statFound = document.getElementById('admin-stat-found-reports');
  const statMatches = document.getElementById('admin-stat-potential-matches');
  const statClaims = document.getElementById('admin-stat-pending-claims');
  const statUrgent = document.getElementById('admin-stat-urgent-cases');
  const statRecovered = document.getElementById('admin-stat-recovered-items');

  if (statLost) statLost.textContent = lostCount;
  if (statFound) statFound.textContent = foundCount;
  if (statMatches) statMatches.textContent = totalPotentialMatches;
  if (statClaims) statClaims.textContent = claimsCount;
  if (statUrgent) statUrgent.textContent = helpCount;
  if (statRecovered) statRecovered.textContent = recoveredCount;
}

/* --------------------------------------------------------------------------
   1. LOST ITEMS PAGE (#admin-lost-page)
   -------------------------------------------------------------------------- */
function renderAdminLostPage() {
  normalizeReportsData();
  updateAdminMetricsAndBadges();

  const tbody = document.getElementById('admin-lost-table-tbody');
  if (!tbody) return;

  const searchVal = (document.getElementById('admin-lost-search-input')?.value || '').toLowerCase().trim();
  const catVal = document.getElementById('admin-lost-filter-category')?.value || '';
  const locVal = document.getElementById('admin-lost-filter-location')?.value || '';
  const statusVal = document.getElementById('admin-lost-filter-status')?.value || '';
  const sortVal = document.getElementById('admin-lost-filter-sort')?.value || 'newest';

  let list = [...appState.lostReports];

  // Update Metric Pills
  const totalEl = document.getElementById('admin-lost-metric-total');
  const lookingEl = document.getElementById('admin-lost-metric-looking');
  const matchesEl = document.getElementById('admin-lost-metric-matches');
  const claimsEl = document.getElementById('admin-lost-metric-claims');
  const recoveredEl = document.getElementById('admin-lost-metric-recovered');

  if (totalEl) totalEl.textContent = list.length;
  if (lookingEl) lookingEl.textContent = list.filter(r => r.status === 'Active' || r.status === 'Looking').length;
  if (matchesEl) matchesEl.textContent = list.filter(r => r.status === 'Possible Match' || ((r.status === 'Active') && (appState.matches || []).some(m => m.lostReportId === r.id))).length;
  if (claimsEl) claimsEl.textContent = list.filter(r => r.status === 'Claim Submitted' || r.status === 'Under Verification' || r.status === 'Pending' || r.status === 'Claim Approved').length;
  if (recoveredEl) recoveredEl.textContent = list.filter(r => r.status === 'Recovered' || r.status === 'Returned').length;

  // Filter
  if (searchVal) {
    list = list.filter(r => 
      (r.id && r.id.toLowerCase().includes(searchVal)) ||
      (r.title && r.title.toLowerCase().includes(searchVal)) ||
      (r.description && r.description.toLowerCase().includes(searchVal)) ||
      (r.brand && r.brand.toLowerCase().includes(searchVal)) ||
      (r.reporterName && r.reporterName.toLowerCase().includes(searchVal))
    );
  }

  if (catVal) list = list.filter(r => r.category === catVal);
  if (locVal) list = list.filter(r => r.location === locVal);
  if (statusVal) list = list.filter(r => r.status === statusVal);

  // Sort
  if (sortVal === 'oldest') {
    list.sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
  } else if (sortVal === 'title') {
    list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  } else {
    list.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  }

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; padding: 40px 16px; color: var(--text-muted);">
          <i data-lucide="file-question" style="width: 36px; height: 36px; color: var(--teal-bright); margin: 0 auto 8px; display: block;"></i>
          No lost-item reports found matching current filters.
        </td>
      </tr>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  tbody.innerHTML = list.map(item => {
    const cat = CATEGORY_MAP[item.category] || { label: 'Item', icon: '📦' };
    const matches = findMatches(item, 'lost');
    const matchBadge = matches.length > 0
      ? `<span class="badge badge-matched" style="cursor: pointer;" onclick="viewMatchesForReport('${item.id}', 'lost')">${matches.length} Match${matches.length > 1 ? 'es' : ''} (${matches[0].score}%)</span>`
      : '<span style="font-size: 0.75rem; color: var(--text-muted);">No match</span>';

    return `
      <tr>
        <td>
          <span style="font-weight: 700; font-family: monospace; color: var(--teal-bright); font-size: 0.82rem;">${item.id}</span>
          ${item.priority === 'urgent' ? '<span class="badge badge-urgent" style="display: block; width: fit-content; margin-top: 2px; font-size: 0.65rem;">🔴 URGENT</span>' : ''}
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            ${item.photo ? `<img src="${item.photo}" alt="${escapeHTML(item.title)}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-subtle);">` : `<div style="width: 44px; height: 44px; border-radius: 6px; background: var(--bg-subtle); display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">${cat.icon}</div>`}
            <div>
              <strong style="font-size: 0.92rem; color: var(--text-primary); display: block;">${escapeHTML(item.title)}</strong>
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(item.description || 'No description')}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="sub-text">${cat.icon} ${escapeHTML(cat.label)}</span>
        </td>
        <td style="font-size: 0.8rem; color: var(--text-secondary);">
          <div>🎨 ${escapeHTML(item.color || 'Unspecified')}</div>
          ${item.brand ? `<div style="color: var(--text-muted); font-size: 0.75rem;">🏷️ ${escapeHTML(item.brand)}</div>` : ''}
        </td>
        <td style="font-size: 0.82rem; color: var(--text-secondary);">
          📍 ${escapeHTML(item.location || 'Campus')}
        </td>
        <td style="font-size: 0.78rem; color: var(--text-muted); white-space: nowrap;">
          ${formatDateTime(item.date || item.createdAt)}
        </td>
        <td style="font-size: 0.8rem;">
          <div style="font-weight: 600; color: var(--text-primary);">${escapeHTML(item.reporterName || 'Student')}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${(item.sharePhone || item.phoneSharingConsent) && (item.phone || item.phoneNumber || item.phone_number) ? '📞 ' + escapeHTML(item.phone || item.phoneNumber || item.phone_number) : ((item.phone || item.phoneNumber || item.hasPhoneProvided) ? '🔒 Private' : 'ℹ️ No phone')}</div>
        </td>
        <td>
          ${getStatusBadgeHTML(item.status)}
        </td>
        <td>
          ${matchBadge}
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <div style="display: inline-flex; gap: 6px;">
            <button type="button" class="btn btn-sm btn-secondary" onclick="openReportDetailsModal('${item.id}')" title="View Details">
              <i data-lucide="eye"></i>
            </button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="openStatusUpdateModal('${item.id}')" title="Update Status">
              <i data-lucide="edit-3"></i>
            </button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="openReportHistoryModal('${item.id}')" title="View Lifecycle History">
              <i data-lucide="history"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function handleAdminLostFilterChange() {
  renderAdminLostPage();
}

function getAiStatusBadgeHTML(item) {
  const analysis = item?.aiAnalysis || item?.ai_analysis;
  if (!analysis) {
    if (item?.photo && item.photo.trim()) {
      return '<span class="badge" style="background: rgba(148, 163, 184, 0.15); color: var(--text-muted); font-size: 0.68rem; margin-top: 3px; display: inline-block;">AI Pending</span>';
    }
    return '';
  }
  if (analysis.status === 'completed') {
    const cls = analysis.visualSummary?.primaryClass || 'Object';
    return `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10B981; font-size: 0.68rem; margin-top: 3px; display: inline-block;" title="YOLO Detection: ${escapeHTML(cls)}">✓ AI: ${escapeHTML(cls)}</span>`;
  }
  if (analysis.status === 'failed') {
    return '<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #EF4444; font-size: 0.68rem; margin-top: 3px; display: inline-block;">! AI Unavailable</span>';
  }
  if (analysis.status === 'processing') {
    return '<span class="badge" style="background: rgba(59, 130, 246, 0.15); color: #3B82F6; font-size: 0.68rem; margin-top: 3px; display: inline-block;">Analyzing...</span>';
  }
  return '';
}

/* --------------------------------------------------------------------------
   2. FOUND ITEMS PAGE (#admin-found-page)
   -------------------------------------------------------------------------- */
function renderAdminFoundPage() {
  normalizeReportsData();
  updateAdminMetricsAndBadges();

  const tbody = document.getElementById('admin-found-table-tbody');
  if (!tbody) return;

  const searchVal = (document.getElementById('admin-found-search-input')?.value || '').toLowerCase().trim();
  const catVal = document.getElementById('admin-found-filter-category')?.value || '';
  const locVal = document.getElementById('admin-found-filter-location')?.value || '';
  const statusVal = document.getElementById('admin-found-filter-status')?.value || '';
  const custodyVal = document.getElementById('admin-found-filter-custody')?.value || '';
  const sortVal = document.getElementById('admin-found-filter-sort')?.value || 'newest';

  let list = [...appState.foundReports];

  // Update Metric Pills
  const totalEl = document.getElementById('admin-found-metric-total');
  const lockersEl = document.getElementById('admin-found-metric-lockers');
  const finderEl = document.getElementById('admin-found-metric-finder');
  const matchesEl = document.getElementById('admin-found-metric-matches');
  const returnedEl = document.getElementById('admin-found-metric-returned');

  if (totalEl) totalEl.textContent = list.length;
  if (lockersEl) lockersEl.textContent = list.filter(r => (r.custody || '').toLowerCase().includes('desk') || (r.custody || '').toLowerCase().includes('office')).length;
  if (finderEl) finderEl.textContent = list.filter(r => (r.custody || '').toLowerCase().includes('finder') || (r.custody || '').toLowerCase().includes('me')).length;
  if (matchesEl) matchesEl.textContent = list.filter(r => r.status === 'Possible Owner' || r.status === 'Possible Match' || ((r.status === 'Active') && (appState.matches || []).some(m => m.foundReportId === r.id))).length;
  if (returnedEl) returnedEl.textContent = list.filter(r => r.status === 'Returned' || r.status === 'Recovered').length;

  // Filter
  if (searchVal) {
    list = list.filter(r => 
      (r.id && r.id.toLowerCase().includes(searchVal)) ||
      (r.title && r.title.toLowerCase().includes(searchVal)) ||
      (r.description && r.description.toLowerCase().includes(searchVal)) ||
      (r.finderName && r.finderName.toLowerCase().includes(searchVal))
    );
  }

  if (catVal) list = list.filter(r => r.category === catVal);
  if (locVal) list = list.filter(r => r.location === locVal);
  if (statusVal) list = list.filter(r => r.status === statusVal);
  if (custodyVal === 'desk') list = list.filter(r => (r.custody || '').toLowerCase().includes('desk'));
  if (custodyVal === 'finder') list = list.filter(r => (r.custody || '').toLowerCase().includes('finder') || (r.custody || '').toLowerCase().includes('me'));

  // Sort
  if (sortVal === 'oldest') {
    list.sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
  } else if (sortVal === 'title') {
    list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  } else {
    list.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  }

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; padding: 40px 16px; color: var(--text-muted);">
          <i data-lucide="package" style="width: 36px; height: 36px; color: var(--teal-bright); margin: 0 auto 8px; display: block;"></i>
          No found-item reports found matching current filters.
        </td>
      </tr>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  tbody.innerHTML = list.map(item => {
    const cat = CATEGORY_MAP[item.category] || { label: 'Item', icon: '📦' };
    const matches = findMatches(item, 'found');
    const matchBadge = matches.length > 0
      ? `<span class="badge badge-matched" style="cursor: pointer;" onclick="viewMatchesForReport('${item.id}', 'found')">${matches.length} Owner${matches.length > 1 ? 's' : ''} (${matches[0].score}%)</span>`
      : '<span style="font-size: 0.75rem; color: var(--text-muted);">Searching...</span>';

    return `
      <tr>
        <td>
          <span style="font-weight: 700; font-family: monospace; color: var(--teal-bright); font-size: 0.82rem;">${item.id}</span>
          <span class="badge badge-verified" style="display: block; width: fit-content; margin-top: 2px; font-size: 0.65rem;">${escapeHTML(item.custody || 'Security Desk')}</span>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            ${item.photo ? `<img src="${item.photo}" alt="${escapeHTML(item.title)}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-subtle);">` : `<div style="width: 44px; height: 44px; border-radius: 6px; background: var(--bg-subtle); display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">${cat.icon}</div>`}
            <div>
              <strong style="font-size: 0.92rem; color: var(--text-primary); display: block;">${escapeHTML(item.title)}</strong>
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(item.description || 'No description')}</span>
              ${getAiStatusBadgeHTML(item)}
            </div>
          </div>
        </td>
        <td>
          <span class="sub-text">${cat.icon} ${escapeHTML(cat.label)}</span>
        </td>
        <td style="font-size: 0.8rem; color: var(--text-secondary);">
          <div>🎨 ${escapeHTML(item.color || 'Unspecified')}</div>
          ${item.brand ? `<div style="color: var(--text-muted); font-size: 0.75rem;">🏷️ ${escapeHTML(item.brand)}</div>` : ''}
        </td>
        <td style="font-size: 0.82rem; color: var(--text-secondary);">
          📍 ${escapeHTML(item.location || 'Campus')}
        </td>
        <td style="font-size: 0.78rem; color: var(--text-muted); white-space: nowrap;">
          ${formatDateTime(item.date || item.createdAt)}
        </td>
        <td style="font-size: 0.8rem;">
          <div style="font-weight: 600; color: var(--text-primary);">${escapeHTML(item.finderName || 'Campus Staff')}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${(item.sharePhone || item.phoneSharingConsent) && (item.phone || item.phoneNumber || item.phone_number) ? '📞 ' + escapeHTML(item.phone || item.phoneNumber || item.phone_number) : ((item.phone || item.phoneNumber || item.hasPhoneProvided) ? '🔒 Private / Desk' : 'ℹ️ No phone')}</div>
        </td>
        <td>
          ${getStatusBadgeHTML(item.status)}
        </td>
        <td>
          ${matchBadge}
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <div style="display: inline-flex; gap: 6px;">
            <button type="button" class="btn btn-sm btn-secondary" onclick="openReportDetailsModal('${item.id}')" title="View Details">
              <i data-lucide="eye"></i>
            </button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="openAdminHandoverModal('${item.id}', 'found')" title="Safe Handover">
              <i data-lucide="package-check"></i>
            </button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="openStatusUpdateModal('${item.id}')" title="Update Status">
              <i data-lucide="edit-3"></i>
            </button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="openReportHistoryModal('${item.id}')" title="Lifecycle History">
              <i data-lucide="history"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function handleAdminFoundFilterChange() {
  renderAdminFoundPage();
}

/* --------------------------------------------------------------------------
   3. ALL REPORTS PAGE COMBINED (#admin-all-page)
   -------------------------------------------------------------------------- */
function renderAdminAllReportsPage() {
  normalizeReportsData();
  updateAdminMetricsAndBadges();

  const tbody = document.getElementById('admin-all-table-tbody');
  if (!tbody) return;

  const searchVal = (document.getElementById('admin-all-search-input')?.value || '').toLowerCase().trim();
  const typeVal = document.getElementById('admin-all-filter-type')?.value || '';
  const catVal = document.getElementById('admin-all-filter-category')?.value || '';
  const locVal = document.getElementById('admin-all-filter-location')?.value || '';
  const statusVal = document.getElementById('admin-all-filter-status')?.value || '';
  const sortVal = document.getElementById('admin-all-filter-sort')?.value || 'newest';

  // Combine both collections with explicit type
  let list = [
    ...appState.lostReports.map(r => ({ ...r, displayType: 'LOST' })),
    ...appState.foundReports.map(r => ({ ...r, displayType: 'FOUND' }))
  ];

  // Filters
  if (typeVal) {
    list = list.filter(r => r.displayType === typeVal);
  }

  if (searchVal) {
    list = list.filter(r => 
      (r.id && r.id.toLowerCase().includes(searchVal)) ||
      (r.title && r.title.toLowerCase().includes(searchVal)) ||
      (r.description && r.description.toLowerCase().includes(searchVal)) ||
      (r.reporterName && r.reporterName.toLowerCase().includes(searchVal)) ||
      (r.finderName && r.finderName.toLowerCase().includes(searchVal))
    );
  }

  if (catVal) list = list.filter(r => r.category === catVal);
  if (locVal) list = list.filter(r => r.location === locVal);
  if (statusVal) list = list.filter(r => r.status === statusVal);

  // Sort
  if (sortVal === 'oldest') {
    list.sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
  } else if (sortVal === 'title') {
    list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  } else {
    list.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  }

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; padding: 40px 16px; color: var(--text-muted);">
          <i data-lucide="clipboard-list" style="width: 36px; height: 36px; color: var(--teal-bright); margin: 0 auto 8px; display: block;"></i>
          No reports found matching selected criteria.
        </td>
      </tr>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  tbody.innerHTML = list.map(item => {
    const isLost = item.displayType === 'LOST';
    const cat = CATEGORY_MAP[item.category] || { label: 'Item', icon: '📦' };
    const personName = isLost ? (item.reporterName || 'Student') : (item.finderName || 'Finder');

    return `
      <tr>
        <td>
          <span class="badge ${isLost ? 'badge-type-lost' : 'badge-type-found'}">
            ${isLost ? '🔴 LOST' : '🟢 FOUND'}
          </span>
        </td>
        <td>
          <span style="font-weight: 700; font-family: monospace; color: var(--teal-bright); font-size: 0.82rem;">${item.id}</span>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            ${item.photo ? `<img src="${item.photo}" alt="${escapeHTML(item.title)}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-subtle);">` : `<div style="width: 40px; height: 40px; border-radius: 6px; background: var(--bg-subtle); display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">${cat.icon}</div>`}
            <div>
              <strong style="font-size: 0.92rem; color: var(--text-primary); display: block;">${escapeHTML(item.title)}</strong>
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(item.description || 'No description')}</span>
            </div>
          </div>
        </td>
        <td>${cat.icon} ${escapeHTML(cat.label)}</td>
        <td style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHTML(item.color || 'Unspecified')}</td>
        <td style="font-size: 0.82rem; color: var(--text-secondary);">📍 ${escapeHTML(item.location || 'Campus')}</td>
        <td style="font-size: 0.78rem; color: var(--text-muted); white-space: nowrap;">${formatDateTime(item.date || item.createdAt)}</td>
        <td style="font-size: 0.8rem; font-weight: 600;">${escapeHTML(personName)}</td>
        <td>${getStatusBadgeHTML(item.status)}</td>
        <td style="text-align: right; white-space: nowrap;">
          <button type="button" class="btn btn-sm btn-secondary" onclick="openReportDetailsModal('${item.id}')" title="View Details">
            <i data-lucide="eye"></i>
          </button>
          <button type="button" class="btn btn-sm btn-secondary" onclick="openQrModal('${item.id}')" title="QR Tag">
            <i data-lucide="qr-code"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function handleAdminAllFilterChange() {
  renderAdminAllReportsPage();
}

/* --------------------------------------------------------------------------
   4. CLAIMS & VERIFICATION MODULE (#admin-claims-page)
   -------------------------------------------------------------------------- */
function filterAdminClaimsTab(tabKey, btnEl) {
  currentClaimFilterTab = tabKey;
  const buttons = document.querySelectorAll('.admin-claims-tab');
  buttons.forEach(b => {
    b.classList.remove('active');
    b.classList.add('btn-secondary');
  });

  if (btnEl) {
    btnEl.classList.add('active');
    btnEl.classList.remove('btn-secondary');
  }

  renderAdminClaimsPage(tabKey);
}

function handleAdminClaimsFilterChange() {
  renderAdminClaimsPage(currentClaimFilterTab);
}

function renderAdminClaimsPage(filterTab = currentClaimFilterTab) {
  normalizeReportsData();
  updateAdminMetricsAndBadges();

  currentClaimFilterTab = filterTab;
  const tbody = document.getElementById('admin-claims-table-tbody');
  if (!tbody) return;

  const claims = appState.claims || [];

  // Metrics
  const totalEl = document.getElementById('admin-claims-metric-total');
  const pendingEl = document.getElementById('admin-claims-metric-pending');
  const verifEl = document.getElementById('admin-claims-metric-verification');
  const approvedEl = document.getElementById('admin-claims-metric-approved');
  const completedEl = document.getElementById('admin-claims-metric-completed');

  if (totalEl) totalEl.textContent = claims.length;
  if (pendingEl) pendingEl.textContent = claims.filter(c => c.status === 'Pending').length;
  if (verifEl) verifEl.textContent = claims.filter(c => c.status === 'Under Verification').length;
  if (approvedEl) approvedEl.textContent = claims.filter(c => c.status === 'Approved').length;
  if (completedEl) completedEl.textContent = claims.filter(c => c.status === 'Completed').length;

  let filtered = [...claims];
  if (filterTab !== 'all') {
    filtered = filtered.filter(c => c.status === filterTab);
  }

  const searchVal = (document.getElementById('admin-claims-search-input')?.value || '').toLowerCase().trim();
  if (searchVal) {
    filtered = filtered.filter(c => 
      (c.id && c.id.toLowerCase().includes(searchVal)) ||
      (c.claimantName && c.claimantName.toLowerCase().includes(searchVal)) ||
      (c.claimantId && c.claimantId.toLowerCase().includes(searchVal)) ||
      (c.itemTitle && c.itemTitle.toLowerCase().includes(searchVal)) ||
      (c.verificationEvidence && c.verificationEvidence.toLowerCase().includes(searchVal))
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 40px 16px; color: var(--text-muted);">
          <i data-lucide="shield-check" style="width: 36px; height: 36px; color: var(--teal-bright); margin: 0 auto 8px; display: block;"></i>
          No claims require review under the "${escapeHTML(filterTab)}" tab.
        </td>
      </tr>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  tbody.innerHTML = filtered.map(claim => {
    const lostReport = appState.lostReports.find(r => r.id === claim.lostReportId) || { title: claim.itemTitle || 'Lost Item' };
    const foundReport = appState.foundReports.find(r => r.id === claim.foundReportId) || { title: 'Found Item in Custody' };

    const statusBadge = 
      claim.status === 'Approved' ? '<span class="status-pill status-approved"><i data-lucide="check-circle-2"></i> Approved</span>' :
      claim.status === 'Under Verification' ? '<span class="status-pill status-checking"><i data-lucide="clock"></i> Under Verification</span>' :
      claim.status === 'Completed' ? '<span class="status-pill status-returned"><i data-lucide="package-check"></i> Completed / Returned</span>' :
      claim.status === 'Rejected' ? '<span class="status-pill status-rejected"><i data-lucide="x-circle"></i> Rejected</span>' :
      '<span class="status-pill status-waiting"><i data-lucide="clock"></i> Pending</span>';

    return `
      <tr>
        <td>
          <span style="font-weight: 700; font-family: monospace; color: var(--teal-bright); font-size: 0.84rem;">#${claim.id}</span>
          <span style="display: block; font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">${getTimeAgo(claim.createdAt)}</span>
        </td>
        <td>
          <strong style="color: var(--text-primary); font-size: 0.9rem; display: block;">${escapeHTML(lostReport.title)}</strong>
          <span style="font-size: 0.75rem; color: var(--text-muted);">ID: ${claim.lostReportId || '--'}</span>
        </td>
        <td>
          <strong style="color: var(--text-primary); font-size: 0.9rem; display: block;">${escapeHTML(foundReport.title)}</strong>
          <span style="font-size: 0.75rem; color: var(--text-muted);">ID: ${claim.foundReportId || '--'}</span>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--text-primary); font-size: 0.88rem;">${escapeHTML(claim.claimantName || 'Student')}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">ID: ${claim.claimantId || 'STU'} • ${(claim.sharePhone || claim.phoneSharingConsent) && (claim.claimantContact || claim.claimantPhone || claim.phone) ? '📞 ' + escapeHTML(claim.claimantContact || claim.claimantPhone || claim.phone) : ((claim.claimantContact || claim.claimantPhone || claim.phone) ? '🔒 Phone Private' : 'ℹ️ No phone')}</div>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--text-primary); font-size: 0.88rem;">${escapeHTML(claim.finderName || foundReport.finderName || 'Finder')}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHTML(foundReport.custody || 'Campus Desk')}</div>
        </td>
        <td>
          <span class="badge badge-matched" style="font-weight: 800; font-size: 0.82rem;">${claim.matchScore || 85}% AI Match</span>
        </td>
        <td>
          <div class="claim-evidence-box" style="padding: 6px 10px; font-size: 0.8rem; max-width: 260px;">
            <em>"${escapeHTML(claim.verificationEvidence || 'No private secret proof logged yet.')}"</em>
          </div>
        </td>
        <td>
          ${statusBadge}
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <div style="display: inline-flex; gap: 6px;">
            <button type="button" class="btn btn-sm btn-primary" onclick="openClaimReviewModal('${claim.id}')">
              <i data-lucide="shield-alert"></i>
              <span>Review Claim</span>
            </button>
            <button type="button" class="btn btn-sm btn-secondary" style="border-color: rgba(239, 68, 68, 0.4); color: #F87171;" onclick="openItemHelpModal('${claim.lostReportId}', '${escapeHTML(lostReport.title)}', '${escapeHTML(lostReport.location)}')">
              <span>🆘</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

/* --------------------------------------------------------------------------
   5. MATCH CENTER MODULE (#admin-matches-page)
   -------------------------------------------------------------------------- */
function renderAdminMatchCenterPage() {
  normalizeReportsData();
  updateAdminMetricsAndBadges();

  const container = document.getElementById('admin-matches-cards-container');
  if (!container) return;

  const threshold = parseInt(document.getElementById('admin-match-filter-threshold')?.value || '40', 10);
  const searchVal = (document.getElementById('admin-match-search-input')?.value || '').toLowerCase().trim();

  // Calculate candidate matches across all lost reports
  const allCandidateMatches = [];
  appState.lostReports.forEach(lost => {
    const candidateMatches = findMatches(lost, 'lost');
    candidateMatches.forEach(m => {
      if (m.score >= threshold) {
        allCandidateMatches.push(m);
      }
    });
  });

  // Filter by search
  let filtered = allCandidateMatches;
  if (searchVal) {
    filtered = filtered.filter(m => 
      (m.lost.title && m.lost.title.toLowerCase().includes(searchVal)) ||
      (m.found.title && m.found.title.toLowerCase().includes(searchVal)) ||
      (m.lost.description && m.lost.description.toLowerCase().includes(searchVal)) ||
      (m.found.description && m.found.description.toLowerCase().includes(searchVal)) ||
      (m.lost.location && m.lost.location.toLowerCase().includes(searchVal)) ||
      (m.found.location && m.found.location.toLowerCase().includes(searchVal))
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="glass-card empty-state" style="text-align: center; padding: 48px 20px;">
        <i data-lucide="sparkles" style="width: 44px; height: 44px; color: var(--ai-violet); margin: 0 auto 12px; display: block;"></i>
        <h3 style="color: var(--text-primary); margin-bottom: 6px;">No Potential Matches Found</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; max-width: 480px; margin: 0 auto;">
          The multi-signal engine considers category, text descriptions, visual attributes, colors, KSRCE landmarks, and timestamps. As new campus reports arrive, potential matches will automatically populate here.
        </p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = filtered.map(m => {
    const { lost, found, score, matchReasons, unmatchedReasons } = m;
    const lostCat = CATEGORY_MAP[lost.category] || { label: 'Item', icon: '📦' };
    const foundCat = CATEGORY_MAP[found.category] || { label: 'Item', icon: '📦' };
    const isClaimed = (appState.claims || []).some(c => c.lostReportId === lost.id && c.foundReportId === found.id);

    return `
      <div class="glass-card match-card" style="padding: 22px;">
        <div class="match-card-side-by-side">
          <!-- Left: Lost item -->
          <div class="match-item-pane">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span class="badge badge-searching"><span class="badge-dot"></span> Lost Report (#${lost.id})</span>
              ${lost.priority === 'urgent' ? '<span class="badge badge-urgent">🔴 URGENT</span>' : ''}
            </div>
            ${lost.photo ? `<img src="${lost.photo}" class="match-item-thumb" alt="Lost">` : `<div class="match-item-thumb" style="display:flex;align-items:center;justify-content:center;font-size:2.6rem;">${lostCat.icon}</div>`}
            <h4 style="font-size: 1.05rem; margin: 8px 0 2px;">${escapeHTML(lost.title)}</h4>
            <div class="sub-text">${lostCat.icon} ${lostCat.label} • 🎨 ${escapeHTML(lost.color || 'Unspecified')}</div>
            <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px;">📍 Last seen: <strong>${escapeHTML(lost.location)}</strong></div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">📅 ${getTimeAgo(lost.date || lost.createdAt)} by ${escapeHTML(lost.reporterName || 'Student')}</div>
          </div>

          <!-- Center: Large Animated Confidence Ring -->
          <div class="match-score-center" style="padding: 0 16px;">
            <div class="score-ring-wrap">
              <svg class="score-ring-svg" viewBox="0 0 100 100">
                <circle class="score-ring-bg" cx="50" cy="50" r="40"></circle>
                <circle class="score-ring-fill ${score > 70 ? 'score-green' : (score > 50 ? 'score-yellow' : 'score-red')}" cx="50" cy="50" r="40"
                  stroke-dasharray="251.2"
                  stroke-dashoffset="${251.2 - (score / 100) * 251.2}">
                </circle>
              </svg>
              <div class="score-text-inside" style="font-size: 1.25rem;">${score}%</div>
            </div>
            <span style="font-size: 0.72rem; text-transform: uppercase; color: var(--ai-violet-light); font-weight: 700; letter-spacing: 0.6px; margin-top: 4px;">Match Score</span>
          </div>

          <!-- Right: Found item -->
          <div class="match-item-pane">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span class="badge badge-matched"><span class="badge-dot"></span> Found Report (#${found.id})</span>
              <span class="sub-text" style="font-size: 0.75rem;">${escapeHTML(found.custody || 'Campus Desk')}</span>
            </div>
            ${found.photo ? `<img src="${found.photo}" class="match-item-thumb" alt="Found">` : `<div class="match-item-thumb" style="display:flex;align-items:center;justify-content:center;font-size:2.6rem;">${foundCat.icon}</div>`}
            <h4 style="font-size: 1.05rem; margin: 8px 0 2px;">${escapeHTML(found.title)}</h4>
            <div class="sub-text">${foundCat.icon} ${foundCat.label} • 🎨 ${escapeHTML(found.color || 'Unspecified')}</div>
            <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px;">📍 Found at: <strong>${escapeHTML(found.location)}</strong></div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">📅 ${getTimeAgo(found.date || found.createdAt)} by ${escapeHTML(found.finderName || 'Finder')}</div>
            ${found.aiAnalysis && found.aiAnalysis.status === 'completed' ? `
              <div style="margin-top: 6px;">
                <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10B981; font-size: 0.72rem; border: 1px solid rgba(16, 185, 129, 0.3);">
                  ✓ AI Analysis: ${escapeHTML(found.aiAnalysis.visualSummary?.primaryClass || 'Object')} detected
                </span>
              </div>
            ` : (found.aiAnalysis && found.aiAnalysis.status === 'failed' ? `
              <div style="margin-top: 6px;">
                <span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #EF4444; font-size: 0.72rem;">
                  ! AI Analysis Unavailable
                </span>
              </div>
            ` : '')}
          </div>
        </div>

        <!-- Explainable Matching Reasons -->
        <div class="explainable-reasons-box" style="margin-top: 16px;">
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted);">Explainable Correlation Signals</div>
          <div class="explainable-reasons-list">
            ${matchReasons.map(r => `<span class="reason-chip-matched">${r}</span>`).join('')}
            ${unmatchedReasons.map(r => `<span class="reason-chip-unmatched">${r}</span>`).join('')}
          </div>
        </div>

        <!-- Actions -->
        <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <button type="button" class="btn btn-outline" style="border-color: rgba(239, 68, 68, 0.4); color: #F87171; font-size: 0.82rem;" onclick="openItemHelpModal('${lost.id}', '${escapeHTML(lost.title)}', '${escapeHTML(lost.location)}')">
            <i data-lucide="shield-alert" style="width: 14px; height: 14px;"></i>
            <span>🆘 Need Help?</span>
          </button>

          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="openReportDetailsModal('${lost.id}')">
              <i data-lucide="eye"></i>
              <span>Review Details</span>
            </button>
            ${isClaimed ? `
              <span class="badge badge-verified" style="padding: 8px 14px; font-size: 0.82rem;">Claim in Verification</span>
            ` : `
              <button type="button" class="btn btn-accent-teal btn-sm" onclick="openCreateClaimModal('${lost.id}', '${found.id}')">
                <i data-lucide="hand"></i>
                <span>Create Claim</span>
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function handleAdminMatchFilterChange() {
  renderAdminMatchCenterPage();
}

function viewMatchesForReport(reportId, type) {
  showPage('admin-matches-page');
  const searchInput = document.getElementById('admin-match-search-input');
  const targetReport = (type === 'lost' ? appState.lostReports : appState.foundReports).find(r => r.id === reportId);
  if (searchInput && targetReport) {
    searchInput.value = targetReport.title;
    renderAdminMatchCenterPage();
  }
}
