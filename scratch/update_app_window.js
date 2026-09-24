const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');

// Ensure window.appState is synced
if (!appJs.includes('window.appState = appState;')) {
  appJs = appJs.replace('let appState = {', 'let appState = window.appState = {');
}

// In loadData:
appJs = appJs.replace('saveData();\n  }', 'saveData();\n  }\n  window.appState = appState;');

// At bottom of app.js
const extraExports = `
window.setupAuthenticatedUser = setupAuthenticatedUser;
window.showPage = showPage;
window.saveData = saveData;
window.loadData = loadData;
`;

if (!appJs.includes('window.setupAuthenticatedUser = setupAuthenticatedUser;')) {
  appJs += extraExports;
}

fs.writeFileSync('app.js', appJs, 'utf8');
console.log('Successfully exposed window.appState, showPage, and setupAuthenticatedUser.');
