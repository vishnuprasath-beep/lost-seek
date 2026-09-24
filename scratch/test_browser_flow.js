const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Users\\' + (process.env.USERNAME || 'prakash c') + '\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
];
const chromePath = chromePaths.find(p => fs.existsSync(p));
if (!chromePath) {
  console.error('Chrome executable not found!');
  process.exit(1);
}

const remotePort = 9222;
const chromeProc = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${remotePort}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  'http://localhost:3000'
]);

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.pending = new Map();
  }

  async init() {
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id && this.pending.has(data.id)) {
          const { resolve, reject } = this.pending.get(data.id);
          this.pending.delete(data.id);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  await wait(1500);
  const targets = await getJson(`http://localhost:${remotePort}/json`);
  const pageTarget = targets.find(t => t.type === 'page' || t.url.includes('localhost:3000'));
  if (!pageTarget) {
    console.error('No page target found');
    chromeProc.kill();
    process.exit(1);
  }

  const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await client.init();
  await client.send('Page.enable');
  await client.send('Runtime.enable');

  console.log('Connected to headless Chrome.');

  // Test 1: Verify Initial Login Form is blank
  const initialInputs = await client.eval(`(() => {
    return {
      username: document.getElementById('login-username').value,
      password: document.getElementById('login-password').value
    };
  })()`);

  console.log('Initial Login Inputs Check:', initialInputs);
  if (initialInputs.username === '' && initialInputs.password === '') {
    console.log('[PASS] Login page is strictly blank on initial load.');
  } else {
    console.error('[FAIL] Login page fields are not blank!', initialInputs);
  }

  // The 6 Student Accounts + Existing Accounts to Test
  const testAccounts = [
    { name: 'Vishnu Prasath', role: 'student', loginId: 'vishnu.prasath', pass: 'VP73#Kmp9s', id: 'STU-2026-1011' },
    { name: 'Vishnu Varthan', role: 'student', loginId: 'vishnu.varthan', pass: 'VV28$Sky4m', id: 'STU-2026-1012' },
    { name: 'Sivavaiyapuri', role: 'student', loginId: 'sivavaiyapuri', pass: 'SV84@Qst6r', id: 'STU-2026-1013' },
    { name: 'Boobathy', role: 'student', loginId: 'boobathy', pass: 'BB59*Lnk2v', id: 'STU-2026-1014' },
    { name: 'Krish', role: 'student', loginId: 'krish', pass: 'KR91!Trk7p', id: 'STU-2026-1015' },
    { name: 'Girl1', role: 'student', loginId: 'girl1', pass: 'GL36#Hvn8x', id: 'STU-2026-1016' },
    // Existing Student & Admin
    { name: 'Alex Rivera', role: 'student', loginId: 'student@campus.edu', pass: 'StudentPass2026!', id: 'STU-2026-8891' },
    { name: 'Vikram Singh', role: 'admin', loginId: 'admin@campus.edu', pass: 'AdminPass2026!', id: 'ADM-FAC-4402' }
  ];

  let testCount = 0;
  let passCount = 0;

  for (const acct of testAccounts) {
    console.log(`\n========================================`);
    console.log(`TESTING ACCOUNT: ${acct.name} (${acct.loginId}) [Role: ${acct.role}]`);
    console.log(`========================================`);

    // Ensure we are on login page
    await client.eval(`logout()`);
    await wait(300);

    // Step A: Perform Login
    const loginResult = await client.eval(`(async () => {
      setLoginRole('${acct.role}');
      document.getElementById('login-username').value = '${acct.loginId}';
      document.getElementById('login-password').value = '${acct.pass}';
      
      const form = document.getElementById('login-form');
      const submitEvt = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvt);
      await new Promise(r => setTimeout(r, 600));

      return {
        userLoggedIn: !!appState.user,
        currentUser: appState.user,
        displayName: document.getElementById('user-name-display')?.textContent,
        displayRole: document.getElementById('user-role-display')?.textContent,
        appLayoutVisible: document.getElementById('app-layout').style.display !== 'none',
        loginPageHidden: document.getElementById('login-page').style.display === 'none'
      };
    })()`);

    testCount++;
    if (loginResult.userLoggedIn && loginResult.currentUser?.name === acct.name) {
      console.log(`[PASS] Login succeeded for ${acct.name}`);
      passCount++;
    } else {
      console.error(`[FAIL] Login failed for ${acct.name}`, loginResult);
    }

    if (acct.role === 'student') {
      // Step B: Student Permissions & Admin Route Guard
      const permCheck = await client.eval(`(() => {
        const studentNavVisible = document.getElementById('student-nav-sections').style.display !== 'none';
        const adminNavHidden = document.getElementById('admin-nav-sections').style.display === 'none';
        const studentDashVisible = document.getElementById('student-dashboard-view').style.display !== 'none';
        const adminDashHidden = document.getElementById('admin-dashboard-view').style.display === 'none';

        // Attempt to navigate to admin page
        showPage('admin-page');
        const adminPageNotActive = !document.getElementById('admin-page').classList.contains('active');

        // Also test admin students page
        showPage('admin-students-page');
        const adminStudentsNotActive = !document.getElementById('admin-students-page').classList.contains('active');

        return {
          studentNavVisible,
          adminNavHidden,
          studentDashVisible,
          adminDashHidden,
          adminPageBlocked: adminPageNotActive,
          adminStudentsBlocked: adminStudentsNotActive
        };
      })()`);

      testCount++;
      if (permCheck.studentNavVisible && permCheck.adminNavHidden && permCheck.adminPageBlocked && permCheck.adminStudentsBlocked) {
        console.log(`[PASS] Role permissions strictly enforced: Admin access blocked for ${acct.name}`);
        passCount++;
      } else {
        console.error(`[FAIL] Permission check failed for ${acct.name}`, permCheck);
      }

      // Step C: Student Profile View
      const profileCheck = await client.eval(`(() => {
        showPage('profile-page');
        const container = document.getElementById('profile-content-container');
        const text = container ? container.textContent : '';
        return {
          hasName: text.includes('${acct.name}'),
          hasStudentId: text.includes('${acct.id}'),
          hasStudentRole: text.includes('STUDENT')
        };
      })()`);

      testCount++;
      if (profileCheck.hasName && profileCheck.hasStudentId && profileCheck.hasStudentRole) {
        console.log(`[PASS] Profile view correctly displays ${acct.name} (${acct.id})`);
        passCount++;
      } else {
        console.error(`[FAIL] Profile check failed for ${acct.name}`, profileCheck);
      }

      // Step D: Student Features Access (Find Item, I Found, Matches, My Reports, Alerts, Settings)
      const featuresCheck = await client.eval(`(() => {
        showPage('find-item-page');
        const findOk = document.getElementById('find-item-page').classList.contains('active');
        showPage('i-found-page');
        const iFoundOk = document.getElementById('i-found-page').classList.contains('active');
        showPage('matches-page');
        const matchesOk = document.getElementById('matches-page').classList.contains('active');
        showPage('my-reports-page');
        const reportsOk = document.getElementById('my-reports-page').classList.contains('active');
        showPage('alerts-page');
        const alertsOk = document.getElementById('alerts-page').classList.contains('active');
        showPage('settings-page');
        const settingsOk = document.getElementById('settings-page').classList.contains('active');
        return { findOk, iFoundOk, matchesOk, reportsOk, alertsOk, settingsOk };
      })()`);

      testCount++;
      if (Object.values(featuresCheck).every(Boolean)) {
        console.log(`[PASS] All student pages and features work cleanly for ${acct.name}`);
        passCount++;
      } else {
        console.error(`[FAIL] Feature check failed for ${acct.name}`, featuresCheck);
      }

    } else if (acct.role === 'admin') {
      // Step B: Admin Permissions
      const adminPermCheck = await client.eval(`(() => {
        const studentNavHidden = document.getElementById('student-nav-sections').style.display === 'none';
        const adminNavVisible = document.getElementById('admin-nav-sections').style.display !== 'none';
        const adminDashVisible = document.getElementById('admin-dashboard-view').style.display !== 'none';

        // Access Admin Desk
        showPage('admin-page');
        const adminPageActive = document.getElementById('admin-page').classList.contains('active');

        // Access Admin Students
        showPage('admin-students-page');
        const adminStudentsActive = document.getElementById('admin-students-page').classList.contains('active');

        return {
          studentNavHidden,
          adminNavVisible,
          adminDashVisible,
          adminPageActive,
          adminStudentsActive
        };
      })()`);

      testCount++;
      if (adminPermCheck.adminNavVisible && adminPermCheck.adminPageActive && adminPermCheck.adminStudentsActive) {
        console.log(`[PASS] Admin permissions verified for ${acct.name}`);
        passCount++;
      } else {
        console.error(`[FAIL] Admin permission check failed for ${acct.name}`, adminPermCheck);
      }
    }

    // Step E: Logout & Login Again Check
    const reloginCheck = await client.eval(`(async () => {
      logout();
      await new Promise(r => setTimeout(r, 200));
      const postLogoutEmpty = document.getElementById('login-username').value === '' &&
                              document.getElementById('login-password').value === '';

      // Login again
      setLoginRole('${acct.role}');
      document.getElementById('login-username').value = '${acct.loginId}';
      document.getElementById('login-password').value = '${acct.pass}';
      const form = document.getElementById('login-form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await new Promise(r => setTimeout(r, 600));

      const reloggedIn = !!appState.user && appState.user.name === '${acct.name}';
      logout();
      return { postLogoutEmpty, reloggedIn };
    })()`);

    testCount++;
    if (reloginCheck.postLogoutEmpty && reloginCheck.reloggedIn) {
      console.log(`[PASS] Logout and re-login successfully verified for ${acct.name}`);
      passCount++;
    } else {
      console.error(`[FAIL] Logout/re-login failed for ${acct.name}`, reloginCheck);
    }
  }

  console.log(`\n========================================`);
  console.log(`FINAL BROWSER TEST RESULTS: ${passCount} / ${testCount} PASSED`);
  console.log(`========================================`);

  client.close();
  chromeProc.kill();
  process.exit(passCount === testCount ? 0 : 1);
}

run().catch(err => {
  console.error('Test error:', err);
  chromeProc.kill();
  process.exit(1);
});
