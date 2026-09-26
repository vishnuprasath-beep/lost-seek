/* ==========================================================================
   COMMUNITY LOST ALERTS & NOTIFICATIONS
   ========================================================================== */
let activeCommunityAlerts = [];

function switchAlertsTab(tab) {
  const commView = document.getElementById('community-alerts-tab-view');
  const notifView = document.getElementById('personal-notifications-tab-view');
  const commBtn = document.getElementById('tab-btn-community-alerts');
  const notifBtn = document.getElementById('tab-btn-notifications');

  if (tab === 'community') {
    if (commView) commView.style.display = 'block';
    if (notifView) notifView.style.display = 'none';
    if (commBtn) { commBtn.className = 'btn btn-sm btn-primary'; }
    if (notifBtn) { notifBtn.className = 'btn btn-sm btn-secondary'; }
  } else {
    if (commView) commView.style.display = 'none';
    if (notifView) notifView.style.display = 'block';
    if (commBtn) { commBtn.className = 'btn btn-sm btn-secondary'; }
    if (notifBtn) { notifBtn.className = 'btn btn-sm btn-primary'; }
  }
}

async function renderAlertsPage() {
  await renderCommunityAlerts();
  renderNotificationsList();
}

async function renderCommunityAlerts() {
  const container = document.getElementById('community-alerts-container');
  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 24px; color: var(--text-muted);">
      <div class="spinner-sm" style="margin: 0 auto 10px;"></div>
      <p>Scanning campus radar for active lost alerts...</p>
    </div>
  `;

  let alerts = [];
  try {
    const user = appState.user;
    const headers = {};
    if (user) headers['x-lostseek-user'] = encodeURIComponent(JSON.stringify(user));
    const res = await fetch(API_BASE + '/api/alerts?status=ACTIVE', { headers });
    if (res.ok) {
      const data = await res.json();
      alerts = data.alerts || [];
    }
  } catch (err) {
    console.warn('Could not fetch alerts from API, falling back to local state:', err.message);
  }

  // Fallback if network issue or offline: derive from active lost reports with strict privacy rules
  if (!alerts || alerts.length === 0) {
    const activeLost = (appState.lostReports || []).filter(r => r.status === 'Active' || r.status === 'Looking');
    alerts = activeLost.map(r => ({
      id: `alert-${r.id}`,
      reportId: r.id,
      category: r.category || 'General',
      approximateArea: (r.location || 'Campus Grounds').replace(/room\s*#?\s*\w+/gi, '').trim(),
      safeDescription: `Lost ${r.category || 'item'} reported near ${r.location || 'campus'}. Have you seen something similar?`,
      reportedAt: r.date || r.createdAt || new Date().toISOString(),
      status: 'ACTIVE'
    }));
  }

  activeCommunityAlerts = alerts;

  if (alerts.length === 0) {
    container.innerHTML = `
      <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 36px 20px;">
        <i data-lucide="shield-check" style="width: 42px; height: 42px; color: var(--color-success); margin: 0 auto 12px;"></i>
        <h3 style="margin: 0 0 6px; color: var(--text-primary);">All Clear on Campus</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; max-width: 420px; margin: 0 auto;">No active community lost alerts currently pending. The campus radar is clear!</p>
      </div>
    `;
    if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = alerts.map(a => {
    const isSpotted = a.status === 'SPOTTED';
    const statusBadge = isSpotted 
      ? `<span class="status-pill" style="background: rgba(234, 179, 8, 0.15); color: #eab308; border: 1px solid rgba(234, 179, 8, 0.3);"><i data-lucide="eye"></i> SPOTTED</span>`
      : `<span class="status-pill status-active"><i data-lucide="radio"></i> ACTIVE RADAR</span>`;

    return `
      <div class="glass-card" style="padding: 18px; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid var(--border-subtle); position: relative; overflow: hidden;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 8px;">
            <div>
              <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--teal-bright); letter-spacing: 0.5px;">Campus Alert</span>
              <h3 style="margin: 3px 0 0; font-size: 1.05rem; color: var(--text-primary);">${escapeHTML(a.category)}</h3>
            </div>
            ${statusBadge}
          </div>

          <!-- Safe short description (Strictly privacy compliant: NO owner details!) -->
          <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.45; margin: 0 0 14px;">
            ${escapeHTML(a.safeDescription)}
          </p>

          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 16px; border-top: 1px solid var(--border-subtle); padding-top: 10px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <i data-lucide="map-pin" style="width: 14px; height: 14px; color: var(--teal-bright);"></i>
              <span><strong>Area:</strong> ${escapeHTML(a.approximateArea || 'Campus Area')}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
              <span><strong>Reported:</strong> ${getTimeAgo(a.reportedAt || a.createdAt)}</span>
            </div>
          </div>
        </div>

        <button type="button" class="btn btn-primary" style="width: 100%;" onclick="openSightingModal('${escapeHTML(a.id)}', '${escapeHTML(a.reportId || '')}', '${escapeHTML(a.category)}', '${escapeHTML(a.approximateArea)}')">
          <i data-lucide="eye"></i>
          <span>I Saw Something</span>
        </button>
      </div>
    `;
  }).join('');

  if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
}

function renderNotificationsList() {
  const container = document.getElementById('alerts-page-container');
  if (!container) return;

  const notifs = appState.notifications || [];

  if (notifs.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:36px;">
        <i data-lucide="bell-off" style="width:36px;height:36px;color:var(--text-muted);margin:0 auto 10px;"></i>
        <p style="color:var(--text-muted);">No personal notifications right now. You are all caught up!</p>
      </div>
    `;
    if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = notifs.map(n => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid var(--border-subtle);gap:12px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:36px;height:36px;border-radius:50%;background:rgba(20,184,166,0.12);display:flex;align-items:center;justify-content:center;color:var(--teal-bright);flex-shrink:0;">
          <i data-lucide="${n.type === 'alert' ? 'radio' : (n.type === 'match' ? 'sparkles' : 'bell')}" style="width:18px;height:18px;"></i>
        </div>
        <div>
          <div style="font-size:0.92rem;color:var(--text-primary);font-weight:500;">${escapeHTML(n.message)}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">${getTimeAgo(n.createdAt)}</div>
        </div>
      </div>
      <button class="btn btn-sm btn-secondary" onclick="showPage('matches-page')">View</button>
    </div>
  `).join('');

  if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
}

function refreshCommunityAlerts() {
  showToast('Updating community radar...', 'info');
  renderCommunityAlerts();
}
