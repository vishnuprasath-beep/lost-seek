// Verification script for Landing Page Routing Fix
const fs = require('fs');
const path = require('path');

console.log('=== VERIFYING ROUTING & INITIALIZATION IN INDEX.HTML & APP.JS ===\n');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

let pass = 0;
let fail = 0;

function test(description, condition) {
  if (condition) {
    console.log(`[PASS] ${description}`);
    pass++;
  } else {
    console.error(`[FAIL] ${description}`);
    fail++;
  }
}

// 1. Initial HTML markup state
test('index.html: #landing-page has style="display: block;"', indexHtml.includes('<section id="landing-page" style="display: block;">'));
test('index.html: #landing-page does NOT have style="display: none;"', !indexHtml.includes('<section id="landing-page" style="display: none;">'));
test('index.html: #login-page has style="display: none;"', indexHtml.includes('<section id="login-page" class="page-section" style="display: none;">'));
test('index.html: #login-page does NOT have "page-section active" in initial HTML', !indexHtml.includes('<section id="login-page" class="page-section active">'));
test('index.html: #app-layout has style="display: none;"', indexHtml.includes('<div id="app-layout" style="display: none;">'));

// 2. CSS Rules
test('styles.css: #login-page has display: none by default', stylesCss.includes('#login-page {\n  min-height: 100vh;\n  display: none;'));
test('styles.css: #login-page.active has display: flex', stylesCss.includes('#login-page.active {\n  display: flex;\n}'));

// 3. app.js Syntax & Functions
test('app.js: defines showLandingPage()', appJs.includes('function showLandingPage()'));
test('app.js: defines showLoginPage()', appJs.includes('function showLoginPage()'));
test('app.js: defines handleLandingNav()', appJs.includes('function handleLandingNav('));
test('app.js: defines handleHashNavigation()', appJs.includes('function handleHashNavigation()'));

// 4. Test execution logic with lightweight simulated DOM
function createMockEnvironment(hash = '', user = null) {
  const elements = {};
  
  function getEl(id) {
    if (!elements[id]) {
      elements[id] = {
        id,
        style: {},
        classList: {
          classes: new Set(),
          add(c) { this.classes.add(c); },
          remove(c) { this.classes.delete(c); },
          contains(c) { return this.classes.has(c); },
          toggle(c) { if (this.classes.has(c)) { this.classes.delete(c); return false; } else { this.classes.add(c); return true; } }
        },
        innerHTML: '',
        value: '',
        setAttribute(k, v) { this[k] = v; },
        getAttribute(k) { return this[k]; },
        appendChild() {},
        remove() {},
        addEventListener() {},
        scrollIntoView() {},
        closest() { return null; },
        querySelectorAll() { return []; }
      };
    }
    return elements[id];
  }

  // Pre-seed known elements with initial HTML state
  const landing = getEl('landing-page');
  landing.style.display = 'block';

  const login = getEl('login-page');
  login.style.display = 'none';

  const appLayout = getEl('app-layout');
  appLayout.style.display = 'none';

  const storage = {};
  if (user) {
    storage['campusfind_data'] = JSON.stringify({ user, lostReports: [], foundReports: [], claims: [], notifications: [], matches: [] });
  }

  const mockWindow = {
    location: {
      hash: hash,
      pathname: '/',
      search: ''
    },
    localStorage: {
      getItem: (k) => storage[k] || null,
      setItem: (k, v) => { storage[k] = v; }
    },
    scrollTo: () => {},
    addEventListener: (ev, cb) => {
      mockWindow._listeners = mockWindow._listeners || {};
      mockWindow._listeners[ev] = cb;
    },
    document: {
      documentElement: {
        setAttribute: () => {},
        getAttribute: () => 'dark'
      },
      body: {
        classList: { add: () => {}, remove: () => {} }
      },
      createElement: (tag) => ({
        style: {},
        classList: { add: () => {}, remove: () => {} },
        setAttribute: () => {},
        appendChild: () => {},
        remove: () => {},
        innerHTML: ''
      }),
      getElementById: (id) => getEl(id),
      querySelectorAll: (sel) => {
        if (sel === '.page-section') return [login, getEl('dashboard-page'), getEl('report-lost-page')];
        if (sel === '.nav-link') return [];
        return [];
      },
      querySelector: (sel) => null,
      addEventListener: (ev, cb) => {
        mockWindow.document._listeners = mockWindow.document._listeners || {};
        mockWindow.document._listeners[ev] = cb;
      }
    },
    lucide: { createIcons: () => {} },
    setTimeout: (fn) => fn()
  };

  return { mockWindow, getEl };
}

