const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');

console.log('=== CHECKING HTML ELEMENTS ===');
const requiredHtmlIds = [
  'admin-lost-page',
  'admin-found-page',
  'admin-all-page',
  'admin-claims-page',
  'admin-matches-page',
  'claim-review-modal',
  'report-history-modal',
  'create-claim-modal',
  'admin-lost-table-tbody',
  'admin-found-table-tbody',
  'admin-all-table-tbody',
  'admin-claims-table-tbody',
  'admin-matches-cards-container'
];

requiredHtmlIds.forEach(id => {
  console.log(`[HTML] #${id}: ${html.includes(id) ? 'FOUND' : 'MISSING'}`);
});

console.log('\n=== CHECKING APP.JS FUNCTIONS ===');
const requiredAppFunctions = [
  'renderAdminLostPage',
  'renderAdminFoundPage',
  'renderAdminAllReportsPage',
  'renderAdminClaimsPage',
  'renderAdminMatchCenterPage',
  'openCreateClaimModal',
  'submitCreateClaimFromModal',
  'openClaimReviewModal',
  'updateClaimStatus',
  'openReportHistoryModal',
  'extractVisualAttributes',
  'findMatches'
];

requiredAppFunctions.forEach(fn => {
  console.log(`[JS] ${fn}: ${app.includes(fn) ? 'FOUND' : 'MISSING'}`);
});

console.log('\n=== CHECKING CSS SELECTORS ===');
const requiredCss = [
  '.badge-type-lost',
  '.badge-type-found',
  '.explainable-reasons-box',
  '.reason-chip-matched',
  '.claim-evidence-box'
];

requiredCss.forEach(c => {
  console.log(`[CSS] ${c}: ${css.includes(c) ? 'FOUND' : 'MISSING'}`);
});
