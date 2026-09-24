const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');

// 1. Add handleLocationSelectChange and getOfficialContactDisplay helper
const helperFunctions = `
function handleLocationSelectChange(selectEl, otherWrapId) {
  if (!selectEl || !otherWrapId) return;
  const wrap = document.getElementById(otherWrapId);
  if (!wrap) return;
  if (selectEl.value === 'Other') {
    wrap.style.display = 'block';
    const input = wrap.querySelector('input');
    if (input) input.focus();
  } else {
    wrap.style.display = 'none';
  }
}

function getOfficialContactDisplay(phone) {
  if (phone && phone.trim()) {
    const clean = phone.trim();
    return \`<a href="tel:\${escapeHTML(clean)}" style="color: var(--teal-bright); text-decoration: none; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;"><i data-lucide="phone-call" style="width: 14px; height: 14px;"></i> \${escapeHTML(clean)}</a>\`;
  }
  return '<span class="contact-unconfigured-text">Contact number not configured</span>';
}
`;

// Insert after getLocationCategory / isSameLocationCategory
const locHelperAnchor = `function isSameLocationCategory(loc1, loc2) {
  const cat1 = getLocationCategory(loc1);
  const cat2 = getLocationCategory(loc2);
  return !!(cat1 && cat2 && cat1 === cat2);
}`;

if (!appJs.includes('function handleLocationSelectChange')) {
  appJs = appJs.replace(locHelperAnchor, locHelperAnchor + '\n' + helperFunctions);
}

// 2. Update showPage routing
// Admin pages guard:
appJs = appJs.replace(
  `const adminPages = ['admin-page', 'admin-photo-search-page', 'admin-students-page'];`,
  `const adminPages = ['admin-page', 'admin-photo-search-page', 'admin-students-page', 'admin-help-page'];`
);

// titleMap in showPage:
appJs = appJs.replace(
  `'settings-page': 'Settings'`,
  `'settings-page': 'Settings',
      'help-safety-page': 'Help & Safety',
      'admin-help-page': 'Help & Complaints'`
);

// hashMap in showPage:
appJs = appJs.replace(
  `'settings-page': 'settings'`,
  `'settings-page': 'settings',
    'help-safety-page': 'help-safety',
    'admin-help-page': 'admin-help'`
);

// Renders switch in showPage:
const renderSwitchAnchor = `} else if (pageId === 'settings-page') {
    renderSettings();
  }`;

const renderSwitchReplacement = `} else if (pageId === 'settings-page') {
    renderSettings();
  } else if (pageId === 'help-safety-page') {
    renderHelpSafetyPage();
  } else if (pageId === 'admin-help-page') {
    renderAdminHelpDesk('all');
  }`;

if (!appJs.includes(`pageId === 'help-safety-page'`)) {
  appJs = appJs.replace(renderSwitchAnchor, renderSwitchReplacement);
}

// reverseMap in handleHashNavigation:
appJs = appJs.replace(
  `'settings': 'settings-page'`,
  `'settings': 'settings-page',
    'help-safety': 'help-safety-page',
    'admin-help': 'admin-help-page'`
);

// 3. Update generateReportReview for custom "Other" location
const reviewLocAnchor = `const location = document.getElementById(\`\${type}-location\`)?.value || 'Campus';`;
const reviewLocReplacement = `let location = document.getElementById(\`\${type}-location\`)?.value || 'Campus';
  if (location === 'Other') {
    const customLoc = document.getElementById(\`\${type}-location-other\`)?.value.trim();
    if (customLoc) location = customLoc;
  }`;
appJs = appJs.replace(reviewLocAnchor, reviewLocReplacement);

// 4. Update finalizeReportSubmit for custom "Other" location
const finalizeLocAnchor = `const location = document.getElementById(\`\${type}-location\`)?.value || 'Campus';`;
const finalizeLocReplacement = `let location = document.getElementById(\`\${type}-location\`)?.value || 'Campus';
  if (location === 'Other') {
    const customLoc = document.getElementById(\`\${type}-location-other\`)?.value.trim();
    if (customLoc) location = customLoc;
  }`;