// Function to run script against mock window
function simulateStartup(hash = '', user = null) {
  const { mockWindow, getEl } = createMockEnvironment(hash, user);
  
  // Create sandbox function wrapping app.js
  const fn = new Function('window', 'document', 'localStorage', 'location', 'setTimeout', 'lucide', `
    ${appJs}
    if (typeof initApp === 'function') {
      initApp();
    }
  `);

  fn(mockWindow, mockWindow.document, mockWindow.localStorage, mockWindow.location, mockWindow.setTimeout, mockWindow.lucide);

  return {
    landingDisplay: getEl('landing-page').style.display,
    loginDisplay: getEl('login-page').style.display,
    loginActive: getEl('login-page').classList.contains('active'),
    appDisplay: getEl('app-layout').style.display,
  };
}

// Test A: Fresh unauthenticated visitor on root URL /
const simRoot = simulateStartup('', null);
test('Fresh visitor (root /): #landing-page is display:block', simRoot.landingDisplay === 'block');
test('Fresh visitor (root /): #login-page is display:none', simRoot.loginDisplay === 'none');
test('Fresh visitor (root /): #login-page does not have active class', !simRoot.loginActive);
test('Fresh visitor (root /): #app-layout is display:none', simRoot.appDisplay === 'none');

// Test B: Unauthenticated visitor with #login
const simLogin = simulateStartup('#login', null);
test('#login visitor: #landing-page is display:none', simLogin.landingDisplay === 'none');
test('#login visitor: #login-page is display:flex', simLogin.loginDisplay === 'flex');
test('#login visitor: #login-page has active class', simLogin.loginActive === true);
test('#login visitor: #app-layout is display:none', simLogin.appDisplay === 'none');

// Test C: Unauthenticated visitor with #register
const simRegister = simulateStartup('#register', null);
test('#register visitor: #landing-page is display:none', simRegister.landingDisplay === 'none');
test('#register visitor: #login-page is display:flex', simRegister.loginDisplay === 'flex');

// Test D: Unauthenticated visitor with #report-lost
const simReportLost = simulateStartup('#report-lost', null);
test('#report-lost unauth visitor: routes to login flow (#login-page flex)', simReportLost.loginDisplay === 'flex');
test('#report-lost unauth visitor: #landing-page is display:none', simReportLost.landingDisplay === 'none');

// Test E: Unauthenticated visitor with #report-found
const simReportFound = simulateStartup('#report-found', null);
test('#report-found unauth visitor: routes to login flow (#login-page flex)', simReportFound.loginDisplay === 'flex');
test('#report-found unauth visitor: #landing-page is display:none', simReportFound.landingDisplay === 'none');

// Test F: Authenticated visitor on root URL /
const simAuth = simulateStartup('', { name: 'Prakash Student', role: 'student' });
test('Authenticated visitor: #landing-page is display:none', simAuth.landingDisplay === 'none');
test('Authenticated visitor: #login-page is display:none', simAuth.loginDisplay === 'none');
test('Authenticated visitor: #app-layout is display:flex', simAuth.appDisplay === 'flex');

console.log(`\nRESULTS: ${pass} PASSED, ${fail} FAILED`);
if (fail > 0) process.exit(1);
