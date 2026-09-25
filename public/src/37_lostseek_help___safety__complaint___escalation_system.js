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
    bridgeHelplineEl.innerHTML = `📞 <strong>Desk Helpline:</strong> ${getOfficialContactDisplay(contacts.campusSecurity?.phone)}`;
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
      optionsHTML += `<option value="${rep.id}">[${rep.typeLabel}] ${escapeHTML(rep.title)} (📍 ${escapeHTML(rep.location)})</option>`;
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
        text: `Formal complaint filed by ${appState.user?.name || 'Student'} (${appState.user?.studentId || 'STU-2026'}). Severity: ${urgency}.`,
        createdAt: new Date().toISOString()
      }
    ]
  };

  if (!appState.adminHelpRequests) appState.adminHelpRequests = [];
  appState.adminHelpRequests.unshift(ticket);

  // Student notification
  appState.notifications.unshift({
    id: generateId('notif'),
    message: `🛡️ Dispute escalation filed (Ref #${ticket.id}): Campus Administration has been notified and assigned this case for investigation.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  // Admin alert
  appState.notifications.unshift({
    id: generateId('notif'),
    message: `🚨 New Student Complaint (#${ticket.id}): ${complaintType} at ${location} [${urgency}]. Immediate review requested.`,
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

  showToast(`Complaint filed successfully! Case Ref #${ticket.id} logged with Campus Administration 🛡️`, 'success');
}
