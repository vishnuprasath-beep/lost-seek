/* ==========================================================================
   ADMIN ASSISTANCE REQUESTS ("ASK ADMIN TO HELP")
   ========================================================================== */
function requestAdminAssistedReturn() {
  const report = appState.foundReports.find(r => r.id === activeContactHelpReportId) ||
                 appState.lostReports.find(r => r.id === activeContactHelpReportId);
  
  const title = report ? report.title : 'Lost Item';
  const student = appState.user || { name: 'Campus Student', studentId: 'STU-2026' };

  if (!appState.adminHelpRequests) appState.adminHelpRequests = [];

  const helpReq = {
    id: generateId('help'),
    reportId: activeContactHelpReportId,
    itemTitle: title,
    category: report?.category || 'misc',
    studentName: student.name,
    studentId: student.studentId || 'STU-2026',
    studentPhone: report?.phone || '',
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  appState.adminHelpRequests.unshift(helpReq);

  // Student notification
  appState.notifications.unshift({
    id: generateId('notif'),
    message: `🛡️ Admin assistance requested for "${title}". Campus Security Desk will coordinate hand-over.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  // Admin notification
  appState.notifications.unshift({
    id: generateId('notif'),
    message: `Help needed for a lost item: Student ${student.name} needs help contacting the possible finder for "${title}".`,
    read: false,
    createdAt: new Date().toISOString()
  });

  saveData();
  renderNotifications();
  renderAdminHelpRequests();
  closeAdminContactHelpModal();
  showToast('Help request sent to Campus Security Desk! 🛡️', 'success');
}

function renderAdminHelpRequests() {
  const container = document.getElementById('admin-help-requests-container');
  const badge = document.getElementById('admin-help-count-badge');
  if (!container) return;

  const requests = appState.adminHelpRequests || [];
  const pending = requests.filter(r => r.status === 'Pending');

  if (badge) {
    badge.textContent = `${pending.length} Pending`;
    badge.className = pending.length > 0 ? 'badge badge-urgent' : 'badge badge-verified';
  }

  if (requests.length === 0) {
    container.innerHTML = `
      <div class="glass-card empty-state" style="text-align: center; padding: 20px;">
        <i data-lucide="shield-check" style="width: 28px; height: 28px; color: var(--teal-bright); margin: 0 auto 8px;"></i>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">No student assistance requests pending. All communications running smoothly!</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = requests.map(req => {
    const isPending = req.status === 'Pending';
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: var(--bg-subtle); border-radius: 8px; border: 1px solid var(--border-subtle); margin-bottom: 10px; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: ${isPending ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)'}; display: flex; align-items: center; justify-content: center; color: ${isPending ? 'var(--color-error)' : 'var(--color-success)'};">
            <i data-lucide="${isPending ? 'shield-alert' : 'shield-check'}" style="width: 18px; height: 18px;"></i>
          </div>
          <div>
            <div style="font-weight: 600; font-size: 0.92rem; color: var(--text-primary);">
              ${escapeHTML(req.itemTitle)}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
              Requested by <strong>${escapeHTML(req.studentName)}</strong> (${escapeHTML(req.studentId)}) • ${getTimeAgo(req.createdAt)}
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span class="status-pill ${isPending ? 'status-checking' : 'status-returned'}">
            <i data-lucide="${isPending ? 'clock' : 'check-circle-2'}"></i>
            ${isPending ? 'Waiting for Check' : 'Resolved'}
          </span>
          <button type="button" class="btn btn-sm btn-secondary" onclick="openReportDetailsModal('${req.reportId}')">
            View
          </button>
          ${isPending ? `
            <button type="button" class="btn btn-sm btn-primary" onclick="resolveAdminHelpRequest('${req.id}')">
              Resolve
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function resolveAdminHelpRequest(helpId) {
  const req = (appState.adminHelpRequests || []).find(r => r.id === helpId);
  if (!req) return;

  req.status = 'Resolved';
  req.resolvedAt = new Date().toISOString();

  appState.notifications.unshift({
    id: generateId('notif'),
    message: `🛡️ Admin assistance resolved: Campus Security Desk has coordinated hand-over for "${req.itemTitle}". Please visit the desk.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  saveData();
  renderNotifications();
  renderAdminHelpRequests();
  showToast('Assistance request marked Resolved! 🛡️', 'success');
}


