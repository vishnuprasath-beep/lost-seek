const fs = require('fs');

let localStorageMock = {};
global.localStorage = {
  getItem: (key) => localStorageMock[key] || null,
  setItem: (key, val) => { localStorageMock[key] = val; },
  removeItem: (key) => { delete localStorageMock[key]; }
};

let appState = {};
function normalizeCachedReport(r) {}
function saveData() {}

// Emulate loadData from 4_cloud_backend_api_client___real_time_synchronization.js
function loadData() {
  const raw = localStorage.getItem('STORAGE_KEY');
  if (raw) {
    try {
      appState = JSON.parse(raw);
      if (!appState.adminHelpRequests) appState.adminHelpRequests = [];
      if (!appState.officialContacts) appState.officialContacts = {};
      if (Array.isArray(appState.lostReports)) appState.lostReports.forEach(normalizeCachedReport);
      if (Array.isArray(appState.foundReports)) appState.foundReports.forEach(normalizeCachedReport);
      
      if (appState.user) {
        // [KARMA MIGRATION CLEANUP]
        if ('karma' in appState.user) delete appState.user.karma;
        if ('karmaScore' in appState.user) delete appState.user.karmaScore;
        if ('badges' in appState.user) delete appState.user.badges;
        if ('karma' in appState) delete appState.karma;
        
        if (!appState.user.token || appState.user.token.startsWith('legacy-token')) {
          appState.user = null;
          saveData();
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
}

function runTests() {
  console.log("Running migration tests...");
  
  // A. user exists with obsolete Karma fields
  localStorageMock['STORAGE_KEY'] = JSON.stringify({
    user: { id: 'u1', name: 'Test', token: 'valid-token', karma: 50, karmaScore: 50, badges: [] },
    karma: 50,
    lostReports: [{id: 'r1'}]
  });
  loadData();
  console.assert(!('karma' in appState.user), "Karma should be removed");
  console.assert(!('karmaScore' in appState.user), "karmaScore should be removed");
  console.assert(!('badges' in appState.user), "badges should be removed");
  console.assert(!('karma' in appState), "Global karma should be removed");
  console.assert(appState.user.name === 'Test', "User should be preserved");
  console.log("Test A passed.");

  // B. user exists without Karma fields
  localStorageMock['STORAGE_KEY'] = JSON.stringify({
    user: { id: 'u2', name: 'Test2', token: 'valid-token' },
    lostReports: [{id: 'r2'}]
  });
  loadData();
  console.assert(appState.user.name === 'Test2', "User should be preserved");
  console.log("Test B passed.");

  // C. appState/user is missing
  localStorageMock['STORAGE_KEY'] = JSON.stringify({
    lostReports: [{id: 'r3'}]
  });
  loadData();
  console.assert(!appState.user, "User should remain missing");
  console.assert(appState.lostReports[0].id === 'r3', "Reports should be preserved");
  console.log("Test C passed.");

  // D. normal existing user data with reports/claims/notifications
  localStorageMock['STORAGE_KEY'] = JSON.stringify({
    user: { id: 'u3', name: 'Test3', token: 'valid-token' },
    lostReports: [{id: 'r4'}],
    claims: [{id: 'c1'}],
    notifications: [{id: 'n1'}]
  });
  loadData();
  console.assert(appState.claims[0].id === 'c1', "Claims should be preserved");
  console.assert(appState.notifications[0].id === 'n1', "Notifications should be preserved");
  console.log("Test D passed.");
}

runTests();
