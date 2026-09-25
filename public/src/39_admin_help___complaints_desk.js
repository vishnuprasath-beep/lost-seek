/* ==========================================================================
   ADMIN HELP & COMPLAINTS DESK
   ========================================================================== */

function filterAdminHelpDeskTab(tabKey, btnEl) {
  currentAdminHelpTab = tabKey;
  const buttons = document.querySelectorAll('.admin-help-tab');
  buttons.forEach(b => {
    b.classList.remove('active');
    b.classList.add('btn-secondary');
  });

  if (btnEl) {
    btnEl.classList.add('active');
    btnEl.classList.remove('btn-secondary');
  }

  renderAdminHelpDesk(tabKey);
}

function handleAdminHelpSearch() {
  renderAdminHelpDesk(currentAdminHelpTab);
}

function updateSidebarHelpBadge() {
  const badge = document.getElementById('sidebar-admin-help-badge');
  if (!badge) return;
  const newCount = (appState.adminHelpRequests || []).filter(r => r.status === 'New').length;
  if (newCount > 0) {
    badge.textContent = newCount;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

function renderAdminHelpDesk(filterTab = currentAdminHelpTab) {
  currentAdminHelpTab = filterTab;
  const tbody = document.getElementById('admin-help-table-tbody');
  if (!tbody) return;

  const requests = appState.adminHelpRequests || [];

  // Update Metrics counters
  const totalCount = requests.length;
  const urgentCount = requests.filter(r => r.priority === 'urgent' || (r.urgency && r.urgency.toLowerCase().includes('critical'))).length;
  const newCount = requests.filter(r => r.status === 'New').length;
  const inReviewCount = requests.filter(r => r.status === 'In Review').length;
  const resolvedCount = requests.filter(r => r.status === 'Handled' || r.status === 'Closed').length;

  const totalEl = document.getElementById('admin-help-metric-total');
  const urgentEl = document.getElementById('admin-help-metric-urgent');
  const newEl = document.getElementById('admin-help-metric-new');
  const inReviewEl = document.getElementById('admin-help-metric-in-review');
  const resolvedEl = document.getElementById('admin-help-metric-resolved');

  if (totalEl) totalEl.textContent = totalCount;
  if (urgentEl) urgentEl.textContent = urgentCount;
  if (newEl) newEl.textContent = newCount;
  if (inReviewEl) inReviewEl.textContent = inReviewCount;
  if (resolvedEl) resolvedEl.textContent = resolvedCount;

  updateSidebarHelpBadge();

  // Filter by Tab
  let filtered = requests;
  if (filterTab === 'new') {
    filtered = filtered.filter(r => r.status === 'New');
  } else if (filterTab === 'urgent') {
    filtered = filtered.filter(r => r.priority === 'urgent' || (r.urgency && r.urgency.toLowerCase().includes('critical')));
  } else if (filterTab === 'open') {
    filtered = filtered.filter(r => r.status === 'In Review');
  } else if (filterTab === 'handled') {
    filtered = filtered.filter(r => r.status === 'Handled');
  } else if (filterTab === 'closed') {
    filtered = filtered.filter(r => r.status === 'Closed');
  }

  // Filter by Search Input
  const query = document.getElementById('admin-help-search-input')?.value.toLowerCase().trim() || '';
  if (query) {
    filtered = filtered.filter(r => 
      (r.id && r.id.toLowerCase().includes(query)) ||
      (r.studentName && r.studentName.toLowerCase().includes(query)) ||
      (r.studentId && r.studentId.toLowerCase().includes(query)) ||
      (r.itemTitle && r.itemTitle.toLowerCase().includes(query)) ||
      (r.category && r.category.toLowerCase().includes(query)) ||
      (r.location && r.location.toLowerCase().includes(query))
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 36px 16px; color: var(--text-muted);">
          <i data-lucide="shield-check" style="width: 32px; height: 32px; color: var(--teal-bright); margin: 0 auto 8px; display: block;"></i>
          No assistance requests or complaints matching active filter.
        </td>
      </tr>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  tbody.innerHTML = filtered.map(item => {
    const isUrgent = (item.priority === 'urgent' || (item.urgency && item.urgency.toLowerCase().includes('critical')));
    const statusClass = 
      item.status === 'New' ? 'status-checking' :
      item.status === 'In Review' ? 'status-in-review' :
      item.status === 'Handled' ? 'status-handled' : 'status-closed';

    const urgencyBadgeClass = 
      item.urgency === 'Critical (Safety Risk)' ? 'badge-urgent' :
      item.urgency === 'High' ? 'badge-matched' : 'badge-verified';

    return `
      <tr style="${isUrgent ? 'background: rgba(239, 68, 68, 0.04);' : ''}">
        <td>
          <div style="font-weight: 700; font-family: monospace; font-size: 0.88rem; color: var(--teal-bright);">
            #${item.id}
          </div>
          <span class="badge ${item.type === 'urgent_help' ? 'badge-urgent' : 'badge-searching'}" style="font-size: 0.65rem; margin-top: 2px;">
            ${item.type === 'urgent_help' ? '🚨 URGENT' : '🛡️ COMPLAINT'}
          </span>
        </td>
        <td style="font-size: 0.8rem; color: var(--text-muted); white-space: nowrap;">
          ${getTimeAgo(item.createdAt)}
        </td>
        <td>
          <span class="badge ${urgencyBadgeClass}" style="font-size: 0.72rem;">
            ${escapeHTML(item.urgency || 'Normal')}
          </span>
        </td>
        <td>
          <div style="font-weight: 600; font-size: 0.9rem; color: var(--text-primary);">
            ${escapeHTML(item.category || item.itemTitle)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
            Item: ${escapeHTML(item.itemTitle || 'Campus Item')}
          </div>
        </td>
        <td>
          <div style="font-weight: 600; font-size: 0.88rem; color: var(--text-primary);">
            ${escapeHTML(item.studentName || 'Student')}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">
            ID: ${escapeHTML(item.studentId || 'STU')}
          </div>
        </td>
        <td style="font-size: 0.82rem; color: var(--text-secondary);">
          📍 ${escapeHTML(item.location || 'Campus')}
        </td>
        <td>
          <span class="status-pill ${statusClass}">
            <i data-lucide="${item.status === 'Handled' ? 'check-circle-2' : 'clock'}"></i>
            ${escapeHTML(item.status)}
          </span>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 6px; align-items: center;">
            <button type="button" class="btn btn-sm btn-secondary" onclick="openAdminHelpDetailsModal('${item.id}')">
              <i data-lucide="eye"></i>
              <span>View</span>
            </button>
            <select class="input-glass" style="padding: 3px 8px; font-size: 0.78rem; width: auto;" onchange="updateAdminHelpStatus('${item.id}', this.value)">
              <option value="New" ${item.status === 'New' ? 'selected' : ''}>New</option>
              <option value="In Review" ${item.status === 'In Review' ? 'selected' : ''}>In Review</option>
              <option value="Handled" ${item.status === 'Handled' ? 'selected' : ''}>Handled</option>
              <option value="Closed" ${item.status === 'Closed' ? 'selected' : ''}>Closed</option>
            </select>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function openAdminHelpDetailsModal(ticketId) {
  activeAdminHelpTicketId = ticketId;
  const ticket = (appState.adminHelpRequests || []).find(r => r.id === ticketId);
  if (!ticket) return;

  const modal = document.getElementById('admin-help-details-modal');
  if (!modal) return;

  document.getElementById('admin-help-modal-ticket-id').textContent = `Ticket #${ticket.id}`;
  document.getElementById('admin-help-modal-created-time').textContent = `Submitted ${formatDateTime(ticket.createdAt)} (${getTimeAgo(ticket.createdAt)})`;

  const urgencyBadge = document.getElementById('admin-help-modal-urgency-badge');
  if (urgencyBadge) {
    urgencyBadge.textContent = ticket.urgency || 'Normal';
    urgencyBadge.className = `badge ${ticket.urgency === 'Critical (Safety Risk)' ? 'badge-urgent' : (ticket.urgency === 'High' ? 'badge-matched' : 'badge-verified')}`;
  }

  const statusPill = document.getElementById('admin-help-modal-status-pill');
  if (statusPill) {
    statusPill.textContent = ticket.status;
    statusPill.className = `status-pill ${ticket.status === 'New' ? 'status-checking' : (ticket.status === 'In Review' ? 'status-in-review' : (ticket.status === 'Handled' ? 'status-handled' : 'status-closed'))}`;
  }

  document.getElementById('admin-help-modal-student-name').textContent = ticket.studentName || 'Student';
  document.getElementById('admin-help-modal-student-contact').textContent = `ID: ${ticket.studentId || 'STU'} • Phone: ${ticket.studentPhone || 'Not shared'}`;
  document.getElementById('admin-help-modal-location').textContent = ticket.location || 'Campus';
  document.getElementById('admin-help-modal-item-title').textContent = ticket.itemTitle ? `Item: ${ticket.itemTitle}` : 'General Issue';
  document.getElementById('admin-help-modal-reason').textContent = ticket.category || 'Dispute';
  document.getElementById('admin-help-modal-description').textContent = ticket.description || 'No description provided.';

  // Status select
  const statusSelect = document.getElementById('admin-help-modal-status-select');
  if (statusSelect) statusSelect.value = ticket.status || 'New';

  // Render Notes
  renderAdminHelpModalNotes(ticket);

  // View Report Button
  const viewReportBtn = document.getElementById('admin-help-view-item-btn');
  if (viewReportBtn) {
    if (ticket.relatedReportId) {
      viewReportBtn.style.display = 'inline-flex';
    } else {
      viewReportBtn.style.display = 'none';
    }
  }

  modal.classList.add('show');
  if (window.lucide) window.lucide.createIcons();
}

function renderAdminHelpModalNotes(ticket) {
  const notesContainer = document.getElementById('admin-help-modal-notes-list');
  if (!notesContainer) return;

  const notes = ticket.notes || [];
  if (notes.length === 0) {
    notesContainer.innerHTML = '<div style="font-size: 0.78rem; color: var(--text-muted); font-style: italic;">No internal notes added yet.</div>';
    return;
  }

  notesContainer.innerHTML = notes.map(n => `
    <div class="admin-note-bubble">
      <div class="admin-note-header">
        <span class="admin-note-author">${escapeHTML(n.author)}</span>
        <span>${getTimeAgo(n.createdAt)}</span>
      </div>
      <div style="color: var(--text-primary); font-size: 0.8rem;">${escapeHTML(n.text)}</div>
    </div>
  `).join('');
}

function addAdminHelpInternalNote() {
  if (!activeAdminHelpTicketId) return;
  const ticket = (appState.adminHelpRequests || []).find(r => r.id === activeAdminHelpTicketId);
  if (!ticket) return;

  const input = document.getElementById('admin-help-new-note-input');
  if (!input || !input.value.trim()) return;

  const noteText = input.value.trim();
  if (!ticket.notes) ticket.notes = [];

  ticket.notes.push({
    author: appState.user?.name || 'Staff Officer',
    text: noteText,
    createdAt: new Date().toISOString()
  });

  input.value = '';
  saveData();
  renderAdminHelpModalNotes(ticket);
  showToast('Internal investigation note recorded 📝', 'success');
}

function updateAdminHelpStatus(newStatusOrTicketId, maybeStatus) {
  let ticketId = activeAdminHelpTicketId;
  let newStatus = newStatusOrTicketId;

  if (maybeStatus !== undefined) {
    ticketId = newStatusOrTicketId;
    newStatus = maybeStatus;
  }

  const ticket = (appState.adminHelpRequests || []).find(r => r.id === ticketId);
  if (!ticket) return;

  const oldStatus = ticket.status;
  ticket.status = newStatus;

  if (!ticket.notes) ticket.notes = [];
  ticket.notes.push({
    author: appState.user?.name || 'Staff Officer',
    text: `Status changed from ${oldStatus} to ${newStatus}.`,
    createdAt: new Date().toISOString()
  });

  if (newStatus === 'Handled' || newStatus === 'Closed') {
    ticket.resolvedAt = new Date().toISOString();
  }

  // Notify student
  appState.notifications.unshift({
    id: generateId('notif'),
    message: `🛡️ Ticket #${ticket.id} status updated to "${newStatus}" by Campus Security.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  saveData();
  renderNotifications();
  renderAdminHelpDesk(currentAdminHelpTab);

  if (activeAdminHelpTicketId === ticketId) {
    const statusPill = document.getElementById('admin-help-modal-status-pill');
    if (statusPill) {
      statusPill.textContent = newStatus;
      statusPill.className = `status-pill ${newStatus === 'New' ? 'status-checking' : (newStatus === 'In Review' ? 'status-in-review' : (newStatus === 'Handled' ? 'status-handled' : 'status-closed'))}`;
    }
    renderAdminHelpModalNotes(ticket);
  }

  showToast(`Ticket #${ticket.id} updated to ${newStatus}!`, 'success');
}

function closeAdminHelpDetailsModal() {
  activeAdminHelpTicketId = null;
  const modal = document.getElementById('admin-help-details-modal');
  if (modal) modal.classList.remove('show');
}

function viewRelatedReportFromHelpModal() {
  if (!activeAdminHelpTicketId) return;
  const ticket = (appState.adminHelpRequests || []).find(r => r.id === activeAdminHelpTicketId);
  if (!ticket || !ticket.relatedReportId) return;

  closeAdminHelpDetailsModal();
  openReportDetailsModal(ticket.relatedReportId);
}
