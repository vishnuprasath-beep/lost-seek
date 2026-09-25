/* ==========================================================================
   GLOBAL ALIASES & ROLE SWITCHING
   ========================================================================== */
function switchRole(role) {
  if (!appState.user) {
    setLoginRole(role);
    return;
  }
  appState.user.role = role;
  saveData();
  setupAuthenticatedUser();
  renderAllViews();
  showToast('Switched view to ' + (role === 'admin' ? 'Admin / Security Desk' : 'Student') + ' mode', 'info');
}

window.switchRole = switchRole;
window.downloadQR = typeof downloadQrCode === 'function' ? downloadQrCode : function() { downloadQrCode(); };
window.openQrModal = openQrModal;
window.closeQrModal = closeQrModal;
window.downloadReportPdf = downloadReportPdf;
window.downloadReceiptPdf = downloadReceiptPdf;
window.openPublicVerification = openPublicVerification;
window.closePublicVerificationModal = closePublicVerificationModal;
window.openAdminHandoverModal = openAdminHandoverModal;
window.closeAdminHandoverModal = closeAdminHandoverModal;
window.confirmAdminHandover = confirmAdminHandover;
window.requestAdminAssistedReturn = requestAdminAssistedReturn;
window.resolveAdminHelpRequest = resolveAdminHelpRequest;
window.handlePhoneInputChanged = handlePhoneInputChanged;


