/* ==========================================================================
   STUDENT HOME FEEDS (My Reports, Possible Matches, Alerts)
   ========================================================================== */
function renderStudentHomeFeeds() {
  // 1. My Reports Feed
  const myReportsEl = document.getElementById('student-home-my-reports');
  if (myReportsEl) {
    const allUserReports = [
      ...appState.lostReports.map(r => ({ ...r, itemType: 'Lost' })),
      ...appState.foundReports.map(r => ({ ...r, itemType: 'Found' }))
    ].slice(0, 3);

    if (allUserReports.length === 0) {
      myReportsEl.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem;">No reports submitted yet.</p>';
    } else {
      myReportsEl.innerHTML = allUserReports.map(item => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-subtle);">
          <div>
            <div style="font-weight:600;font-size:0.92rem;color:var(--text-primary);">${escapeHTML(item.title)}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">📍 ${escapeHTML(item.location)} • ${getTimeAgo(item.createdAt)}</div>
          </div>
          <div>${getStatusBadgeHTML(item.status)}</div>
        </div>
      `).join('');
    }
  }

  // 2. Possible Matches Feed
  const matchesEl = document.getElementById('student-home-matches');
  if (matchesEl) {
    const matches = calculateMatchesList().slice(0, 2);
    if (matches.length === 0) {
      matchesEl.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem;">No possible matches yet.</p>';
    } else {
      matchesEl.innerHTML = matches.map(m => `
        <div style="padding:10px 0;border-bottom:1px solid var(--border-subtle);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong style="font-size:0.92rem;color:var(--text-primary);">${escapeHTML(m.lost.title)}</strong>
            <span style="font-size:0.8rem;font-weight:700;color:var(--teal-bright);background:rgba(20,184,166,0.12);padding:2px 8px;border-radius:12px;">${m.score}% Match</span>
          </div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">Found at: ${escapeHTML(m.found.location)}</div>
        </div>
      `).join('');
    }
  }

  // 3. Alerts Feed
  const alertsEl = document.getElementById('student-home-alerts');
  if (alertsEl) {
    const notifs = appState.notifications.slice(0, 3);
    if (notifs.length === 0) {
      alertsEl.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem;">No new alerts.</p>';
    } else {
      alertsEl.innerHTML = notifs.map(n => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-subtle);font-size:0.85rem;">
          <i data-lucide="bell" style="width:14px;height:14px;color:var(--color-warning);flex-shrink:0;"></i>
          <span style="flex:1;color:var(--text-primary);">${escapeHTML(n.message)}</span>
          <span style="font-size:0.72rem;color:var(--text-muted);">${getTimeAgo(n.createdAt)}</span>
        </div>
      `).join('');
    }
  }

  if (window.lucide) window.lucide.createIcons();
}
