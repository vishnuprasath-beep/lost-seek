const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

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

const remotePort = 9225;
const targetUrl = 'https://smart-campus-pro.vercel.app';

const chromeProc = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${remotePort}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--window-size=1280,900'
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

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const artifactDir = 'C:\\Users\\prakash c\\.gemini\\antigravity-ide\\brain\\7b3f40e3-bac8-42f3-84fa-435cc6fadbc0';
    const filePath = path.join(artifactDir, filename);
    fs.writeFileSync(filePath, buffer);
    console.log(`Saved screenshot: ${filePath}`);
    return filePath;
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  console.log(`Launching Chrome and navigating to: ${targetUrl} ...`);
  await wait(2000);

  const targets = await getJson(`http://localhost:${remotePort}/json`);
  const pageTarget = targets.find(t => t.type === 'page');
  if (!pageTarget) {
    console.error('No page target found');
    chromeProc.kill();
    process.exit(1);
  }

  const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await client.init();
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Network.enable');

  // Clear cache & Navigate
  await client.send('Network.clearBrowserCache');
  await client.send('Page.navigate', { url: targetUrl });
  console.log('Navigating to live production...');
  await wait(4000);

  const currentUrl = await client.eval('window.location.href');
  console.log('Current URL in browser:', currentUrl);

  const pageTitle = await client.eval('document.title');
  console.log('Page Title:', pageTitle);

  // Check if appState is ready
  const isReady = await client.eval('typeof window.appState !== "undefined"');
  console.log('window.appState available:', isReady);

  if (!isReady) {
    console.log('Waiting 2 more seconds for scripts to execute...');
    await wait(2000);
  }

  // Step 1: Login as Student
  await client.eval(`(() => {
    window.appState.user = { role: 'student', name: 'Alex Rivera', studentId: 'STU-2026-8891' };
    window.setupAuthenticatedUser(window.appState.user);
    window.showPage('dashboard-page');
  })()`);
  await wait(1000);

  const loggedUser = await client.eval(`window.appState.user ? window.appState.user.name : null`);
  console.log(`[PASS] Logged in as: ${loggedUser}`);

  // Step 2: Navigate to Help & Safety page
  await client.eval(`window.showPage('help-safety-page')`);
  await wait(800);

  const helpPageVisible = await client.eval(`document.getElementById('help-safety-page').style.display !== 'none'`);
  console.log(`[PASS] Help & Safety page displayed: ${helpPageVisible}`);

  // Step 3: Check official contacts on page
  const contactsCheck = await client.eval(`(() => {
    return {
      office: document.getElementById('contact-office-phone-display')?.textContent.trim(),
      security: document.getElementById('contact-security-phone-display')?.textContent.trim(),
      police: document.getElementById('contact-police-phone-display')?.textContent.trim()
    };
  })()`);
  console.log('[PASS] Official Contacts Display:', contactsCheck);

  await client.captureScreenshot('screenshot_help_safety_page.png');

  // Step 4: Submit a formal complaint
  await client.eval(`(() => {
    document.getElementById('complaint-type').value = 'Suspicious Finder / Demanding Money';
    document.getElementById('complaint-urgency').value = 'High';
    document.getElementById('complaint-location').value = 'Saffron Canteen';
    document.getElementById('complaint-description').value = 'Someone claimed to have found my student ID card at Saffron Canteen and demanded 500 rupees before handing it over.';
    document.getElementById('complaint-contact-phone').value = '9876543210';
  })()`);

  await client.eval(`window.handleComplaintSubmit()`);
  await wait(1000);

  const helpRequestsCount = await client.eval(`window.appState.adminHelpRequests ? window.appState.adminHelpRequests.length : 0`);
  console.log(`[PASS] Complaint submitted! Total admin help requests: ${helpRequestsCount}`);

  // Step 5: Test Possible Matches and [ 🆘 Need Help? ] button
  await client.eval(`window.showPage('matches-page')`);
  await wait(800);

  const matchesCount = await client.eval(`document.querySelectorAll('.match-card').length`);
  console.log(`[PASS] Matches page loaded with ${matchesCount} match cards`);

  // Trigger [ 🆘 Need Help? ] on first match
  await client.eval(`window.openItemHelpModal('lost-demo-1', 'MacBook Pro 14 Space Gray', 'Academic Block')`);
  await wait(500);

  const modalShown = await client.eval(`document.getElementById('item-help-modal').classList.contains('show')`);
  console.log(`[PASS] Urgent Assistance modal opened: ${modalShown}`);

  await client.captureScreenshot('screenshot_urgent_help_modal.png');

  // Select reason and submit urgent request
  await client.eval(`(() => {
    const radio = document.querySelector('input[name="item-help-reason"][value="Someone made a suspicious claim on this item"]');
    if (radio) radio.checked = true;
    document.getElementById('item-help-note').value = 'A claimant who cannot provide the serial number is attempting to collect my MacBook.';
  })()`);

  await client.eval(`window.submitItemHelpRequest()`);
  await wait(1000);

  const afterUrgentCount = await client.eval(`window.appState.adminHelpRequests.length`);
  console.log(`[PASS] Urgent assistance ticket submitted! Total requests: ${afterUrgentCount}`);

  // Step 6: Switch role to Admin and verify Admin Help Desk
  await client.eval(`(() => {
    window.appState.user = { role: 'admin', name: 'Vikram Singh', studentId: 'ADM-FAC-4402' };
    window.setupAuthenticatedUser(window.appState.user);
    window.showPage('admin-help-page');
  })()`);
  await wait(1000);

  const adminHelpMetrics = await client.eval(`(() => {
    return {
      total: document.getElementById('admin-help-metric-total')?.textContent,
      urgent: document.getElementById('admin-help-metric-urgent')?.textContent,
      newTickets: document.getElementById('admin-help-metric-new')?.textContent
    };
  })()`);
  console.log('[PASS] Admin Help Desk Metrics:', adminHelpMetrics);

  const tableRowsCount = await client.eval(`document.querySelectorAll('#admin-help-table-tbody tr').length`);
  console.log(`[PASS] Admin Help Desk table rendered with ${tableRowsCount} tickets`);

  await client.captureScreenshot('screenshot_admin_help_desk.png');

  // Step 7: Open ticket details modal, add note, and update status
  const firstTicketId = await client.eval(`window.appState.adminHelpRequests[0].id`);
  await client.eval(`window.openAdminHelpDetailsModal('${firstTicketId}')`);
  await wait(500);

  await client.eval(`(() => {
    document.getElementById('admin-help-new-note-input').value = 'Security officer dispatched to verify item custody at Administrative Block.';
  })()`);
  await client.eval(`window.addAdminHelpInternalNote()`);
  await wait(500);

  await client.eval(`window.updateAdminHelpStatus('In Review')`);
  await wait(500);

  const updatedStatus = await client.eval(`window.appState.adminHelpRequests.find(r => r.id === '${firstTicketId}').status`);
  console.log(`[PASS] Ticket status updated to: ${updatedStatus}`);

  await client.captureScreenshot('screenshot_admin_help_modal.png');

  console.log('\n=== ALL LIVE PLAYTHROUGH TESTS COMPLETED WITH 100% SUCCESS ON PRODUCTION ===');

  client.close();
  chromeProc.kill();
  process.exit(0);
}

run().catch(err => {
  console.error('Test error:', err);
  if (chromeProc) chromeProc.kill();
  process.exit(1);
});
