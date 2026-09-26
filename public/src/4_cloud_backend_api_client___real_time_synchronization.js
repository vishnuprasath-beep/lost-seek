/* ==========================================================================
   CLOUD BACKEND API CLIENT & REAL-TIME SYNCHRONIZATION
   ========================================================================== */
const API_BASE = (window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file:'))
  ? window.location.origin
  : 'https://smart-campus-pro.vercel.app';

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (window.appState && window.appState.user && window.appState.user.token) {
    headers['Authorization'] = 'Bearer ' + window.appState.user.token;
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
    // Phase 2: Convert base64 to Blob to avoid sending bloat over the wire
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });

    const res = await fetch(API_BASE + '/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': mime,
        'x-file-name': filename || 'item.jpg'
      },
      body: blob
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
      if (Array.isArray(data.notifications)) {
        const seen = new Set();
        appState.notifications = data.notifications.filter(n => {
          if (!n.id || seen.has(n.id)) return false;
          seen.add(n.id);
          return true;
        });
      }
      if (data.user && appState.user) {
        const remoteAvatar = data.user.avatarUrl || data.user.avatar || data.user.avatar_url;
        if (remoteAvatar) {
          appState.user.avatarUrl = remoteAvatar;
          appState.user.avatar = remoteAvatar;
          appState.user.avatar_url = remoteAvatar;
          appState.user.profilePicture = remoteAvatar;
          appState.user.profilePictureUrl = remoteAvatar;
          appState.user.photoUrl = remoteAvatar;
        }
        setupAuthenticatedUser(appState.user);
      }

      saveData();
      updateSyncIndicator('synced', 'Online (Cloud Synced)');
      if (typeof renderAllViews === 'function') renderAllViews();
      if (isManual) showToast('Synchronized with Cloud Database! ☁️', 'success');
      return true;
    }
  } catch (err) {
    console.warn('Sync failed, running in cached mode:', err);
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      updateSyncIndicator('offline', 'Offline');
      if (isManual) showToast('Device offline: Using local cached reports', 'info');
    } else {
      updateSyncIndicator('cached', 'Online (Cached)');
      if (isManual) showToast('Connected: Using cached records', 'info');
    }
    return false;
  }
}

function triggerManualSync() {
  syncWithCloud(true);
}

// Auto-sync polling every 2 minutes when logged in and tab is active
setInterval(() => {
  if (window.appState && window.appState.user && document.visibilityState === 'visible') {
    syncWithCloud(false);
  }
}, 120000);

// Immediate sync on tab focus and network reconnection
window.addEventListener('focus', () => {
  if (window.appState && window.appState.user) {
    syncWithCloud(false);
  }
});
window.addEventListener('online', () => {
  if (window.appState && window.appState.user) {
    syncWithCloud(false);
  }
});

function normalizeCachedReport(r) {
  if (!r) return r;
  const p = r.phone || r.phoneNumber || r.phone_number || r.contactPhone || null;
  const s = !!(r.sharePhone ?? r.phoneSharingConsent ?? r.phone_sharing_consent ?? r.phoneShared);
  r.phone = p;
  r.phoneNumber = p;
  r.phone_number = p;
  r.contactPhone = p;
  r.sharePhone = s;
  r.phoneSharingConsent = s;
  r.phone_sharing_consent = s;
  r.hasPhoneProvided = !!(p && String(p).trim());
  return r;
}

function loadData() {
  // Ensure data arrays exist
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      appState = JSON.parse(raw);
      if (!appState.adminHelpRequests) appState.adminHelpRequests = [];
      if (!appState.officialContacts) appState.officialContacts = JSON.parse(JSON.stringify(DEFAULT_OFFICIAL_CONTACTS));
      if (Array.isArray(appState.lostReports)) appState.lostReports.forEach(normalizeCachedReport);
      if (Array.isArray(appState.foundReports)) appState.foundReports.forEach(normalizeCachedReport);
      if (appState.user) {
        // [KARMA MIGRATION CLEANUP]
        if ('karma' in appState.user) delete appState.user.karma;
        if ('karmaScore' in appState.user) delete appState.user.karmaScore;
        if ('badges' in appState.user) delete appState.user.badges;
        if ('karma' in appState) delete appState.karma;
        
        // [SESSION MIGRATION / CACHE BUSTING]
        // If the user object lacks a valid Supabase JWT token, it's an obsolete session from before the security migration.
        if (!appState.user.token || appState.user.token.startsWith('legacy-token')) {
          console.warn('[DEBUG] Obsolete auth session detected (missing valid JWT). Forcing logout.');
          appState.user = null;
          saveData(); // Persist the cleared session immediately
          if (typeof showToast === 'function') {
            setTimeout(() => showToast('Session expired. Please log in again.', 'warning'), 1500);
          }
        } else {
          const canonical = appState.user.avatarUrl || appState.user.avatar || appState.user.avatar_url || appState.user.profilePicture || appState.user.profilePictureUrl || appState.user.photoUrl || null;
          appState.user.avatarUrl = canonical;
          appState.user.avatar = canonical;
          appState.user.avatar_url = canonical;
          appState.user.profilePicture = canonical;
          appState.user.profilePictureUrl = canonical;
          appState.user.photoUrl = canonical;
        }
      }
    } catch (e) {
      console.warn('Failed to parse localStorage data. Re-seeding...', e);
      appState = getInitialSeedData();
      saveData();
    }
  } else {
    appState = getInitialSeedData();
    saveData();
  }
  window.appState = appState;
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function generateId(prefix = 'item') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function getTimeAgo(dateString) {
  if (!dateString) return 'recently';
  const past = new Date(dateString).getTime();
  const diffInSecs = Math.floor((Date.now() - past) / 1000);

  if (diffInSecs < 60) return 'just now';
  const mins = Math.floor(diffInSecs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDateTime(dateString) {
  if (!dateString) return 'Not specified';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return dateString;
  }
}
