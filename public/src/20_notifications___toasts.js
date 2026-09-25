/* ==========================================================================
   NOTIFICATIONS & TOASTS
   ========================================================================== */
function toggleNotifDropdown() {
  const dd = document.getElementById('notif-dropdown');
  if (dd) dd.classList.toggle('show');
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('notif-dropdown');
  const btn = document.getElementById('notif-toggle-btn');
  if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
    dropdown.classList.remove('show');
  }
});

function renderNotifications() {
  const listEl = document.getElementById('notif-list');
  if (!listEl) return;

  if (appState.notifications.length === 0) {
    listEl.innerHTML = `
      <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
        No notifications right now.
      </div>
    `;
    return;
  }

  listEl.innerHTML = appState.notifications.map(n => `
    <div class="notif-item ${!n.read ? 'unread' : ''}" onclick="${n.type === 'sighting' ? `openViewSightingModal('${escapeHTML(n.message)}')` : ''}" style="${n.type === 'sighting' ? 'cursor:pointer;' : ''}">
      <span class="notif-item-icon">${n.type === 'sighting' ? '👀' : (n.type === 'match' ? '🔍' : '🔔')}</span>
      <div>
        <div class="notif-item-text">${escapeHTML(n.message)}</div>
        <div class="notif-item-time">${getTimeAgo(n.createdAt)}</div>
      </div>
    </div>
  `).join('');
}

function openViewSightingModal(message) {
  const modal = document.getElementById('view-sighting-modal');
  const textEl = document.getElementById('view-sighting-text');
  if (textEl) textEl.textContent = message;
  if (modal) {
    modal.style.display = 'flex';
    if (window.lucide) window.lucide.createIcons();
  }
}

function closeViewSightingModal() {
  const modal = document.getElementById('view-sighting-modal');
  if (modal) modal.style.display = 'none';
}

async function markAllNotificationsRead() {
  appState.notifications = [];
  saveData();
  renderNotifications();
  renderNotificationsList();
  updateBadges();
  showToast('All notifications cleared', 'info');

  try {
    await fetch(API_BASE + '/api/notifications', {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  } catch (err) {
    console.warn('Backend notifications clear notice:', err.message);
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const iconMap = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  const icon = iconMap[type] || 'ℹ️';

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span style="font-size: 1.2rem; line-height: 1;">${icon}</span>
    <span style="flex: 1;">${escapeHTML(message)}</span>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.9rem;padding:2px;">✕</button>
  `;

  container.appendChild(toast);

  // Auto-dismiss in 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.35s ease';
    setTimeout(() => toast.remove(), 350);
  }, 4000);
}
