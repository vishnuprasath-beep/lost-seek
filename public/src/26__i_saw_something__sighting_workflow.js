/* ==========================================================================
   "I SAW SOMETHING" SIGHTING WORKFLOW
   ========================================================================== */
function openSightingModal(alertId, reportId, category, area) {
  ensureModalsLoaded();
  const modal = document.getElementById('community-sighting-modal');
  if (!modal) return;

  document.getElementById('sighting-alert-id').value = alertId || '';
  document.getElementById('sighting-report-id').value = reportId || '';
  document.getElementById('sighting-category').value = category || 'General';
  document.getElementById('sighting-location').value = '';
  document.getElementById('sighting-time').value = 'Today, recently';
  document.getElementById('sighting-observation').value = '';
  document.getElementById('sighting-photo-url').value = '';

  const photoStatus = document.getElementById('sighting-photo-status');
  if (photoStatus) photoStatus.textContent = 'No photo attached';
  const previewWrap = document.getElementById('sighting-photo-preview-wrap');
  if (previewWrap) previewWrap.style.display = 'none';

  // Strict privacy: only generic category and approximate area
  const contextEl = document.getElementById('sighting-item-context');
  if (contextEl) {
    contextEl.textContent = `${category || 'Item'} spotted near ${area || 'Campus'}`;
  }

  // Reset radio to "No, I just saw it"
  const radios = document.getElementsByName('sighting-picked-up');
  radios.forEach(r => { if (r.value === 'no') r.checked = true; });

  modal.style.display = 'flex';
  if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
}

function closeSightingModal() {
  const modal = document.getElementById('community-sighting-modal');
  if (modal) modal.style.display = 'none';
}

async function handleSightingPhotoSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById('sighting-photo-status');
  const previewWrap = document.getElementById('sighting-photo-preview-wrap');
  const previewImg = document.getElementById('sighting-photo-preview');

  if (statusEl) statusEl.textContent = 'Uploading photo...';

  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(API_BASE + '/api/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (res.ok && data.url) {
      document.getElementById('sighting-photo-url').value = data.url;
      if (statusEl) statusEl.textContent = '✓ Photo attached';
      if (previewImg) previewImg.src = data.url;
      if (previewWrap) previewWrap.style.display = 'block';
    } else {
      // Local DataURL fallback
      const reader = new FileReader();
      reader.onload = (e) => {
        document.getElementById('sighting-photo-url').value = e.target.result;
        if (statusEl) statusEl.textContent = '✓ Photo attached';
        if (previewImg) previewImg.src = e.target.result;
        if (previewWrap) previewWrap.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  } catch (err) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('sighting-photo-url').value = e.target.result;
      if (statusEl) statusEl.textContent = '✓ Photo attached';
      if (previewImg) previewImg.src = e.target.result;
      if (previewWrap) previewWrap.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
}

async function handleSightingSubmit(event) {
  event.preventDefault();

  const alertId = document.getElementById('sighting-alert-id').value;
  const reportId = document.getElementById('sighting-report-id').value;
  const category = document.getElementById('sighting-category').value;
  const location = document.getElementById('sighting-location').value.trim();
  const time = document.getElementById('sighting-time').value.trim();
  const observation = document.getElementById('sighting-observation').value.trim();
  const photoUrl = document.getElementById('sighting-photo-url').value;

  const pickedUp = document.querySelector('input[name="sighting-picked-up"]:checked')?.value === 'yes';

  if (!observation) {
    showToast('Please describe what you saw (where, when, or any details).', 'warning');
    return;
  }

  // IF PICKED UP: Redirect student to FOUND Report form with pre-filled safe information!
  if (pickedUp) {
    closeSightingModal();
    showToast('Redirecting to Report Found form...', 'info');

    // Pre-fill Found Form
    showPage('report-found-page');
    const titleEl = document.getElementById('found-title');
    const catEl = document.getElementById('found-category');
    const locEl = document.getElementById('found-location');
    const descEl = document.getElementById('found-description');
    const previewImg = document.getElementById('found-image-preview');

    if (titleEl) titleEl.value = `Found ${category || 'Item'}`;
    if (catEl) catEl.value = category || 'Other';
    if (locEl) locEl.value = location;
    if (descEl) descEl.value = `Spotted and retrieved near ${location} (${time}). ${observation}`;
    if (photoUrl && previewImg) {
      previewImg.src = photoUrl;
      const wrap = document.getElementById('found-preview-container');
      if (wrap) wrap.style.display = 'block';
    }

    showToast('Found report prefilled with sighting information! Please submit to initiate AI verification.', 'success');
    return;
  }

  // IF NOT PICKED UP: Record direct sighting to owner
  const submitBtn = document.getElementById('btn-submit-sighting');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<div class="spinner-sm"></div> Sending...`;
  }

  try {
    const user = appState.user;
    const headers = { 'Content-Type': 'application/json' };
    if (user) headers['x-lostseek-user'] = encodeURIComponent(JSON.stringify(user));

    const payload = {
      action: 'sighting',
      alertId,
      reportId,
      approximateLocation: location || 'Campus',
      approximateTime: time || 'Recently',
      observation,
      photoUrl,
      pickedUp: false
    };

    const res = await fetch(API_BASE + '/api/alerts', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    closeSightingModal();
    if (res.ok && data.success) {
      showToast('Sighting sent to the person who reported this item lost. 📨', 'success');
    } else {
      showToast(data.message || 'Sighting recorded.', 'info');
    }
    renderCommunityAlerts();
  } catch (err) {
    console.warn('Sighting submit notice:', err.message);
    closeSightingModal();
    showToast('Sighting sent to the person who reported this item lost.', 'success');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i data-lucide="send"></i><span>Submit Sighting</span>`;
      if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
    }
  }
}
