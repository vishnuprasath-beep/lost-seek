/* ==========================================================================
   "I FOUND AN ITEM" FLOW
   ========================================================================== */
function initIFoundPage() {
  const form = document.getElementById('i-found-form');
  if (form) form.reset();
  clearIFoundPhoto();
  const results = document.getElementById('ifound-results-container');
  if (results) {
    results.innerHTML = '';
    results.style.display = 'none';
  }

  // Set default datetime to now
  const dtInput = document.getElementById('ifound-datetime');
  if (dtInput) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dtInput.value = now.toISOString().slice(0, 16);
  }
  if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
}

function handleIFoundPhotoSelected(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const dataUrl = evt.target.result;
    const hidden = document.getElementById('ifound-photo-data');
    const preview = document.getElementById('ifound-preview-card');
    const previewImg = document.getElementById('ifound-preview-img');
    const buttonsRow = document.getElementById('ifound-buttons-row');

    if (hidden) hidden.value = dataUrl;
    if (previewImg) previewImg.src = dataUrl;
    if (preview) preview.style.display = 'block';
    if (buttonsRow) buttonsRow.style.display = 'none';
    showToast('Photo attached successfully!', 'success');
    if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
  };
  reader.readAsDataURL(file);
}

function clearIFoundPhoto() {
  const hidden = document.getElementById('ifound-photo-data');
  const preview = document.getElementById('ifound-preview-card');
  const previewImg = document.getElementById('ifound-preview-img');
  const buttonsRow = document.getElementById('ifound-buttons-row');
  const camInput = document.getElementById('ifound-camera-input');
  const galInput = document.getElementById('ifound-gallery-input');

  if (hidden) hidden.value = '';
  if (previewImg) previewImg.src = '';
  if (preview) preview.style.display = 'none';
  if (buttonsRow) buttonsRow.style.display = 'grid';
  if (camInput) camInput.value = '';
  if (galInput) galInput.value = '';
}

