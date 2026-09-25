/* ==========================================================================
   ENHANCEMENTS & SPECIALIZED FLOWS
   ========================================================================== */

function filterAdminTableTab(type) {
  showPage('admin-page');
  const reportsTab = document.getElementById('admin-tab-reports');
  const claimsTab = document.getElementById('admin-tab-claims');

  if (type === 'claims') {
    if (claimsTab) claimsTab.click();
  } else {
    if (reportsTab) reportsTab.click();
    const typeFilter = document.getElementById('admin-filter-type');
    if (typeFilter) {
      typeFilter.value = (type === 'lost' ? 'Lost' : (type === 'found' ? 'Found' : ''));
      filterAdminReportsTable();
    }
  }
}