appJs = appJs.replace(finalizeLocAnchor, finalizeLocReplacement);

// 5. Update handleIFoundSearch for custom "Other" location
const ifoundLocAnchor = `const location = document.getElementById('ifound-location')?.value || 'Campus';`;
const ifoundLocReplacement = `let location = document.getElementById('ifound-location')?.value || 'Campus';
  if (location === 'Other') {
    const customLoc = document.getElementById('ifound-location-other')?.value.trim();
    if (customLoc) location = customLoc;
  }`;
appJs = appJs.replace(ifoundLocAnchor, ifoundLocReplacement);

// 6. Update match card action area in renderAIMatches to include [ 🆘 Need Help? ]
const matchCardActionAnchor = `        <!-- Claim Action -->
        <div style="margin-top: 14px; display: flex; justify-content: flex-end;">
          \${isClaimed ? \`
            <span class="badge badge-verified">Claim Verification in Review</span>
          \` : \`
            <button class="btn btn-accent-teal" onclick="openClaimModal('\${lost.id}', '\${found.id}', '\${escapeHTML(lost.title)}', '\${lost.category}')">
              <span>🤝</span> Claim This Item
            </button>
          \`}
        </div>`;

const matchCardActionReplacement = `        <!-- Actions Area: Claim + Urgent Help -->
        <div style="margin-top: 14px; display: flex; justify-content: flex-end; align-items: center; gap: 10px; flex-wrap: wrap;">
          <button type="button" class="btn btn-outline" style="border-color: rgba(239, 68, 68, 0.4); color: #F87171; padding: 6px 12px; font-size: 0.82rem;" onclick="openItemHelpModal('\${lost.id}', '\${escapeHTML(lost.title)}', '\${escapeHTML(lost.location)}')">
            <i data-lucide="shield-alert" style="width: 14px; height: 14px;"></i>
            <span>🆘 Need Help?</span>
          </button>
          \${isClaimed ? \`
            <span class="badge badge-verified">Claim Verification in Review</span>
          \` : \`
            <button class="btn btn-accent-teal" onclick="openClaimModal('\${lost.id}', '\${found.id}', '\${escapeHTML(lost.title)}', '\${lost.category}')">
              <span>🤝</span> Claim This Item
            </button>
          \`}
        </div>`;

appJs = appJs.replace(matchCardActionAnchor, matchCardActionReplacement);