function handleIFoundSearch(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  const title = document.getElementById('ifound-title')?.value.trim() || '';
  const category = document.getElementById('ifound-category')?.value || 'misc';
  let location = document.getElementById('ifound-location')?.value || 'Campus';
  if (location === 'Other') {
    const customLoc = document.getElementById('ifound-location-other')?.value.trim();
    if (customLoc) location = customLoc;
  }
  const datetime = document.getElementById('ifound-datetime')?.value || new Date().toISOString();
  const photo = document.getElementById('ifound-photo-data')?.value || '';
  const phone = document.getElementById('ifound-phone')?.value.trim() || '';
  const sharePhone = !!document.getElementById('ifound-share-phone')?.checked;

  const resultsContainer = document.getElementById('ifound-results-container');
  if (!resultsContainer) return;

  const candidateFound = {
    id: generateId('temp-found'),
    title,
    category,
    location,
    date: datetime,
    photo,
    phone,
    sharePhone,
    description: title
  };

  // Find matches among existing lost reports
  const matches = findMatches(candidateFound, 'found');

  resultsContainer.style.display = 'block';

  if (matches.length > 0) {
    resultsContainer.innerHTML = `
      <div style="background:rgba(20,184,166,0.1);border:1.5px solid var(--teal-bright);border-radius:12px;padding:20px;margin-bottom:20px;">
        <h3 style="display:flex;align-items:center;gap:8px;color:var(--teal-bright);margin-bottom:6px;">
          <i data-lucide="sparkles"></i>
          <span>Possible Matches Found (${matches.length})</span>
        </h3>
        <p style="font-size:0.88rem;color:var(--text-secondary);margin:0;">
          LostSeek correlated your found item with existing campus lost reports:
        </p>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px;">
        ${matches.map(m => {
          const lost = m.lost;
          const reasons = m.reasons || [];
          return `
            <div class="glass-card" style="padding:18px;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;">
                <div>
                  <h4 style="font-size:1.05rem;color:var(--text-primary);margin-bottom:4px;">${escapeHTML(lost.title)}</h4>
                  <div style="font-size:0.8rem;color:var(--text-muted);">
                    📍 Lost at ${escapeHTML(lost.location)} • 📅 ${getTimeAgo(lost.date || lost.createdAt)}
                  </div>
                </div>
                <div style="text-align:right;">
                  <span style="font-size:1.1rem;font-weight:800;color:var(--teal-bright);">${m.score}%</span>
                  <div style="font-size:0.72rem;color:var(--text-muted);text-transform:uppercase;">Match Score</div>
                </div>
              </div>

              <!-- Why this may match -->
              <div class="match-reasons-list">
                <div style="font-size:0.78rem;font-weight:700;color:var(--text-secondary);margin-bottom:2px;">Why this may match:</div>
                ${reasons.map(r => `<div class="match-reason-item matched">${escapeHTML(r)}</div>`).join('')}
              </div>

              <!-- Owner contact if shared -->
              ${renderContactCard(lost, 'Owner')}

              <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;">
                <button type="button" class="btn btn-sm btn-primary" onclick="openClaimModal('${lost.id}', '${candidateFound.id}', '${escapeHTML(lost.title)}')">
                  <i data-lucide="hand"></i>
                  <span>Confirm / Claim Match</span>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="text-align:center;margin-top:24px;padding:16px;background:var(--bg-card);border-radius:12px;border:1px solid var(--border-card);">
        <p style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:12px;">
          None of these match what you found? You can still post it to campus inventory.
        </p>
        <button type="button" class="btn btn-secondary" onclick="postAsFoundDirectly('${escapeHTML(title)}', '${category}', '${escapeHTML(location)}', '${datetime}', '${photo}', '${escapeHTML(phone)}', ${sharePhone})">
          <i data-lucide="package-plus"></i>
          <span>Post as Found Item</span>
        </button>
      </div>
    `;
  } else {
    resultsContainer.innerHTML = `
      <div style="text-align:center;padding:24px;background:var(--bg-card);border-radius:12px;border:1px solid var(--border-card);">
        <div style="font-size:2.5rem;margin-bottom:10px;">🔍</div>
        <h3 style="font-size:1.15rem;margin-bottom:6px;">No possible match yet</h3>
        <p style="font-size:0.88rem;color:var(--text-secondary);max-width:440px;margin:0 auto 18px;">
          No matching lost report was found right now. You can still post this item so the owner can search for it later!
        </p>
        <button type="button" class="btn btn-primary" onclick="postAsFoundDirectly('${escapeHTML(title)}', '${category}', '${escapeHTML(location)}', '${datetime}', '${photo}', '${escapeHTML(phone)}', ${sharePhone})">
          <i data-lucide="package-plus"></i>
          <span>Post as Found Item</span>
        </button>
      </div>
    `;
  }

  if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
}

function postAsFoundDirectly(title, category, location, datetime, photo, phone, sharePhone) {
  const newReport = {
    id: generateId('found'),
    type: 'FOUND',
    itemType: 'Found',
    category,
    title,
    itemName: title,
    location,
    date: datetime,
    dateTime: datetime,
    description: title,
    photo: photo || '',
    imageUrl: photo || '',
    phone: phone || '',
    phoneNumber: phone || '',
    sharePhone: !!sharePhone,
    phoneSharingConsent: !!sharePhone,
    status: 'Active',
    priority: 'normal',
    createdAt: new Date().toISOString(),
    custody: 'With Me',
    finderName: appState.user?.name || 'Campus Student',
    reporterId: appState.user ? (appState.user.username || appState.user.loginId || appState.user.id) : 'student',
    reporterName: appState.user ? appState.user.name : 'Campus Student'
  };

  appState.foundReports.unshift(newReport);
  
  saveData();
  renderAllViews();

  showToast('Found item posted to LostSeek! 📦 ', 'success');

  // Asynchronous cloud persistence & blob upload
  (async () => {
    try {
      if (photo && photo.startsWith('data:')) {
        const cloudImg = await uploadImageToCloud(photo, `found-${Date.now()}.jpg`);
        newReport.photo = cloudImg;
        newReport.imageUrl = cloudImg;
      }
      const apiRes = await fetch(API_BASE + '/api/reports', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newReport)
      });
      const apiData = await apiRes.json();
      if (apiData.success && apiData.report) {
        newReport.id = apiData.report.id;
        saveData();
        updateSyncIndicator('synced', 'Cloud Synced');
      }

      // Check matching against lost reports
      const matches = findMatches(newReport, appState.lostReports || []);
      if (matches.length > 0) {
        const topMatch = matches[0];
        await fetch(API_BASE + '/api/matches', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            lostReportId: topMatch.lost.id,
            foundReportId: newReport.id,
            score: topMatch.score,
            confidence: topMatch.confidence,
            reasons: topMatch.reasons || []
          })
        }).catch(e => console.warn('Match cloud sync:', e));
      }
    } catch (e) {
      console.warn('Direct found cloud persist failed (local copy intact):', e);
    }
  })();
}


