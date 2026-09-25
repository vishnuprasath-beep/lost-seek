/* ==========================================================================
   PROFILE & SETTINGS VIEWS
   ========================================================================== */
function renderProfile() {
  const container = document.getElementById('profile-content-container');
  if (!container) return;

  const user = appState.user || {
    name: 'Campus Student',
    role: 'student',
    studentId: 'STU-2026',
    username: 'student'
  };

  const userRole = (user.role || 'student').toLowerCase();
  const isAdminOrStaff = ['admin', 'supervisor', 'director'].includes(userRole);
  const roleBadgeLabel = userRole === 'director' ? 'DIRECTOR' : (userRole === 'supervisor' ? 'SUPERVISOR' : (userRole === 'admin' ? 'STAFF / ADMIN' : 'STUDENT'));
  const userLost = (appState.lostReports || []).filter(r => r.reporterName === user.name || r.reporterId === user.username).length;
  const userFound = (appState.foundReports || []).filter(r => r.finderName === user.name || r.reporterName === user.name || r.reporterId === user.username).length;
  const userClaims = (appState.claims || []).filter(c => c.claimantName === user.name || c.claimantId === user.studentId || c.claimantId === user.username).length;
  const karma = appState.karma || 50;

  const userHasAvatar = !!(user.avatarUrl || user.avatar || user.avatar_url || user.profilePicture || user.profilePictureUrl || user.photoUrl);

  container.innerHTML = `
    <div class="profile-card">
      <div class="profile-avatar-box" style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
        <div id="profile-page-avatar-display" class="profile-avatar-clickable" onclick="openEditProfilePictureModal()" title="Edit Profile Picture" style="position: relative; cursor: pointer;">
          ${getAvatarSVG(user.role, 108, user.avatarUrl)}
          <div class="avatar-camera-badge" title="Edit Profile Picture">
            <i data-lucide="camera" style="width: 15px; height: 15px;"></i>
          </div>
        </div>
        <button type="button" class="btn btn-sm btn-primary" id="btn-edit-profile-picture" onclick="openEditProfilePictureModal()" style="display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; font-size: 0.84rem; font-weight: 600; border-radius: var(--radius-sm);">
          <i data-lucide="camera" style="width: 15px; height: 15px;"></i>
          <span>${userHasAvatar ? 'Edit Profile Picture' : 'Add Profile Picture'}</span>
        </button>
        <input type="file" id="profile-camera-input" accept="image/*" capture="user" style="display:none;" onchange="handleProfilePhotoSelected(event)">
        <input type="file" id="profile-gallery-input" accept="image/*" style="display:none;" onchange="handleProfilePhotoSelected(event)">
      </div>
      <div class="profile-info" style="flex: 1;">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <h2 style="margin: 0; color: var(--text-primary); font-size: 1.5rem;">${escapeHTML(user.name)}</h2>
          <span class="badge ${isAdminOrStaff ? 'badge-urgent' : 'badge-verified'}">${roleBadgeLabel}</span>
          <span class="badge badge-verified" style="display:inline-flex;align-items:center;gap:4px;"><i data-lucide="shield-check" style="width:13px;height:13px;"></i> Institutional Identity Verified</span>
        </div>
        <p style="margin: 6px 0 12px; color: var(--text-muted); font-size: 0.95rem;">
          ${escapeHTML(user.username || user.loginId || '')}${user.username && !user.username.includes('@') ? '@campus.edu' : ''} • ID: <strong>${escapeHTML(user.studentId || 'STU-2026')}</strong>
        </p>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px;">
          <button class="btn btn-sm btn-secondary" onclick="showPage('my-reports-page')">
            <i data-lucide="file-text"></i> My Reports
          </button>
          <button class="btn btn-sm btn-secondary" onclick="showPage('matches-page')">
            <i data-lucide="sparkles"></i> Possible Matches
          </button>
          <button class="btn btn-sm btn-secondary" onclick="showPage('settings-page')">
            <i data-lucide="settings"></i> Settings
          </button>
        </div>
      </div>
    </div>

    <div class="profile-stats-row">
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">Campus Karma</span>
          <i data-lucide="award" class="stat-card-icon" style="color: var(--teal-bright);"></i>
        </div>
        <div class="stat-card-value">${karma}</div>
        <div class="stat-card-subtitle">Reputation Points</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">Lost Reports</span>
          <i data-lucide="search" class="stat-card-icon" style="color: var(--warning-color);"></i>
        </div>
        <div class="stat-card-value">${userLost}</div>
        <div class="stat-card-subtitle">Items filed as missing</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">Found Items</span>
          <i data-lucide="package-check" class="stat-card-icon" style="color: var(--success-color);"></i>
        </div>
        <div class="stat-card-value">${userFound}</div>
        <div class="stat-card-subtitle">Items turned in</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-title">Active Claims</span>
          <i data-lucide="hand" class="stat-card-icon" style="color: var(--teal-bright);"></i>
        </div>
        <div class="stat-card-value">${userClaims}</div>
        <div class="stat-card-subtitle">Verification requests</div>
      </div>
    </div>

    <div class="glass-card" style="margin-bottom: 24px;">
      <h3>Account Credentials &amp; Verification</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-top: 14px;">
        <div>
          <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Full Name</span>
          <div style="font-weight: 600; margin-top: 2px;">${escapeHTML(user.name || 'Campus Member')}</div>
        </div>
        <div>
          <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Campus Role</span>
          <div style="font-weight: 600; margin-top: 2px;">${isAdminOrStaff ? (userRole === 'director' ? 'Campus Director' : (userRole === 'supervisor' ? 'Campus Supervisor' : 'Administrator / Staff')) : 'Student'}</div>
        </div>
        <div>
          <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Login ID</span>
          <div style="font-weight: 600; margin-top: 2px;">${escapeHTML(user.username || user.loginId || 'student')}</div>
        </div>
        <div>
          <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Institutional ID</span>
          <div style="font-weight: 600; margin-top: 2px;">${escapeHTML(user.studentId || (isAdminOrStaff ? 'ADM-FAC-4402' : 'STU-2026'))}</div>
        </div>
      </div>
    </div>

    <div class="glass-card" style="margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
        <i data-lucide="key-round" style="color: var(--teal-bright);"></i>
        <h3 style="margin: 0;">Change Password</h3>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
        Update your account password securely. Requires your current password.
      </p>

      <form id="profile-change-password-form" onsubmit="handleProfilePasswordChange(event)" style="max-width: 480px;">
        <div class="form-group" style="margin-bottom: 12px;">
          <label for="pwd-current" style="font-size: 0.85rem; font-weight: 600;">Current Password *</label>
          <input type="password" id="pwd-current" class="input-glass" placeholder="Enter current password" required autocomplete="current-password">
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label for="pwd-new" style="font-size: 0.85rem; font-weight: 600;">New Password (Min. 6 characters) *</label>
          <input type="password" id="pwd-new" class="input-glass" placeholder="Enter new password" required minlength="6" autocomplete="new-password">
        </div>
        <div class="form-group" style="margin-bottom: 16px;">
          <label for="pwd-confirm" style="font-size: 0.85rem; font-weight: 600;">Confirm New Password *</label>
          <input type="password" id="pwd-confirm" class="input-glass" placeholder="Confirm new password" required minlength="6" autocomplete="new-password">
        </div>
        <button type="submit" class="btn btn-primary" id="btn-change-password">
          <i data-lucide="lock"></i>
          <span>Change Password</span>
        </button>
      </form>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

function openEditProfilePictureModal() {
  const modal = document.getElementById('edit-profile-picture-modal');
  if (!modal) return;
  const u = appState.user;
  const currentAvatar = u ? (u.avatarUrl || u.avatar || u.avatar_url || u.profilePicture || u.profilePictureUrl || u.photoUrl) : null;
  const preview = document.getElementById('modal-edit-profile-avatar-preview');
  if (preview && u) {
    preview.innerHTML = getAvatarSVG(u.role, 72, currentAvatar);
  }
  const recropBtn = document.getElementById('btn-profile-recrop-current');
  if (recropBtn) {
    recropBtn.style.display = currentAvatar ? 'inline-flex' : 'none';
  }
  modal.style.display = 'flex';
  if (window.lucide) window.lucide.createIcons();
}

function closeEditProfilePictureModal() {
  const modal = document.getElementById('edit-profile-picture-modal');
  if (modal) modal.style.display = 'none';
}

function triggerProfilePhotoUpload(mode) {
  closeEditProfilePictureModal();
  if (mode === 'recrop') {
    const u = appState.user;
    const currentAvatar = u ? (u.avatarUrl || u.avatar || u.avatar_url || u.profilePicture || u.profilePictureUrl || u.photoUrl) : null;
    if (!currentAvatar) {
      showToast('No existing profile picture to crop.', 'warning');
      return;
    }
    showToast('Loading picture for editor... ⏳', 'info');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      openProfileCropEditor(img, currentAvatar);
    };
    img.onerror = () => {
      showToast('Could not load existing picture for editing. Please select a photo from your gallery.', 'error');
    };
    img.src = currentAvatar;
    return;
  }

  let input = null;
  if (mode === 'camera') {
    input = document.getElementById('profile-camera-input');
  } else {
    input = document.getElementById('profile-gallery-input');
  }
  if (input) {
    input.value = '';
    input.click();
  }
}

// =============================================================================
// INSTAGRAM-LIKE PROFILE PICTURE CROP & POSITION CONTROLLER
// =============================================================================

const cropState = {
  img: null,
  rawUrl: null,
  naturalW: 0,
  naturalH: 0,
  viewportSize: 280,
  minScale: 1.0,
  currentZoom: 1.0,
  effectiveScale: 1.0,
  posX: 0,
  posY: 0,
  activePointers: new Map(),
  initialPinchDist: 0,
  initialPinchZoom: 1.0,
  initialPinchMidpoint: { x: 140, y: 140 },
  pointerStartX: 0,
  pointerStartY: 0,
  initialPanX: 0,
  initialPanY: 0,
  lastTapTime: 0,
  eventsBound: false
};

function calculateCoverScale(naturalW, naturalH, viewportSize) {
  return Math.max(viewportSize / naturalW, viewportSize / naturalH);
}

function clampCropPosition(x, y, scale, naturalW, naturalH, viewportSize) {
  const renderedW = naturalW * scale;
  const renderedH = naturalH * scale;

  const minX = viewportSize - renderedW;
  const maxX = 0;
  const clampedX = Math.min(maxX, Math.max(minX, x));

  const minY = viewportSize - renderedH;
  const maxY = 0;
  const clampedY = Math.min(maxY, Math.max(minY, y));

  return { x: clampedX, y: clampedY };
}

function applyCropTransform(isInteracting = false) {
  const stageImg = document.getElementById('crop-stage-image');
  const gridOverlay = document.getElementById('crop-grid-overlay');
  const viewport = document.getElementById('crop-viewport-container');
  const slider = document.getElementById('crop-zoom-slider');

  if (stageImg) {
    stageImg.style.width = `${cropState.naturalW}px`;
    stageImg.style.height = `${cropState.naturalH}px`;
    stageImg.style.transform = `translate3d(${cropState.posX}px, ${cropState.posY}px, 0) scale(${cropState.effectiveScale})`;
  }

  if (gridOverlay) {
    if (isInteracting) {
      gridOverlay.classList.add('active');
    } else {
      gridOverlay.classList.remove('active');
    }
  }

  if (viewport) {
    if (isInteracting) {
      viewport.classList.add('is-dragging');
    } else {
      viewport.classList.remove('is-dragging');
    }
  }

  if (slider && Math.abs(parseFloat(slider.value) - cropState.currentZoom) > 0.02) {
    slider.value = cropState.currentZoom.toFixed(2);
  }
}

function setCropZoom(targetZoom, originX = null, originY = null, isInteracting = false) {
  const clampedZoom = Math.max(1.0, Math.min(3.5, targetZoom));
  const newScale = cropState.minScale * clampedZoom;

  const fx = originX !== null ? originX : cropState.viewportSize / 2;
  const fy = originY !== null ? originY : cropState.viewportSize / 2;

  const ratio = newScale / cropState.effectiveScale;
  const rawX = fx - (fx - cropState.posX) * ratio;
  const rawY = fy - (fy - cropState.posY) * ratio;

  const clamped = clampCropPosition(rawX, rawY, newScale, cropState.naturalW, cropState.naturalH, cropState.viewportSize);

  cropState.currentZoom = clampedZoom;
  cropState.effectiveScale = newScale;
  cropState.posX = clamped.x;
  cropState.posY = clamped.y;

  applyCropTransform(isInteracting);
}

function stepCropZoom(delta) {
  setCropZoom(cropState.currentZoom + delta, cropState.viewportSize / 2, cropState.viewportSize / 2, false);
}

function handleCropSliderInput(val) {
  setCropZoom(parseFloat(val), cropState.viewportSize / 2, cropState.viewportSize / 2, false);
}

function resetCropPosition() {
  cropState.currentZoom = 1.0;
  cropState.effectiveScale = cropState.minScale;
  cropState.posX = (cropState.viewportSize - cropState.naturalW * cropState.effectiveScale) / 2;
  cropState.posY = (cropState.viewportSize - cropState.naturalH * cropState.effectiveScale) / 2;
  applyCropTransform(false);
}

function bindCropEditorEvents() {
  if (cropState.eventsBound) return;
  const viewport = document.getElementById('crop-viewport-container');
  if (!viewport) return;

  viewport.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { viewport.setPointerCapture(e.pointerId); } catch (_) {}
    cropState.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (cropState.activePointers.size === 1) {
      // Check double tap / click to toggle zoom
      const now = Date.now();
      if (now - cropState.lastTapTime < 300) {
        const rect = viewport.getBoundingClientRect();
        const fx = e.clientX - rect.left;
        const fy = e.clientY - rect.top;
        const targetZoom = cropState.currentZoom > 1.2 ? 1.0 : 2.0;
        setCropZoom(targetZoom, fx, fy, false);
        cropState.lastTapTime = 0;
        return;
      }
      cropState.lastTapTime = now;

      cropState.pointerStartX = e.clientX;
      cropState.pointerStartY = e.clientY;
      cropState.initialPanX = cropState.posX;
      cropState.initialPanY = cropState.posY;
    } else if (cropState.activePointers.size === 2) {
      const pts = Array.from(cropState.activePointers.values());
      const p1 = pts[0];
      const p2 = pts[1];
      cropState.initialPinchDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      cropState.initialPinchZoom = cropState.currentZoom;
      const rect = viewport.getBoundingClientRect();
      cropState.initialPinchMidpoint = {
        x: ((p1.x + p2.x) / 2) - rect.left,
        y: ((p1.y + p2.y) / 2) - rect.top
      };
    }
    applyCropTransform(true);
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!cropState.activePointers.has(e.pointerId)) return;
    cropState.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (cropState.activePointers.size === 1) {
      const dx = e.clientX - cropState.pointerStartX;
      const dy = e.clientY - cropState.pointerStartY;
      const clamped = clampCropPosition(
        cropState.initialPanX + dx,
        cropState.initialPanY + dy,
        cropState.effectiveScale,
        cropState.naturalW,
        cropState.naturalH,
        cropState.viewportSize
      );
      cropState.posX = clamped.x;
      cropState.posY = clamped.y;
      applyCropTransform(true);
    } else if (cropState.activePointers.size >= 2) {
      const pts = Array.from(cropState.activePointers.values());
      const p1 = pts[0];
      const p2 = pts[1];
      const currDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (cropState.initialPinchDist > 5) {
        const ratio = currDist / cropState.initialPinchDist;
        const targetZoom = cropState.initialPinchZoom * ratio;
        setCropZoom(targetZoom, cropState.initialPinchMidpoint.x, cropState.initialPinchMidpoint.y, true);
      }
    }
  });

  const handlePointerEnd = (e) => {
    cropState.activePointers.delete(e.pointerId);
    try { viewport.releasePointerCapture(e.pointerId); } catch (_) {}

    if (cropState.activePointers.size === 1) {
      const remaining = cropState.activePointers.values().next().value;
      cropState.pointerStartX = remaining.x;
      cropState.pointerStartY = remaining.y;
      cropState.initialPanX = cropState.posX;
      cropState.initialPanY = cropState.posY;
    } else if (cropState.activePointers.size === 0) {
      applyCropTransform(false);
    }
  };

  viewport.addEventListener('pointerup', handlePointerEnd);
  viewport.addEventListener('pointercancel', handlePointerEnd);

  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const fx = e.clientX - rect.left;
    const fy = e.clientY - rect.top;
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setCropZoom(cropState.currentZoom + delta, fx, fy, false);
  }, { passive: false });

  viewport.addEventListener('dblclick', (e) => {
    e.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const fx = e.clientX - rect.left;
    const fy = e.clientY - rect.top;
    const targetZoom = cropState.currentZoom > 1.2 ? 1.0 : 2.0;
    setCropZoom(targetZoom, fx, fy, false);
  });

  cropState.eventsBound = true;
}

function getAuthoritativeCropRect() {
  const viewport = document.getElementById('crop-viewport-container');
  const stageImg = document.getElementById('crop-stage-image');

  // Authoritative viewport dimension (280px standard, dynamically verified from rendered DOM)
  const vpDim = (viewport && viewport.clientWidth > 50) ? viewport.clientWidth : (cropState.viewportSize || 280);
  cropState.viewportSize = vpDim;

  // Authoritative source image dimensions (DOM stageImg element takes precedence because
  // the browser has rendered and oriented it according to EXIF)
  const nw = (stageImg && stageImg.naturalWidth > 0)
    ? stageImg.naturalWidth
    : ((cropState.img && cropState.img.naturalWidth > 0) ? cropState.img.naturalWidth : (cropState.naturalW || 400));
  const nh = (stageImg && stageImg.naturalHeight > 0)
    ? stageImg.naturalHeight
    : ((cropState.img && cropState.img.naturalHeight > 0) ? cropState.img.naturalHeight : (cropState.naturalH || 400));
  cropState.naturalW = nw;
  cropState.naturalH = nh;

  const scale = cropState.effectiveScale || 1.0;
  const posX = cropState.posX || 0;
  const posY = cropState.posY || 0;

  // Viewport point (vx, vy) maps to source image point (ix, iy):
  // vx = posX + ix * scale  =>  ix = (vx - posX) / scale
  const sourceX = -posX / scale;
  const sourceY = -posY / scale;
  const sourceWidth = vpDim / scale;
  const sourceHeight = vpDim / scale;

  const rect = {
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    posX,
    posY,
    effectiveScale: scale,
    currentZoom: cropState.currentZoom || 1.0,
    viewportSize: vpDim,
    naturalW: nw,
    naturalH: nh
  };

  if (window.__LOSTSEEK_DEBUG_CROP__) {
    console.log('[LostSeek Authoritative Crop Rect]', rect);
  }

  return rect;
}

window.getLostSeekCropDebugInfo = getAuthoritativeCropRect;

function openProfileCropEditor(img, rawUrl) {
  cropState.img = img;
  cropState.rawUrl = rawUrl;

  const modal = document.getElementById('profile-crop-editor-modal');
  if (modal) {
    modal.style.display = 'flex';
  }

  const viewport = document.getElementById('crop-viewport-container');
  const actualVp = (viewport && viewport.clientWidth > 50) ? viewport.clientWidth : 280;
  cropState.viewportSize = actualVp;

  const stageImg = document.getElementById('crop-stage-image');

  const setupDimensionsAndPosition = () => {
    const nw = (stageImg && stageImg.naturalWidth > 0) ? stageImg.naturalWidth : (img.naturalWidth || img.width || 400);
    const nh = (stageImg && stageImg.naturalHeight > 0) ? stageImg.naturalHeight : (img.naturalHeight || img.height || 400);
    cropState.naturalW = nw;
    cropState.naturalH = nh;

    // Calculate cover scale so image completely fills the square viewport without any empty margins
    cropState.minScale = calculateCoverScale(cropState.naturalW, cropState.naturalH, cropState.viewportSize);
    cropState.currentZoom = 1.0;
    cropState.effectiveScale = cropState.minScale;

    // Center the image initially inside the viewport
    cropState.posX = (cropState.viewportSize - cropState.naturalW * cropState.effectiveScale) / 2;
    cropState.posY = (cropState.viewportSize - cropState.naturalH * cropState.effectiveScale) / 2;

    applyCropTransform(false);
  };

  if (stageImg) {
    if (stageImg.src !== rawUrl) {
      stageImg.onload = () => {
        setupDimensionsAndPosition();
      };
      stageImg.src = rawUrl;
    } else {
      setupDimensionsAndPosition();
    }
  } else {
    setupDimensionsAndPosition();
  }

  const slider = document.getElementById('crop-zoom-slider');
  if (slider) {
    slider.min = '1.0';
    slider.max = '3.5';
    slider.step = '0.01';
    slider.value = '1.0';
  }

  const saveBtn = document.getElementById('btn-crop-save');
  const saveBtnText = document.getElementById('crop-save-btn-text');
  if (saveBtn) saveBtn.disabled = false;
  if (saveBtnText) saveBtnText.textContent = 'Save';

  bindCropEditorEvents();
  applyCropTransform(false);

  if (window.lucide) window.lucide.createIcons();
}

function closeProfileCropEditorModal() {
  const modal = document.getElementById('profile-crop-editor-modal');
  if (modal) {
    modal.style.display = 'none';
  }
  const stageImg = document.getElementById('crop-stage-image');
  if (stageImg) {
    stageImg.src = '';
  }
  cropState.activePointers.clear();
}

async function saveCroppedProfilePhoto() {
  if (!appState.user) {
    showToast('You must be signed in to update your profile picture.', 'error');
    return;
  }

  if (!cropState.img && !cropState.rawUrl) {
    showToast('No image loaded to save.', 'warning');
    return;
  }

  const saveBtn = document.getElementById('btn-crop-save');
  const saveBtnText = document.getElementById('crop-save-btn-text');
  if (saveBtn) saveBtn.disabled = true;
  if (saveBtnText) saveBtnText.textContent = 'Saving...';

  try {
    // 1. Authoritative crop calculation (exact same coordinate space as preview)
    const crop = getAuthoritativeCropRect();

    // 2. High-fidelity square canvas output (max 800x800 for clarity and fast upload)
    const targetDim = Math.min(800, Math.max(360, Math.round(crop.sourceWidth)));
    const canvas = document.createElement('canvas');
    canvas.width = targetDim;
    canvas.height = targetDim;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 3. Render using exact mathematically identical affine transform:
    // The viewport [0, viewportSize] maps to the canvas [0, targetDim] by factor k:
    const k = targetDim / crop.viewportSize;
    ctx.setTransform(
      crop.effectiveScale * k,
      0,
      0,
      crop.effectiveScale * k,
      crop.posX * k,
      crop.posY * k
    );

    const stageImg = document.getElementById('crop-stage-image');
    const sourceElement = (stageImg && stageImg.complete && stageImg.naturalWidth > 0)
      ? stageImg
      : (cropState.img || stageImg);

    ctx.drawImage(sourceElement, 0, 0, crop.naturalW, crop.naturalH);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Restore identity transform

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.88);

    // 4. Upload to Vercel Blob storage flow
    const cloudUrl = await uploadProfileImageToCloud(croppedDataUrl, appState.user.username);

    // 5. Save to user profile via backend
    const res = await fetch(API_BASE + '/api/auth?action=profile', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        username: appState.user.username,
        avatarUrl: cloudUrl
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Server returned ${res.status}`);
    }

    const data = await res.json();
    const rawFinalUrl = (data.profile && data.profile.avatarUrl) || (data.user && data.user.avatarUrl) || cloudUrl;
    const finalUrl = rawFinalUrl.includes('?') ? rawFinalUrl.replace(/([?&]t=)\d+/, '$1' + Date.now()) : `${rawFinalUrl}?t=${Date.now()}`;

    // 6. Update user state across all aliases immediately
    appState.user.avatarUrl = finalUrl;
    appState.user.avatar = finalUrl;
    appState.user.avatar_url = finalUrl;
    appState.user.profilePicture = finalUrl;
    appState.user.profilePictureUrl = finalUrl;
    appState.user.photoUrl = finalUrl;

    saveData();
    setupAuthenticatedUser(appState.user);
    renderProfile();

    closeProfileCropEditorModal();
    showToast('Profile picture updated.', 'success');
  } catch (err) {
    console.error('Failed to save cropped profile picture:', err);
    showToast(`Failed to save profile picture: ${err.message || 'Network error'}`, 'error');
  } finally {
    if (saveBtn) saveBtn.disabled = false;
    if (saveBtnText) saveBtnText.textContent = 'Save';
  }
}

