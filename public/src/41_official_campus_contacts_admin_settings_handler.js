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

window.setupAuthenticatedUser = setupAuthenticatedUser;
window.showPage = showPage;
window.saveData = saveData;
window.loadData = loadData;

