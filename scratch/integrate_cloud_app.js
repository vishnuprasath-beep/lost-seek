const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'app.js');
let code = fs.readFileSync(appPath, 'utf8');

// 1. Add Cloud Client and Sync helpers right after DATA LAYER heading
const cloudClientBlock = `
/* ==========================================================================
   CLOUD BACKEND API CLIENT & REAL-TIME SYNCHRONIZATION
   ========================================================================== */
const API_BASE = window.location.origin;

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (window.appState && window.appState.user) {
    headers['x-lostseek-user'] = encodeURIComponent(JSON.stringify(window.appState.user));
  }
  return headers;
}

function updateSyncIndicator(status, text) {
  const badge = document.getElementById('cloud-sync-badge');
  const label = document.getElementById('cloud-sync-text');
  if (!badge || !label) return;
  badge.className = 'cloud-sync-badge ' + status;
  label.textContent = text;
}

async function uploadImageToCloud(dataUrl, filename) {
  if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
  try {
    const res = await fetch(API_BASE + '/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl, filename: filename || 'item.jpg' })
    });
    const data = await res.json();
    if (data.success && data.url) {
      return data.url;
    }
    console.warn('Cloud upload response warning:', data.message);
    return dataUrl;
  } catch (err) {
    console.warn('Image upload fallback to dataUrl:', err);
    return dataUrl;
  }
}

async function syncWithCloud(isManual) {
  updateSyncIndicator('syncing', 'Syncing...');
  try {
    const res = await fetch(API_BASE + '/api/sync', {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (res.status === 503) {
      const err = await res.json();
      updateSyncIndicator('offline', 'DB Config Needed');
      if (isManual) {
        showToast('Supabase PostgreSQL configuration required. See .env.example', 'warning');
      }
      return false;
    }

    if (!res.ok) throw new Error('HTTP ' + res.status);

    const data = await res.json();
    if (data.success) {
      if (Array.isArray(data.lostReports)) appState.lostReports = data.lostReports;
      if (Array.isArray(data.foundReports)) appState.foundReports = data.foundReports;
      if (Array.isArray(data.claims)) appState.claims = data.claims;
      if (Array.isArray(data.matches)) appState.matches = data.matches;
      if (Array.isArray(data.helpRequests)) appState.adminHelpRequests = data.helpRequests;
      if (Array.isArray(data.notifications)) appState.notifications = data.notifications;

      saveData();
      updateSyncIndicator('synced', 'Cloud Synced');
      if (typeof renderAllViews === 'function') renderAllViews();
      if (isManual) showToast('Synchronized with Cloud Database! ☁️', 'success');
      return true;
    }
  } catch (err) {
    console.warn('Sync failed, running in cached offline mode:', err);
    updateSyncIndicator('offline', 'Offline (Cached)');
    if (isManual) showToast('Offline: Using local cached reports', 'info');
    return false;
  }
}

function triggerManualSync() {
  syncWithCloud(true);
}

// Auto-sync polling every 12 seconds when logged in
setInterval(() => {
  if (window.appState && window.appState.user) {
    syncWithCloud(false);
  }
}, 12000);
`;

if (!code.includes('CLOUD BACKEND API CLIENT & REAL-TIME SYNCHRONIZATION')) {
  code = code.replace(
    '/* ==========================================================================\n   DATA LAYER (localStorage)\n   ========================================================================== */',
    '/* ==========================================================================\n   DATA LAYER (localStorage)\n   ========================================================================== */' + cloudClientBlock
  );
  console.log('Injected Cloud Client & Sync helpers.');
}

// 2. Enhance submitWizardReport to upload image to Vercel Blob and POST to /api/reports
const targetWizardSub = `  saveData();
  renderAllViews();

  showToast(\`Report added successfully! \${type === 'lost' ? '📝' : '📦'} \${matches.length > 0 ? '(Possible match detected!)' : ''}\`, 'success');`;

const replacementWizardSub = `  saveData();
  renderAllViews();

  // Asynchronous cloud persistence
  (async () => {
    try {
      if (photo && photo.startsWith('data:')) {
        const cloudImg = await uploadImageToCloud(photo, \`\${type}-report.jpg\`);
        report.photo = cloudImg;
        report.imageUrl = cloudImg;
      }
      const apiRes = await fetch(API_BASE + '/api/reports', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(report)
      });
      const apiData = await apiRes.json();
      if (apiData.success && apiData.report) {
        report.id = apiData.report.id;
        saveData();
        updateSyncIndicator('synced', 'Cloud Synced');
      }

      // If match detected, persist to cloud
      if (matches.length > 0) {
        const topMatch = matches[0];
        await fetch(API_BASE + '/api/matches', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            lostReportId: topMatch.lost.id,
            foundReportId: topMatch.found.id,
            score: topMatch.score,
            confidence: topMatch.confidence || 'Medium',
            signals: topMatch.signals || {}
          })
        }).catch(e => console.warn('Match persist error:', e));
      }
    } catch (err) {
      console.warn('Background report cloud sync warning:', err);
      updateSyncIndicator('offline', 'Offline (Pending Sync)');
    }
  })();

  showToast(\`Report added successfully! \${type === 'lost' ? '📝' : '📦'} \${matches.length > 0 ? '(Possible match detected!)' : ''}\`, 'success');`;

if (code.includes(targetWizardSub)) {
  code = code.replace(targetWizardSub, replacementWizardSub);
  console.log('Enhanced submitWizardReport with cloud image upload & /api/reports.');
}

// 3. Enhance updateClaimStatus with PATCH /api/claims
const targetClaimStatus = `  if (lost && !lost.history) lost.history = [];
  if (lost) lost.history.push(historyEvent);
  if (found && !found.history) found.history = [];
  if (found) found.history.push(historyEvent);`;

const replacementClaimStatus = `  if (lost && !lost.history) lost.history = [];
  if (lost) lost.history.push(historyEvent);
  if (found && !found.history) found.history = [];
  if (found) found.history.push(historyEvent);

  // Cloud persistence for claim update
  fetch(API_BASE + '/api/claims?id=' + encodeURIComponent(claimId), {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status: newStatus })
  }).then(r => r.json()).then(d => {
    if (d.success) updateSyncIndicator('synced', 'Cloud Synced');
  }).catch(e => console.warn('Cloud claim update error:', e));`;

if (code.includes(targetClaimStatus)) {
  code = code.replace(targetClaimStatus, replacementClaimStatus);
  console.log('Enhanced updateClaimStatus with PATCH /api/claims.');
}

// 4. Ensure syncWithCloud is triggered on initial load
const targetInitLoad = `loadData();`;
const replacementInitLoad = `loadData();\n  // Synchronize state with Cloud Database\n  syncWithCloud(false);`;

if (!code.includes('syncWithCloud(false);')) {
  code = code.replace(targetInitLoad, replacementInitLoad);
  console.log('Added initial syncWithCloud call on startup.');
}

fs.writeFileSync(appPath, code, 'utf8');
console.log('app.js integration update complete!');