// 7. Implement complete Help & Safety, Complaint, Urgent Modal, Admin Desk, and Details Modal functions
const newFeaturesCode = `
/* ==========================================================================
   LOSTSEEK HELP & SAFETY, COMPLAINT & ESCALATION SYSTEM
   ========================================================================== */

let currentAdminHelpTab = 'all';
let activeAdminHelpTicketId = null;

function renderHelpSafetyPage() {
  // Ensure officialContacts structure exists
  if (!appState.officialContacts) {
    appState.officialContacts = JSON.parse(JSON.stringify(DEFAULT_OFFICIAL_CONTACTS));
  }

  const contacts = appState.officialContacts;

  // 1. Render contact numbers (or "Contact number not configured")
  const officePhoneEl = document.getElementById('contact-office-phone-display');
  if (officePhoneEl) {
    officePhoneEl.innerHTML = getOfficialContactDisplay(contacts.campusOffice?.phone);
  }

  const secPhoneEl = document.getElementById('contact-security-phone-display');
  if (secPhoneEl) {
    secPhoneEl.innerHTML = getOfficialContactDisplay(contacts.campusSecurity?.phone);
  }

  const policePhoneEl = document.getElementById('contact-police-phone-display');
  if (policePhoneEl) {
    policePhoneEl.innerHTML = getOfficialContactDisplay(contacts.policeStation?.phone);
  }

  // Also update bridge helpline in admin-contact-help-modal
  const bridgeHelplineEl = document.getElementById('admin-bridge-helpline-display');
  if (bridgeHelplineEl) {
    bridgeHelplineEl.innerHTML = \`📞 <strong>Desk Helpline:</strong> \${getOfficialContactDisplay(contacts.campusSecurity?.phone)}\`;
  }

  // 2. Populate complaint related item dropdown with user's reports
  const relatedItemSelect = document.getElementById('complaint-related-item');
  if (relatedItemSelect) {
    let optionsHTML = '<option value="">Not item-specific / General campus issue</option>';
    const userReports = [
      ...appState.lostReports.map(r => ({ ...r, typeLabel: 'Lost' })),
      ...appState.foundReports.map(r => ({ ...r, typeLabel: 'Found' }))
    ];

    userReports.forEach(rep => {
      optionsHTML += \`<option value="\${rep.id}">[\${rep.typeLabel}] \${escapeHTML(rep.title)} (📍 \${escapeHTML(rep.location)})</option>\`;
    });

    relatedItemSelect.innerHTML = optionsHTML;
  }

  // 3. Pre-fill student contact phone if known
  const phoneInput = document.getElementById('complaint-contact-phone');
  if (phoneInput && !phoneInput.value && appState.user?.phone) {
    phoneInput.value = appState.user.phone;
  }

  if (window.lucide) window.lucide.createIcons();
}

function handleComplaintSubmit(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  const complaintType = document.getElementById('complaint-type')?.value;
  const urgency = document.getElementById('complaint-urgency')?.value || 'Normal';
  const relatedItemId = document.getElementById('complaint-related-item')?.value || '';
  const involvedRole = document.getElementById('complaint-involved-role')?.value || 'Not Applicable';
  let location = document.getElementById('complaint-location')?.value || 'Campus';
  if (location === 'Other') {
    const customLoc = document.getElementById('complaint-location-other')?.value.trim();
    if (customLoc) location = customLoc;
  }
  const contactPhone = document.getElementById('complaint-contact-phone')?.value.trim() || '';
  const description = document.getElementById('complaint-description')?.value.trim();

  if (!complaintType || !description) {
    showToast('Please fill in all required complaint fields.', 'warning');
    return;
  }

  let itemTitle = 'General Campus Dispute';
  if (relatedItemId) {
    const matchedRep = appState.lostReports.find(r => r.id === relatedItemId) ||
                       appState.foundReports.find(r => r.id === relatedItemId);
    if (matchedRep) itemTitle = matchedRep.title;
  }

  const isUrgent = (urgency.toLowerCase().includes('critical') || urgency.toLowerCase().includes('high'));
  const ticketId = generateId('help');

  const ticket = {
    id: ticketId,
    type: 'complaint',
    category: complaintType,
    urgency: urgency,
    priority: isUrgent ? 'urgent' : 'normal',
    relatedReportId: relatedItemId,
    itemTitle: itemTitle,
    involvedRole: involvedRole,
    location: location,
    studentName: appState.user?.name || 'Campus Student',
    studentId: appState.user?.studentId || 'STU-2026',
    studentPhone: contactPhone || appState.user?.phone || '',
    description: description,
    status: 'New',
    createdAt: new Date().toISOString(),
    notes: [
      {
        author: 'System',
        text: \`Formal complaint filed by \${appState.user?.name || 'Student'} (\${appState.user?.studentId || 'STU-2026'}). Severity: \${urgency}.\`,
        createdAt: new Date().toISOString()
      }
    ]
  };

  if (!appState.adminHelpRequests) appState.adminHelpRequests = [];
  appState.adminHelpRequests.unshift(ticket);

  // Student notification
  appState.notifications.unshift({
    id: generateId('notif'),
    message: \`🛡️ Dispute escalation filed (Ref #\${ticket.id}): Campus Administration has been notified and assigned this case for investigation.\`,
    read: false,
    createdAt: new Date().toISOString()
  });

  // Admin alert
  appState.notifications.unshift({
    id: generateId('notif'),
    message: \`🚨 New Student Complaint (#\${ticket.id}): \${complaintType} at \${location} [\${urgency}]. Immediate review requested.\`,
    read: false,
    createdAt: new Date().toISOString()
  });

  saveData();
  renderNotifications();
  updateSidebarHelpBadge();

  // Reset form
  const form = document.getElementById('student-complaint-form');
  if (form) form.reset();
  const otherWrap = document.getElementById('complaint-location-other-wrap');
  if (otherWrap) otherWrap.style.display = 'none';

  showToast(\`Complaint filed successfully! Case Ref #\${ticket.id} logged with Campus Administration 🛡️\`, 'success');
}

/* ==========================================================================
   URGENT ITEM ASSISTANCE MODAL ( [ 🆘 Need Help? ] )
   ========================================================================== */

function openItemHelpModal(reportId, title, location) {
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
  if (window.lucide) window.lucide.createIcons();
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
    description: note ? \`\${reason}\\n\\nStudent Note: \${note}\` : reason,
    status: 'New',
    createdAt: new Date().toISOString(),
    notes: [
      {
        author: 'Security Bot',
        text: \`Urgent assistance requested for "\${title}". Flagged reason: \${reason}\`,
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
    message: \`🚨 Urgent assistance requested for "\${title}". Case #\${ticket.id} flagged with Campus Security.\`,
    read: false,
    createdAt: new Date().toISOString()
  });

  appState.notifications.unshift({
    id: generateId('notif'),
    message: \`🚨 URGENT ITEM FLAG (#\${ticket.id}): Student \${appState.user?.name || 'Student'} flagged item "\${title}" at \${location} [\${reason}].\`,
    read: false,
    createdAt: new Date().toISOString()
  });

  saveData();
  renderNotifications();
  updateSidebarHelpBadge();
  closeItemHelpModal();

  showToast(\`Urgent assistance requested! Campus Security Desk alerted (Ref #\${ticket.id}) 🛡️\`, 'success');
}

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
    tbody.innerHTML = \`
      <tr>
        <td colspan="8" style="text-align: center; padding: 36px 16px; color: var(--text-muted);">
          <i data-lucide="shield-check" style="width: 32px; height: 32px; color: var(--teal-bright); margin: 0 auto 8px; display: block;"></i>
          No assistance requests or complaints matching active filter.
        </td>
      </tr>
    \`;
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

    return \`
      <tr style="\${isUrgent ? 'background: rgba(239, 68, 68, 0.04);' : ''}">
        <td>
          <div style="font-weight: 700; font-family: monospace; font-size: 0.88rem; color: var(--teal-bright);">
            #\${item.id}
          </div>
          <span class="badge \${item.type === 'urgent_help' ? 'badge-urgent' : 'badge-searching'}" style="font-size: 0.65rem; margin-top: 2px;">
            \${item.type === 'urgent_help' ? '🚨 URGENT' : '🛡️ COMPLAINT'}
          </span>
        </td>
        <td style="font-size: 0.8rem; color: var(--text-muted); white-space: nowrap;">
          \${getTimeAgo(item.createdAt)}
        </td>
        <td>
          <span class="badge \${urgencyBadgeClass}" style="font-size: 0.72rem;">
            \${escapeHTML(item.urgency || 'Normal')}
          </span>
        </td>
        <td>
          <div style="font-weight: 600; font-size: 0.9rem; color: var(--text-primary);">
            \${escapeHTML(item.category || item.itemTitle)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
            Item: \${escapeHTML(item.itemTitle || 'Campus Item')}
          </div>
        </td>
        <td>
          <div style="font-weight: 600; font-size: 0.88rem; color: var(--text-primary);">
            \${escapeHTML(item.studentName || 'Student')}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">
            ID: \${escapeHTML(item.studentId || 'STU')}
          </div>
        </td>
        <td style="font-size: 0.82rem; color: var(--text-secondary);">
          📍 \${escapeHTML(item.location || 'Campus')}
        </td>
        <td>
          <span class="status-pill \${statusClass}">
            <i data-lucide="\${item.status === 'Handled' ? 'check-circle-2' : 'clock'}"></i>
            \${escapeHTML(item.status)}
          </span>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 6px; align-items: center;">
            <button type="button" class="btn btn-sm btn-secondary" onclick="openAdminHelpDetailsModal('\${item.id}')">
              <i data-lucide="eye"></i>
              <span>View</span>
            </button>
            <select class="input-glass" style="padding: 3px 8px; font-size: 0.78rem; width: auto;" onchange="updateAdminHelpStatus('\${item.id}', this.value)">
              <option value="New" \${item.status === 'New' ? 'selected' : ''}>New</option>
              <option value="In Review" \${item.status === 'In Review' ? 'selected' : ''}>In Review</option>
              <option value="Handled" \${item.status === 'Handled' ? 'selected' : ''}>Handled</option>
              <option value="Closed" \${item.status === 'Closed' ? 'selected' : ''}>Closed</option>
            </select>
          </div>
        </td>
      </tr>
    \`;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function openAdminHelpDetailsModal(ticketId) {
  activeAdminHelpTicketId = ticketId;
  const ticket = (appState.adminHelpRequests || []).find(r => r.id === ticketId);
  if (!ticket) return;

  const modal = document.getElementById('admin-help-details-modal');
  if (!modal) return;

  document.getElementById('admin-help-modal-ticket-id').textContent = \`Ticket #\${ticket.id}\`;
  document.getElementById('admin-help-modal-created-time').textContent = \`Submitted \${formatDateTime(ticket.createdAt)} (\${getTimeAgo(ticket.createdAt)})\`;

  const urgencyBadge = document.getElementById('admin-help-modal-urgency-badge');
  if (urgencyBadge) {
    urgencyBadge.textContent = ticket.urgency || 'Normal';
    urgencyBadge.className = \`badge \${ticket.urgency === 'Critical (Safety Risk)' ? 'badge-urgent' : (ticket.urgency === 'High' ? 'badge-matched' : 'badge-verified')}\`;
  }

  const statusPill = document.getElementById('admin-help-modal-status-pill');
  if (statusPill) {
    statusPill.textContent = ticket.status;
    statusPill.className = \`status-pill \${ticket.status === 'New' ? 'status-checking' : (ticket.status === 'In Review' ? 'status-in-review' : (ticket.status === 'Handled' ? 'status-handled' : 'status-closed'))}\`;
  }

  document.getElementById('admin-help-modal-student-name').textContent = ticket.studentName || 'Student';
  document.getElementById('admin-help-modal-student-contact').textContent = \`ID: \${ticket.studentId || 'STU'} • Phone: \${ticket.studentPhone || 'Not shared'}\`;
  document.getElementById('admin-help-modal-location').textContent = ticket.location || 'Campus';
  document.getElementById('admin-help-modal-item-title').textContent = ticket.itemTitle ? \`Item: \${ticket.itemTitle}\` : 'General Issue';
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

  notesContainer.innerHTML = notes.map(n => \`
    <div class="admin-note-bubble">
      <div class="admin-note-header">
        <span class="admin-note-author">\${escapeHTML(n.author)}</span>
        <span>\${getTimeAgo(n.createdAt)}</span>
      </div>
      <div style="color: var(--text-primary); font-size: 0.8rem;">\${escapeHTML(n.text)}</div>
    </div>
  \`).join('');
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
    text: \`Status changed from \${oldStatus} to \${newStatus}.\`,
    createdAt: new Date().toISOString()
  });

  if (newStatus === 'Handled' || newStatus === 'Closed') {
    ticket.resolvedAt = new Date().toISOString();
  }

  // Notify student
  appState.notifications.unshift({
    id: generateId('notif'),
    message: \`🛡️ Ticket #\${ticket.id} status updated to "\${newStatus}" by Campus Security.\`,
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
      statusPill.className = \`status-pill \${newStatus === 'New' ? 'status-checking' : (newStatus === 'In Review' ? 'status-in-review' : (newStatus === 'Handled' ? 'status-handled' : 'status-closed'))}\`;
    }
    renderAdminHelpModalNotes(ticket);
  }

  showToast(\`Ticket #\${ticket.id} updated to \${newStatus}!\`, 'success');
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

/* ==========================================================================
   REPORT DETAILS MODAL (#item-details-modal)
   ========================================================================== */

function openReportDetailsModal(reportId) {
  const report = appState.lostReports.find(r => r.id === reportId) ||
                 appState.foundReports.find(r => r.id === reportId);
  if (!report) {
    showToast('Item report not found.', 'warning');
    return;
  }

  const modal = document.getElementById('item-details-modal');
  const body = document.getElementById('item-details-modal-body');
  const titleEl = document.getElementById('item-details-modal-title');
  const badgeEl = document.getElementById('item-details-modal-type-badge');
  if (!modal || !body) return;

  const isLost = appState.lostReports.some(r => r.id === reportId);
  const typeLabel = isLost ? 'Lost Item' : 'Found Item';

  if (titleEl) titleEl.textContent = report.title;
  if (badgeEl) {
    badgeEl.textContent = typeLabel;
    badgeEl.className = \`badge \${isLost ? 'badge-searching' : 'badge-matched'}\`;
  }

  const cat = CATEGORY_MAP[report.category] || { label: 'Item', icon: '📦' };

  body.innerHTML = \`
    <div style="display: flex; gap: 18px; margin-bottom: 18px; flex-wrap: wrap;">
      \${report.photo ? \`
        <img src="\${report.photo}" alt="\${escapeHTML(report.title)}" style="width: 110px; height: 110px; object-fit: cover; border-radius: 8px; border: 1.5px solid var(--teal-bright);">
      \` : \`
        <div style="width: 110px; height: 110px; border-radius: 8px; background: var(--bg-subtle); display: flex; align-items: center; justify-content: center; font-size: 3rem;">
          \${cat.icon}
        </div>
      \`}

      <div style="flex: 1; min-width: 220px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h4 style="margin: 0; font-size: 1.15rem; color: var(--text-primary);">\${escapeHTML(report.title)}</h4>
          \${getStatusBadgeHTML(report.status)}
        </div>
        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
          📂 Category: <strong>\${escapeHTML(cat.label)}</strong> • Color: <strong>\${escapeHTML(report.color || 'Unspecified')}</strong>
        </div>
        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
          📍 Location: <strong>\${escapeHTML(report.location)}</strong>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
          📅 Date Reported: \${formatDateTime(report.date || report.createdAt)} (\${getTimeAgo(report.date || report.createdAt)})
        </div>
      </div>
    </div>

    <div style="background: var(--bg-subtle); border-radius: 8px; padding: 12px 14px; margin-bottom: 16px; border: 1px solid var(--border-subtle);">
      <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); display: block;">Description & Details</span>
      <p style="margin: 4px 0 0; font-size: 0.86rem; color: var(--text-secondary); line-height: 1.5;">
        \${escapeHTML(report.description || 'No detailed description provided.')}
      </p>
    </div>

    <!-- Contact & Handover Privacy Card -->
    \${renderContactCard(report, isLost ? 'Owner' : 'Finder')}

    <!-- Actions Area -->
    <div style="margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
      <button type="button" class="btn btn-outline" style="border-color: rgba(239, 68, 68, 0.4); color: #F87171;" onclick="closeReportDetailsModal(); openItemHelpModal('\${report.id}', '\${escapeHTML(report.title)}', '\${escapeHTML(report.location)}')">
        <i data-lucide="shield-alert"></i>
        <span>🆘 Need Help?</span>
      </button>

      <div style="display: flex; gap: 8px;">
        <button type="button" class="btn btn-secondary" onclick="closeReportDetailsModal()">Close</button>
        \${!isLost && appState.user?.role?.toLowerCase() === 'admin' ? \`
          <button type="button" class="btn btn-primary" onclick="closeReportDetailsModal(); openAdminHandoverModal('\${report.id}', 'found')">
            <i data-lucide="package-check"></i>
            <span>Safe Handover</span>
          </button>
        \` : ''}
      </div>
    </div>
  \`;

  modal.classList.add('show');
  if (window.lucide) window.lucide.createIcons();
}

function closeReportDetailsModal() {
  const modal = document.getElementById('item-details-modal');
  if (modal) modal.classList.remove('show');
}

/* ==========================================================================
   OFFICIAL CAMPUS CONTACTS ADMIN SETTINGS HANDLER
   ========================================================================== */

function saveOfficialContactsSettings(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  if (!appState.officialContacts) {
    appState.officialContacts = JSON.parse(JSON.stringify(DEFAULT_OFFICIAL_CONTACTS));
  }

  const officePhone = document.getElementById('setting-phone-office')?.value.trim() || '';
  const secPhone = document.getElementById('setting-phone-security')?.value.trim() || '';
  const policePhone = document.getElementById('setting-phone-police')?.value.trim() || '';

  appState.officialContacts.campusOffice.phone = officePhone;
  appState.officialContacts.campusSecurity.phone = secPhone;
  appState.officialContacts.policeStation.phone = policePhone;

  saveData();
  renderHelpSafetyPage();
  showToast('Official campus directory contact numbers saved! 📞', 'success');
}
`;