async function uploadProfileImageToCloud(dataUrl, username) {
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    throw new Error('Invalid image data for cloud upload.');
  }
  const res = await fetch(API_BASE + '/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: dataUrl,
      filename: `avatar-${username || 'user'}-${Date.now()}.jpg`
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Upload failed with HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!data.success || !data.url || !data.url.startsWith('http')) {
    throw new Error(data.message || 'Cloud storage upload did not return a valid URL.');
  }
  return data.url;
}

function handleProfilePhotoSelected(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Please select a valid image file (JPEG, PNG, WEBP).', 'warning');
    e.target.value = '';
    return;
  }

  if (file.size > 20 * 1024 * 1024) {
    showToast('Image is too large. Please select a photo under 20MB.', 'warning');
    e.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onerror = () => {
    showToast('Failed to read image file.', 'error');
    e.target.value = '';
  };
  reader.onload = (loadEvt) => {
    const dataUrl = loadEvt.target.result;
    const img = new Image();
    img.onload = () => {
      openProfileCropEditor(img, dataUrl);
    };
    img.onerror = () => {
      showToast('Failed to load image preview.', 'error');
    };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

async function handleProfilePasswordChange(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('pwd-current')?.value;
  const newPassword = document.getElementById('pwd-new')?.value;
  const confirmPassword = document.getElementById('pwd-confirm')?.value;
  const btn = document.getElementById('btn-change-password') || document.getElementById('btn-update-password');

  if (!currentPassword || !newPassword) {
    showToast('Please enter both your current and new password.', 'warning');
    return;
  }

  if (newPassword.length < 6) {
    showToast('New password must be at least 6 characters long.', 'warning');
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast('New passwords do not match.', 'error');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Updating password...';
    if (window.lucide) window.lucide.createIcons();
  }

  try {
    const res = await fetch(API_BASE + '/api/change-password', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        username: appState.user.username,
        currentPassword,
        newPassword,
        confirmPassword
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Password changed successfully! 🔒', 'success');
      document.getElementById('profile-change-password-form')?.reset();
    } else {
      showToast(data.message || 'Failed to change password.', 'error');
    }
  } catch (err) {
    showToast('Network error while changing password: ' + err.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="lock"></i> <span>Change Password</span>';
      if (window.lucide) window.lucide.createIcons();
    }
  }
}

function renderSettings() {
  updateSettingsThemeCards(currentTheme);

  // If Admin, populate Official Contacts editor
  const isAdmin = appState.user && appState.user.role && appState.user.role.toLowerCase() === 'admin';
  const contactsCard = document.getElementById('admin-settings-contacts-card');
  if (contactsCard) {
    contactsCard.style.display = isAdmin ? 'block' : 'none';
    if (isAdmin && appState.officialContacts) {
      const officeInput = document.getElementById('setting-phone-office');
      const secInput = document.getElementById('setting-phone-security');
      const policeInput = document.getElementById('setting-phone-police');

      if (officeInput) officeInput.value = appState.officialContacts.campusOffice?.phone || '';
      if (secInput) secInput.value = appState.officialContacts.campusSecurity?.phone || '';
      if (policeInput) policeInput.value = appState.officialContacts.policeStation?.phone || '';
    }
  }

  if (window.lucide) window.lucide.createIcons();
}



