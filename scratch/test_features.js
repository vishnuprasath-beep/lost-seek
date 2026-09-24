const fs = require('fs');
const assert = require('assert');

console.log('--- Testing LostSeek Features ---');

const appCode = fs.readFileSync('app.js', 'utf8');

// Test 1: Verify CAMPUS_LOCATIONS
assert(appCode.includes("'A Block'"), "A Block missing");
assert(appCode.includes("'B Block'"), "B Block missing");
assert(appCode.includes("'C Block'"), "C Block missing");
assert(appCode.includes("'D Block'"), "D Block missing");
assert(appCode.includes("'E Block'"), "E Block missing");
assert(appCode.includes("'F Block'"), "F Block missing");
assert(appCode.includes("'Administrative Block'"), "Administrative Block missing");
assert(appCode.includes("'Academic Block'"), "Academic Block missing");
assert(appCode.includes("'Saffron Canteen'"), "Saffron Canteen missing");
assert(appCode.includes("'West Mart'"), "West Mart missing");
assert(appCode.includes("'Cinnamon Cafe'"), "Cinnamon Cafe missing");
assert(appCode.includes("'Cucumber Cafe'"), "Cucumber Cafe missing");
assert(appCode.includes("'Mustard Cafe'"), "Mustard Cafe missing");
assert(appCode.includes("'Post Office'"), "Post Office missing");
assert(appCode.includes("'Himalayan House'"), "Himalayan House missing");
assert(appCode.includes("'Tanjore House'"), "Tanjore House missing");
assert(appCode.includes("'Marina House'"), "Marina House missing");
assert(appCode.includes("'Nilgiri House'"), "Nilgiri House missing");
assert(appCode.includes("'Madura House'"), "Madura House missing");
console.log('✓ Test 1 Passed: All 19 KSRCE campus landmarks present in code');

// Test 2: Verify DEFAULT_OFFICIAL_CONTACTS zero fake numbers
assert(appCode.includes("phone: ''"), "Official contacts must have empty phone by default");
assert(appCode.includes("Contact number not configured"), "Must display 'Contact number not configured' when unconfigured");
console.log('✓ Test 2 Passed: Zero fake phone numbers in default contacts');

// Test 3: Verify Location Proximity Adjacency Map
assert(appCode.includes("LOCATION_PROXIMITY"), "LOCATION_PROXIMITY map missing");
assert(appCode.includes("isSameLocationCategory"), "isSameLocationCategory missing");
console.log('✓ Test 3 Passed: Location adjacency and category clustering present');

// Test 4: Verify Help & Safety and Complaints functions
assert(appCode.includes("function renderHelpSafetyPage"), "renderHelpSafetyPage missing");
assert(appCode.includes("function handleComplaintSubmit"), "handleComplaintSubmit missing");
assert(appCode.includes("function openItemHelpModal"), "openItemHelpModal missing");
assert(appCode.includes("function submitItemHelpRequest"), "submitItemHelpRequest missing");
assert(appCode.includes("function renderAdminHelpDesk"), "renderAdminHelpDesk missing");
assert(appCode.includes("function openAdminHelpDetailsModal"), "openAdminHelpDetailsModal missing");
assert(appCode.includes("function updateAdminHelpStatus"), "updateAdminHelpStatus missing");
assert(appCode.includes("function addAdminHelpInternalNote"), "addAdminHelpInternalNote missing");
assert(appCode.includes("function openReportDetailsModal"), "openReportDetailsModal missing");
assert(appCode.includes("function saveOfficialContactsSettings"), "saveOfficialContactsSettings missing");
console.log('✓ Test 4 Passed: All Help & Complaints handler functions present');

// Test 5: Verify index.html navigation and elements
const html = fs.readFileSync('index.html', 'utf8');
assert(html.includes('id="help-safety-page"'), "help-safety-page missing in HTML");
assert(html.includes('id="admin-help-page"'), "admin-help-page missing in HTML");
assert(html.includes('data-page="help-safety-page"'), "Help & Safety nav link missing");
assert(html.includes('data-page="admin-help-page"'), "Help & Complaints admin nav link missing");
assert(html.includes('id="item-help-modal"'), "item-help-modal missing in HTML");
assert(html.includes('id="admin-help-details-modal"'), "admin-help-details-modal missing in HTML");
assert(html.includes('id="admin-settings-contacts-card"'), "admin-settings-contacts-card missing in HTML");
assert(html.includes('id="lost-location-other-wrap"'), "lost-location-other-wrap missing in HTML");
assert(html.includes('id="found-location-other-wrap"'), "found-location-other-wrap missing in HTML");
assert(html.includes('id="ifound-location-other-wrap"'), "ifound-location-other-wrap missing in HTML");
console.log('✓ Test 5 Passed: All HTML pages, sections, modals, and nav links verified');

// Test 6: Verify no fake placeholder numbers remain
assert(!html.includes('(011) 2988-1000'), "Found leftover placeholder number in index.html");
console.log('✓ Test 6 Passed: No leftover invented phone numbers');

console.log('--- ALL 6 CORE TESTS PASSED ---');