if (!appJs.includes('function renderHelpSafetyPage')) {
  appJs += '\n' + newFeaturesCode;
}

// 8. In renderSettings, load contacts phone into inputs if admin
const renderSettingsTarget = `function renderSettings() {
  updateSettingsThemeCards(currentTheme);
  if (window.lucide) window.lucide.createIcons();
}`;

const renderSettingsReplacement = `function renderSettings() {
  updateSettingsThemeCards(currentTheme);

  // If Admin, populate Official Contacts editor
  const isAdmin = appState.user && appState.user.role && appState.user.role.toLowerCase() === 'admin';
  const contactsCard = document.getElementById('admin-settings-contacts-card');
  if (contactsCard) {
    contactsCard.style.display = isAdmin ? 'block' : 'none';
    if (isAdmin && appState.officialContacts) {
      const officeInput = document.getElementById('setting-phone-office');
      const secInput = document.getElementById('setting-phone-security');
      const policeInput = document.getElementById('setting-phone-police');

      if (officeInput) officeInput.value = appState.officialContacts.campusOffice?.phone || '';
      if (secInput) secInput.value = appState.officialContacts.campusSecurity?.phone || '';
      if (policeInput) policeInput.value = appState.officialContacts.policeStation?.phone || '';
    }
  }

  if (window.lucide) window.lucide.createIcons();
}`;

