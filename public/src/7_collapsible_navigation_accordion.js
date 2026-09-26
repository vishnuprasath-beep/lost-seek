/* ==========================================================================
   COLLAPSIBLE NAVIGATION ACCORDION
   ========================================================================== */
function toggleNavGroup(headerEl) {
  const group = headerEl.closest('.nav-group');
  if (group) {
    const isCollapsed = group.classList.toggle('collapsed');
    headerEl.setAttribute('aria-expanded', !isCollapsed);
  }
}

let activeContactHelpReportId = null;

function openAdminContactHelpModal(reportId) {
  ensureModalsLoaded();
  activeContactHelpReportId = reportId;
  const modal = document.getElementById('admin-contact-help-modal');
  if (modal) modal.classList.add('show');
}

function closeAdminContactHelpModal() {
  activeContactHelpReportId = null;
  const modal = document.getElementById('admin-contact-help-modal');
  if (modal) modal.classList.remove('show');
}




function toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar && backdrop) {
    sidebar.classList.toggle('open');
    backdrop.classList.toggle('open');
  }
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar && backdrop) {
    sidebar.classList.remove('open');
    backdrop.classList.remove('open');
  }
}

window.toggleNavGroup = toggleNavGroup;
window.openAdminContactHelpModal = openAdminContactHelpModal;
window.closeAdminContactHelpModal = closeAdminContactHelpModal;
window.toggleMobileSidebar = toggleMobileSidebar;
window.closeMobileSidebar = closeMobileSidebar;
