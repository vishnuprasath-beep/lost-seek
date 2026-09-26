/* ==========================================================================
   URGENT ITEM ASSISTANCE MODAL ( [ 🆘 Need Help? ] )
   ========================================================================== */

function openItemHelpModal(reportId, title, location) {
  ensureModalsLoaded();
  const modal = document.getElementById('item-help-modal');
  if (!modal) return;

  const idInput = document.getElementById('item-help-report-id');
  const titleEl = document.getElementById('item-help-modal-item-title');
  const locEl = document.getElementById('item-help-modal-item-location');
  const noteInput = document.getElementById('item-help-note');

  if (idInput) idInput.value = reportId || '';
  if (titleEl) titleEl.textContent = title || 'Campus Item';
  if (locEl) locEl.textContent = location || 'Campus';
  if (noteInput) noteInput.value = '';

  // Reset radio buttons
  const radios = modal.querySelectorAll('input[name="item-help-reason"]');
  radios.forEach(r => { r.checked = false; });
  if (radios.length > 0) radios[0].checked = true;

  modal.classList.add('show');
  if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
}

function closeItemHelpModal() {
  const modal = document.getElementById('item-help-modal');
  if (modal) modal.classList.remove('show');
}

function submitItemHelpRequest(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  const reportId = document.getElementById('item-help-report-id')?.value || '';
  const title = document.getElementById('item-help-modal-item-title')?.textContent || 'Campus Item';
  const location = document.getElementById('item-help-modal-item-location')?.textContent || 'Campus';
  const note = document.getElementById('item-help-note')?.value.trim() || '';

  const checkedRadio = document.querySelector('input[name="item-help-reason"]:checked');
  const reason = checkedRadio ? checkedRadio.value : 'Dispute or Safety Concern';

  const ticketId = generateId('help');

  const ticket = {
    id: ticketId,
    type: 'urgent_help',
    category: reason,
    urgency: 'Critical (Safety Risk)',
    priority: 'urgent',
    relatedReportId: reportId,
    itemTitle: title,
    involvedRole: 'Finder / Claimant Dispute',
    location: location,
    studentName: appState.user?.name || 'Campus Student',
    studentId: appState.user?.studentId || 'STU-2026',
    studentPhone: appState.user?.phone || '',
    description: note ? `${reason}\n\nStudent Note: ${note}` : reason,
    status: 'New',
    createdAt: new Date().toISOString(),
    notes: [
      {
        author: 'Security Bot',
        text: `Urgent assistance requested for "${title}". Flagged reason: ${reason}`,
        createdAt: new Date().toISOString()
      }
    ]
  };

  // Flag report as urgent
  const targetReport = appState.lostReports.find(r => r.id === reportId) ||
                       appState.foundReports.find(r => r.id === reportId);
  if (targetReport) {
    targetReport.priority = 'urgent';
    targetReport.isFlagged = true;
  }

  if (!appState.adminHelpRequests) appState.adminHelpRequests = [];
  appState.adminHelpRequests.unshift(ticket);

  // Notifications
  appState.notifications.unshift({
    id: generateId('notif'),
    message: `🚨 Urgent assistance requested for "${title}". Case #${ticket.id} flagged with Campus Security.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  appState.notifications.unshift({
    id: generateId('notif'),
    message: `🚨 URGENT ITEM FLAG (#${ticket.id}): Student ${appState.user?.name || 'Student'} flagged item "${title}" at ${location} [${reason}].`,
    read: false,
    createdAt: new Date().toISOString()
  });

  saveData();
  renderNotifications();
  updateSidebarHelpBadge();
  closeItemHelpModal();

  showToast(`Urgent assistance requested! Campus Security Desk alerted (Ref #${ticket.id}) 🛡️`, 'success');
}