appJs = appJs.replace(renderSettingsTarget, renderSettingsReplacement);

// 9. Expose global window bindings
const globalBindings = `
window.handleLocationSelectChange = handleLocationSelectChange;
window.renderHelpSafetyPage = renderHelpSafetyPage;
window.handleComplaintSubmit = handleComplaintSubmit;
window.openItemHelpModal = openItemHelpModal;
window.closeItemHelpModal = closeItemHelpModal;
window.submitItemHelpRequest = submitItemHelpRequest;
window.renderAdminHelpDesk = renderAdminHelpDesk;
window.filterAdminHelpDeskTab = filterAdminHelpDeskTab;
window.handleAdminHelpSearch = handleAdminHelpSearch;
window.openAdminHelpDetailsModal = openAdminHelpDetailsModal;
window.closeAdminHelpDetailsModal = closeAdminHelpDetailsModal;
window.addAdminHelpInternalNote = addAdminHelpInternalNote;
window.updateAdminHelpStatus = updateAdminHelpStatus;
window.openReportDetailsModal = openReportDetailsModal;
window.closeReportDetailsModal = closeReportDetailsModal;
window.saveOfficialContactsSettings = saveOfficialContactsSettings;
`;

appJs += '\n' + globalBindings;

fs.writeFileSync('app.js', appJs, 'utf8');
console.log('Successfully updated app.js with full Help & Safety, Complaint, Urgent Modal, and Admin Desk features.');
