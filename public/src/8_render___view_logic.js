/* ==========================================================================
   RENDER & VIEW LOGIC
   ========================================================================== */
function renderAllViews() {
  updateIndicatorPills();
  renderNotifications();
  renderDashboardActivity();
  animateStatCounters();
  renderAIMatches();
  renderMyReports(currentMyReportsTab);
  renderAdminDesk();
  if (typeof renderProfile === 'function') {
    renderProfile();
  }
  if (typeof updateAdminMetricsAndPills === 'function') {
    updateAdminMetricsAndPills();
  }
}

function updateIndicatorPills() {
  // AI Matches badge in sidebar
  const matchCount = calculateMatchesList().length;
  const matchBadge = document.getElementById('sidebar-matches-badge');
  if (matchBadge) matchBadge.textContent = matchCount;

  // Unread notification badge
  const unreadCount = appState.notifications.filter(n => !n.read).length;
  const notifCountEl = document.getElementById('notif-count');
  if (notifCountEl) {
    notifCountEl.textContent = unreadCount;
    notifCountEl.style.display = unreadCount > 0 ? 'flex' : 'none';
  }
}

/* --- STATS & COUNTERS --- */
function animateStatCounters() {
  const totalReports = appState.lostReports.length + appState.foundReports.length;
  const matchesCount = calculateMatchesList().length;
  const recoveredCount = appState.lostReports.filter(i => i.status === 'Returned' || i.status === 'Verified').length;
  const pendingClaimsCount = appState.claims.filter(c => c.status !== 'Approved' && c.status !== 'Returned').length;

  animateCounter('stat-total-reports', totalReports);
  animateCounter('stat-ai-matches', matchesCount);
  animateCounter('stat-items-recovered', recoveredCount);
  animateCounter('stat-pending-claims', pendingClaimsCount);
}

function animateCounter(elementId, targetValue) {
  const el = document.getElementById(elementId);
  if (!el) return;

  let current = 0;
  const duration = 800; // ms
  const stepTime = 20;
  const totalSteps = duration / stepTime;
  const stepValue = Math.max(1, Math.ceil(targetValue / totalSteps));

  const timer = setInterval(() => {
    current += stepValue;
    if (current >= targetValue) {
      current = targetValue;
      clearInterval(timer);
    }
    el.textContent = current;
  }, stepTime);
}

/* --- DASHBOARD RECENT ACTIVITY --- */
function renderDashboardActivity() {
  const container = document.getElementById('dashboard-activity-list');
  if (!container) return;

  const allItems = [
    ...appState.lostReports.map(r => ({ ...r, type: 'Lost' })),
    ...appState.foundReports.map(r => ({ ...r, type: 'Found' }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (allItems.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <p>No reports yet. Lost something? Report it now!</p>
      </div>
    `;
    return;
  }

  const recent = allItems.slice(0, 5);
  container.innerHTML = recent.map(item => {
    const cat = CATEGORY_MAP[item.category] || { label: 'General', icon: '📦' };
    const badgeClass = getStatusBadgeClass(item.status);
    const reporterRole = item.reporterRole || 'student';

    return `
      <div class="activity-item">
        <div class="activity-item-info">
          <div class="avatar-wrap avatar-sm" style="margin-right: 12px;" title="Reported by Campus User">
            ${getAvatarSVG(reporterRole, 36)}
          </div>
          <div class="item-main-details">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 0.95rem;">${cat.icon}</span>
              <h4>${escapeHTML(item.title)}</h4>
            </div>
            <p>
              <span>${item.type === 'Lost' ? '🔴 Lost at' : '🟢 Found at'} ${escapeHTML(item.location)}</span>
              <span>•</span>
              <span class="time-ago-text">${getTimeAgo(item.createdAt)}</span>
            </p>
          </div>
        </div>
        <div class="activity-meta">
          <span class="badge ${badgeClass}">
            <span class="badge-dot"></span>
            ${item.status}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'Active':
    case 'Searching':
    case 'Looking': return 'badge-searching';
    case 'Pending':
    case 'Under Verification': return 'badge-pending';
    case 'Matched':
    case 'Possible Match': return 'badge-matched';
    case 'Claim Approved':
    case 'Approved': return 'badge-approved';
    case 'Claimed': return 'badge-claimed';
    case 'Verified': return 'badge-verified';
    case 'Returned': return 'badge-returned';
    case 'Recovered': return 'badge-recovered';
    case 'Closed': return 'badge-closed';
    case 'Expired': return 'badge-expired';
    default: return 'badge-searching';
  }
}
