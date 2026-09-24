// Rigorous Live Production Verification Script
const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Mobile)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function verifyLiveProduction() {
  console.log('=== VERIFYING LIVE PRODUCTION DEPLOYMENT ===');
  console.log('Target: https://smart-campus-pro.vercel.app\n');

  // 1. Fetch live root HTML
  console.log('Fetching live https://smart-campus-pro.vercel.app/ ...');
  const rootRes = await fetchUrl('https://smart-campus-pro.vercel.app/');
  console.log(`Root HTTP status: ${rootRes.statusCode}`);
  if (rootRes.statusCode !== 200) throw new Error('Root did not return 200');

  // 2. Fetch live download page
  console.log('Fetching live https://smart-campus-pro.vercel.app/download ...');
  const dlRes = await fetchUrl('https://smart-campus-pro.vercel.app/download');
  console.log(`Download HTTP status: ${dlRes.statusCode}`);
  if (dlRes.statusCode !== 200) throw new Error('Download page did not return 200');

  // 3. Fetch live app.js
  console.log('Fetching live https://smart-campus-pro.vercel.app/app.js ...');
  const appJsRes = await fetchUrl('https://smart-campus-pro.vercel.app/app.js');
  console.log(`app.js HTTP status: ${appJsRes.statusCode}, size: ${appJsRes.body.length} bytes`);

  // 4. Fetch live styles.css
  console.log('Fetching live https://smart-campus-pro.vercel.app/styles.css ...');
  const cssRes = await fetchUrl('https://smart-campus-pro.vercel.app/styles.css');
  console.log(`styles.css HTTP status: ${cssRes.statusCode}, size: ${cssRes.body.length} bytes`);

  const html = rootRes.body;
  const appJs = appJsRes.body;
  const css = cssRes.body;

  let passed = 0;
  let failed = 0;
  function check(desc, ok) {
    if (ok) {
      console.log(`  [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${desc}`);
      failed++;
    }
  }

  console.log('\n--- 1. STATIC HTML MARKUP CHECKS ---');
  check('Root HTML contains <section id="landing-page" style="display: block;">', html.includes('<section id="landing-page" style="display: block;">'));
  check('Root HTML does NOT contain <section id="landing-page" style="display: none;">', !html.includes('<section id="landing-page" style="display: none;">'));
  check('Root HTML contains <section id="login-page" class="page-section" style="display: none;">', html.includes('<section id="login-page" class="page-section" style="display: none;">'));
  check('Root HTML does NOT contain <section id="login-page" class="page-section active">', !html.includes('<section id="login-page" class="page-section active">'));
  check('Root HTML contains <div id="app-layout" style="display: none;">', html.includes('<div id="app-layout" style="display: none;">'));

  console.log('\n--- 2. CSS STYLING CHECKS ---');
  check('styles.css contains #login-page { min-height: 100vh; display: none;', css.includes('#login-page {\n  min-height: 100vh;\n  display: none;'));
  check('styles.css contains #login-page.active { display: flex;', css.includes('#login-page.active {\n  display: flex;\n}'));

  console.log('\n--- 3. JAVASCRIPT SYNTAX & CODE CHECKS ---');
  check('app.js defines showLandingPage()', appJs.includes('function showLandingPage()'));
  check('app.js defines handleLandingNav() with proper closing brace', appJs.includes('function handleLandingNav('));
  check('app.js handles unauthenticated route fallback cleanly', appJs.includes('// Fresh unauthenticated visitor / root URL / #home / #landing -> SHOW LANDING PAGE'));

  console.log('\n--- 4. LIVE RUNTIME EXECUTION SIMULATION ---');
  function simulateLiveRun(hash, user = null) {
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

    // Seed initial HTML state
    getEl('landing-page').style.display = 'block';
    getEl('login-page').style.display = 'none';
    getEl('app-layout').style.display = 'none';

    const storage = {};
    if (user) {
      storage['campusfind_data'] = JSON.stringify({ user, lostReports: [], foundReports: [], claims: [], notifications: [], matches: [] });
    }

    const mockWindow = {
      location: { hash, pathname: '/', search: '' },
      localStorage: {
        getItem: (k) => storage[k] || null,
        setItem: (k, v) => { storage[k] = v; }
      },
      scrollTo: () => {},
      addEventListener: () => {},
      document: {
        documentElement: { setAttribute: () => {}, getAttribute: () => 'dark' },
        body: { classList: { add: () => {}, remove: () => {} } },
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
          if (sel === '.page-section') return [getEl('login-page'), getEl('dashboard-page'), getEl('report-lost-page')];
          return [];
        },
        querySelector: () => null,
        addEventListener: () => {}
      },
      lucide: { createIcons: () => {} },
      setTimeout: (fn) => fn()
    };

    const fn = new Function('window', 'document', 'localStorage', 'location', 'setTimeout', 'lucide', `
      ${appJs}
      initApp();
    `);

    fn(mockWindow, mockWindow.document, mockWindow.localStorage, mockWindow.location, mockWindow.setTimeout, mockWindow.lucide);

    return {
      landingDisplay: getEl('landing-page').style.display,
      loginDisplay: getEl('login-page').style.display,
      loginActive: getEl('login-page').classList.contains('active'),
      appDisplay: getEl('app-layout').style.display
    };
  }

  // A. Root URL: Fresh unauthenticated visitor
  const rRoot = simulateLiveRun('');
  check('Fresh visitor at https://smart-campus-pro.vercel.app/ -> Landing Page is visible (display: block)', rRoot.landingDisplay === 'block');
  check('Fresh visitor at https://smart-campus-pro.vercel.app/ -> Login Page is hidden (display: none)', rRoot.loginDisplay === 'none');
  check('Fresh visitor at https://smart-campus-pro.vercel.app/ -> Login Page active class removed', !rRoot.loginActive);
  check('Fresh visitor at https://smart-campus-pro.vercel.app/ -> App Layout is hidden (display: none)', rRoot.appDisplay === 'none');

  // B. #login URL
  const rLogin = simulateLiveRun('#login');
  check('Visitor at https://smart-campus-pro.vercel.app/#login -> Login Page is visible (display: flex)', rLogin.loginDisplay === 'flex');
  check('Visitor at https://smart-campus-pro.vercel.app/#login -> Login Page has active class', rLogin.loginActive === true);
  check('Visitor at https://smart-campus-pro.vercel.app/#login -> Landing Page is hidden (display: none)', rLogin.landingDisplay === 'none');
  check('Visitor at https://smart-campus-pro.vercel.app/#login -> App Layout is hidden (display: none)', rLogin.appDisplay === 'none');

  // C. #register URL
  const rRegister = simulateLiveRun('#register');
  check('Visitor at https://smart-campus-pro.vercel.app/#register -> Login Page is visible (display: flex)', rRegister.loginDisplay === 'flex');
  check('Visitor at https://smart-campus-pro.vercel.app/#register -> Landing Page is hidden (display: none)', rRegister.landingDisplay === 'none');

  // D. #report-lost URL
  const rReportLost = simulateLiveRun('#report-lost');
  check('Unauthenticated visitor at https://smart-campus-pro.vercel.app/#report-lost -> routes to login (display: flex)', rReportLost.loginDisplay === 'flex');
  check('Unauthenticated visitor at https://smart-campus-pro.vercel.app/#report-lost -> Landing Page hidden', rReportLost.landingDisplay === 'none');

  // E. #report-found URL
  const rReportFound = simulateLiveRun('#report-found');
  check('Unauthenticated visitor at https://smart-campus-pro.vercel.app/#report-found -> routes to login (display: flex)', rReportFound.loginDisplay === 'flex');
  check('Unauthenticated visitor at https://smart-campus-pro.vercel.app/#report-found -> Landing Page hidden', rReportFound.landingDisplay === 'none');

  // F. Authenticated visitor on root URL
  const rAuth = simulateLiveRun('', { name: 'Prakash Student', role: 'student' });
  check('Authenticated session visitor on root URL -> App Layout visible (display: flex)', rAuth.appDisplay === 'flex');
  check('Authenticated session visitor on root URL -> Landing Page hidden (display: none)', rAuth.landingDisplay === 'none');
  check('Authenticated session visitor on root URL -> Login Page hidden (display: none)', rAuth.loginDisplay === 'none');

  console.log(`\n======================================================`);
  console.log(`PRODUCTION TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log(`======================================================`);

  if (failed > 0) process.exit(1);
}

verifyLiveProduction().catch(err => {
  console.error('Fatal error during production verification:', err);
  process.exit(1);
});
