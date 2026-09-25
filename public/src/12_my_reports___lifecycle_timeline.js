/* ==========================================================================
   MY REPORTS & LIFECYCLE TIMELINE
   ========================================================================== */
let currentMyReportsTab = 'lost';

function filterMyReportsTab(tab, btnEl) {
  currentMyReportsTab = tab;
  const parent = btnEl.parentElement;
  if (parent) {
    parent.querySelectorAll('.tab-pill').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
  }
  renderMyReports(tab);
}

const LIFECYCLE_STAGES = ['Reported', 'Matched', 'Claimed', 'Verified', 'Returned'];

function getStageIndex(status) {
  switch (status) {
    case 'Searching': return 0;
    case 'Matched': return 1;
    case 'Claimed': return 2;
    case 'Verified': return 3;
    case 'Returned': return 4;
    default: return 0;
  }
}

function renderLifecycleTimeline(status) {
  const currentIndex = getStageIndex(status);
  const percent = (currentIndex / (LIFECYCLE_STAGES.length - 1)) * 100;

  return `
    <div class="lifecycle-timeline">
      <div class="timeline-connector">
        <div class="timeline-connector-fill" style="width: ${percent}%;"></div>
      </div>
      ${LIFECYCLE_STAGES.map((st, idx) => {
        let cls = '';
        if (idx === currentIndex) cls = 'active';
        else if (idx < currentIndex) cls = 'completed';
        return `
          <div class="timeline-step ${cls}">
            <div class="timeline-dot"></div>
            <span class="timeline-label">${st}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderMyReports(tab = currentMyReportsTab) {
  const container = document.getElementById('my-reports-container');
  if (!container) return;

  const user = appState.user;
  const username = user ? (user.username || user.loginId || user.id) : null;
  const userRole = user ? (user.role || '').toLowerCase() : '';
  const isStaff = ['admin', 'supervisor', 'director'].includes(userRole);

  let rawList = [];
  if (tab === 'lost') {
    rawList = (appState.lostReports || []).map(i => ({ ...i, itemType: 'Lost' }));
  } else if (tab === 'found') {
    rawList = (appState.foundReports || []).map(i => ({ ...i, itemType: 'Found' }));
  } else {
    rawList = [
      ...(appState.lostReports || []).map(i => ({ ...i, itemType: 'Lost' })),
      ...(appState.foundReports || []).map(i => ({ ...i, itemType: 'Found' }))
    ];
  }

  // In "My Reports", students strictly see only their own reports.
  let items = rawList.filter(item => {
    if (!user) return false;
    const isOwner = (item.reporterId === username || item.reporterId === user.id || item.reporterName === user.name);
    return isOwner || (isStaff && item.reporterId === username);
  });

  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (items.length === 0) {
    container.innerHTML = `
      <div class="glass-card empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">📦</div>
        <p>You haven't reported anything yet.</p>
        <div style="margin-top: 14px;">
          <button class="btn btn-primary" onclick="showPage('${tab === 'lost' ? 'report-lost-page' : 'report-found-page'}')">
            Create ${tab === 'lost' ? 'Lost' : 'Found'} Report
          </button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => {
    const cat = CATEGORY_MAP[item.category] || { label: 'Item', icon: '📦' };
    const badgeClass = getStatusBadgeClass(item.status);
    const hasMatches = (item.status === 'Matched' || item.matchId);
    const isOwner = user && (item.reporterId === username || item.reporterId === user.id || item.reporterName === user.name);
    const canRemove = isOwner || isStaff;

    return `
      <div class="glass-card report-item-card">
        <div class="report-item-top">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${item.photo ? `<img src="${item.photo}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-glass);">` : `
              <div class="item-category-avatar">${cat.icon}</div>
            `}
            <div>
              <h4 style="font-size: 1rem; margin-bottom: 2px;">${escapeHTML(item.title)}</h4>
              <span class="sub-text">${cat.label}</span>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
            <span class="badge ${badgeClass}">
              <span class="badge-dot"></span> ${item.status}
            </span>
            ${item.priority === 'urgent' ? `<span class="badge badge-urgent">🔴 URGENT</span>` : ''}
          </div>
        </div>

        <div class="report-details-list">
          <span>📍 <strong>Location:</strong> ${escapeHTML(item.location)}</span>
          <span>🎨 <strong>Color:</strong> ${escapeHTML(item.color || 'N/A')} • <strong>Brand:</strong> ${escapeHTML(item.brand || 'N/A')}</span>
          <span>📅 <strong>Reported:</strong> ${getTimeAgo(item.createdAt)}</span>
        </div>

        <!-- Lifecycle Stages Timeline -->
        ${renderLifecycleTimeline(item.status)}

        <div class="report-item-footer" style="margin-top: 8px;">
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${hasMatches ? `
              <button class="btn btn-sm btn-accent-teal" onclick="showPage('matches-page')">
                🤖 View Matches
              </button>
            ` : ''}
            <button class="btn btn-sm btn-secondary" onclick="openQrModal('${item.id}')" title="View / Print QR Code Tag">
              🏷️ QR Tag
            </button>
            ${item.status === 'Verified' ? `
              <button class="btn btn-sm btn-primary" onclick="markItemAsReturned('${item.id}', '${item.itemType}')">
                ✅ Mark as Returned
              </button>
            ` : ''}
          </div>
          ${isOwner ? `
            <button class="btn btn-sm btn-danger" onclick="deleteReport('${item.id}', '${item.itemType}')" title="Delete Report">
              🗑️ Remove
            </button>
          ` : (isStaff ? `
            <button class="btn btn-sm btn-danger" onclick="deleteReport('${item.id}', '${item.itemType}')" title="Admin Moderation: Remove">
              🛡️ Admin Remove
            </button>
          ` : '')}
        </div>
      </div>
    `;
  }).join('');
}

function markItemAsReturned(id, itemType) {
  const list = (itemType === 'Lost') ? appState.lostReports : appState.foundReports;
  const item = list.find(r => r.id === id);
  if (item) {
    item.status = 'Returned';
    addKarma(25, 'Item Successfully Returned');
    saveData();
    renderAllViews();
    showToast(`"${item.title}" marked as Returned! Reunited successfully. 🎉`, 'success');
  }
}

async function deleteReport(id, type) {
  try {
    const res = await fetch(API_BASE + '/api/reports?id=' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      showToast(data.message || 'Failed to remove report.', 'error');
      return;
    }

    if (type === 'Lost') {
      appState.lostReports = appState.lostReports.filter(r => r.id !== id);
    } else {
      appState.foundReports = appState.foundReports.filter(r => r.id !== id);
    }
    saveData();
    renderAllViews();
    showToast('Report removed from registry', 'info');
  } catch (err) {
    showToast('Network error while removing report: ' + err.message, 'error');
  }
}
