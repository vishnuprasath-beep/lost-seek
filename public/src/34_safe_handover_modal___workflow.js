/* ==========================================================================
   SAFE HANDOVER MODAL & WORKFLOW
   ========================================================================== */
let activeHandoverClaimId = null;

function openAdminHandoverModal(targetId) {
  let claim = appState.claims.find(c => c.id === targetId || c.lostReportId === targetId || c.foundReportId === targetId);
  if (!claim) {
    const item = appState.lostReports.find(r => r.id === targetId) || appState.foundReports.find(r => r.id === targetId);
    if (!item) {
      showToast('Item or Claim not found', 'error');
      return;
    }
    claim = {
      id: generateId('claim'),
      lostReportId: (item.type === 'lost' || appState.lostReports.some(r => r.id === item.id)) ? item.id : null,
      foundReportId: (item.type === 'found' || appState.foundReports.some(r => r.id === item.id)) ? item.id : null,
      claimantName: item.reporterName || 'Verified Student',
      verificationAnswer: 'Ownership verified in person at Security Desk.',
      status: 'Approved',
      createdAt: new Date().toISOString()
    };
    appState.claims.push(claim);
  }

  activeHandoverClaimId = claim.id;
  const lost = appState.lostReports.find(r => r.id === claim.lostReportId);
  const found = appState.foundReports.find(r => r.id === claim.foundReportId);

  const modal = document.getElementById('admin-handover-modal');
  if (!modal) return;

  const itemTitle = document.getElementById('handover-item-title');
  const ownerName = document.getElementById('handover-owner-name');
  const ownerContact = document.getElementById('handover-owner-contact');
  const finderName = document.getElementById('handover-finder-name');
  const storageLoc = document.getElementById('handover-storage-location');
  const verifText = document.getElementById('handover-verification-text');
  const claimIdHidden = document.getElementById('handover-claim-id');
  const lostIdHidden = document.getElementById('handover-lost-id');
  const foundIdHidden = document.getElementById('handover-found-id');
  const dtInput = document.getElementById('handover-datetime');
  const adminNameInput = document.getElementById('handover-admin-name');
  const notesInput = document.getElementById('handover-notes');

  if (itemTitle) itemTitle.textContent = lost?.title || found?.title || 'Campus Item';
  if (ownerName) ownerName.textContent = claim.claimantName || 'Student';
  if (ownerContact) {
    const lostPhone = lost?.phone || lost?.phoneNumber || lost?.phone_number || '';
    const lostShared = !!(lost?.sharePhone ?? lost?.phoneSharingConsent ?? lost?.phone_sharing_consent);
    if (lostPhone && lostShared) {
      ownerContact.textContent = `📞 ${lostPhone} (Consented)`;
    } else if (lostPhone || lost?.hasPhoneProvided) {
      ownerContact.textContent = '🔒 Number kept private';
    } else {
      ownerContact.textContent = 'ℹ️ No phone provided';
    }
  }
  if (finderName) finderName.textContent = found?.finderName || 'Campus Finder';
  if (storageLoc) storageLoc.textContent = `📍 ${found?.location || 'Main Security Desk'}`;
  if (verifText) verifText.textContent = `"${claim.verificationAnswer || 'Verified ownership through student card & purchase invoice.'}"`;

  if (claimIdHidden) claimIdHidden.value = claim.id;
  if (lostIdHidden) lostIdHidden.value = claim.lostReportId || '';
  if (foundIdHidden) foundIdHidden.value = claim.foundReportId || '';

  if (dtInput) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dtInput.value = now.toISOString().slice(0, 16);
  }

  if (adminNameInput) {
    adminNameInput.value = appState.user?.name || 'Security Desk Officer';
  }

  if (notesInput) notesInput.value = '';

  modal.classList.add('show');
  if (window.lucide) window.lucide.createIcons();
}

function closeAdminHandoverModal() {
  activeHandoverClaimId = null;
  const modal = document.getElementById('admin-handover-modal');
  if (modal) modal.classList.remove('show');
}

function confirmAdminHandover() {
  const claimId = document.getElementById('handover-claim-id')?.value;
  const lostId = document.getElementById('handover-lost-id')?.value;
  const foundId = document.getElementById('handover-found-id')?.value;
  const dt = document.getElementById('handover-datetime')?.value || new Date().toISOString();
  const adminName = document.getElementById('handover-admin-name')?.value.trim() || 'Campus Admin';
  const notes = document.getElementById('handover-notes')?.value.trim() || 'Item handed over safely to verified owner.';

  const claim = appState.claims.find(c => c.id === claimId);
  const lost = appState.lostReports.find(r => r.id === lostId);
  const found = appState.foundReports.find(r => r.id === foundId);

  const handoverRecord = {
    handoverDate: dt,
    adminName: adminName,
    notes: notes,
    recordedAt: new Date().toISOString()
  };

  if (claim) {
    claim.status = 'Returned';
    claim.handover = handoverRecord;
  }

  if (lost) {
    lost.status = 'Returned';
    lost.handover = handoverRecord;
  }

  if (found) {
    found.status = 'Returned';
    found.handover = handoverRecord;
  }

  const title = lost?.title || found?.title || 'Item';

  // Notifications
  appState.notifications.unshift({
    id: generateId('notif'),
    message: `🤝 Handover recorded: Your lost item "${title}" was safely handed over to you by ${adminName} at the Campus Security Desk.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  if (found && found.finderName && found.finderName !== lost?.reporterName) {
    appState.notifications.unshift({
      id: generateId('notif'),
      message: `🎉 Safe Handover complete: The item you found ("${title}") was successfully returned to its verified owner!`,
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  addKarma(25, 'Physical Handover Verified');
  saveData();
  renderAllViews();
  closeAdminHandoverModal();
  showToast('Handover recorded! Item marked Returned 🤝 +25 Karma', 'success');

  if (claimId) {
    setTimeout(() => {
      downloadReceiptPdf(claimId);
    }, 600);
  }
}
