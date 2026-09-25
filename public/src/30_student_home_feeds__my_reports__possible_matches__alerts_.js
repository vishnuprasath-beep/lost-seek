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
      myReportsEl.innerHTML = `
        <div style="text-align: center; padding: 24px 0; background: var(--bg-subtle); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle); margin-top: 12px;">
          <i data-lucide="folder-open" style="color: var(--text-muted); width: 32px; height: 32px; margin-bottom: 8px;"></i>
          <p style="color: var(--text-secondary); font-size: 0.95rem; font-weight: 500;">No reports submitted yet.</p>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">Items you report lost or found will appear here.</p>
        </div>
      `;
    } else {
      myReportsEl.innerHTML = allUserReports.map(item => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 12px;border-bottom:1px solid var(--border-subtle); margin-bottom: 4px; border-radius: var(--radius-sm); transition: background var(--transition-fast);" onmouseover="this.style.background='var(--bg-subtle)'" onmouseout="this.style.background='transparent'">
          <div>
            <div style="font-weight:700;font-size:0.95rem;color:var(--text-primary); margin-bottom: 2px;">${escapeHTML(item.title)}</div>
            <div style="font-size:0.8rem;color:var(--text-secondary);display:flex;align-items:center;gap:4px;">
              <i data-lucide="map-pin" style="width: 12px; height: 12px;"></i> ${escapeHTML(item.location)} <span style="opacity: 0.5;">•</span> ${getTimeAgo(item.createdAt)}
            </div>
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
      matchesEl.innerHTML = `
        <div style="text-align: center; padding: 24px 0; background: var(--bg-subtle); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle); margin-top: 12px;">
          <i data-lucide="sparkles" style="color: var(--text-muted); width: 32px; height: 32px; margin-bottom: 8px;"></i>
          <p style="color: var(--text-secondary); font-size: 0.95rem; font-weight: 500;">No AI matches found.</p>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">We'll notify you if an item matches yours.</p>
        </div>
      `;
    } else {
      matchesEl.innerHTML = matches.map(m => `
        <div style="padding:14px 12px;border-bottom:1px solid var(--border-subtle); margin-bottom: 4px; border-radius: var(--radius-sm); transition: background var(--transition-fast);" onmouseover="this.style.background='var(--bg-subtle)'" onmouseout="this.style.background='transparent'">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong style="font-size:0.95rem;color:var(--text-primary);">${escapeHTML(m.lost.title)}</strong>
            <span style="font-size:0.8rem;font-weight:700;color:var(--teal-bright);background:var(--color-success-bg);padding:4px 10px;border-radius:var(--radius-full);">${m.score}% Match</span>
          </div>
          <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:6px;display:flex;align-items:center;gap:4px;">
            <i data-lucide="package" style="width: 14px; height: 14px; color: var(--text-muted);"></i> Found at: ${escapeHTML(m.found.location)}
          </div>
        </div>
      `).join('');
    }
  }

  // 3. Alerts Feed
  const alertsEl = document.getElementById('student-home-alerts');
  if (alertsEl) {
    const notifs = appState.notifications.slice(0, 3);
    if (notifs.length === 0) {
      alertsEl.innerHTML = `
        <div style="text-align: center; padding: 24px 0; background: var(--bg-subtle); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle); margin-top: 12px;">
          <i data-lucide="bell-off" style="color: var(--text-muted); width: 32px; height: 32px; margin-bottom: 8px;"></i>
          <p style="color: var(--text-secondary); font-size: 0.95rem; font-weight: 500;">No new alerts.</p>
        </div>
      `;
    } else {
      alertsEl.innerHTML = notifs.map(n => `
        <div style="display:flex;align-items:flex-start;gap:12px;padding:12px;border-bottom:1px solid var(--border-subtle); border-radius: var(--radius-sm); transition: background var(--transition-fast);" onmouseover="this.style.background='var(--bg-subtle)'" onmouseout="this.style.background='transparent'">
          <div style="background: var(--color-info-bg); padding: 8px; border-radius: var(--radius-full); flex-shrink: 0; display:flex;">
            <i data-lucide="bell" style="width:14px;height:14px;color:var(--color-info);"></i>
          </div>
          <div style="flex:1;">
            <div style="color:var(--text-primary); font-size:0.9rem; font-weight: 500; line-height: 1.4;">${escapeHTML(n.message)}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top: 4px;">${getTimeAgo(n.createdAt)}</div>
          </div>
        </div>
      `).join('');
    }
  }

  if (window.lucide) window.lucide.createIcons();
}
