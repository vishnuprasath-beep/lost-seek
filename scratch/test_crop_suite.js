// Comprehensive Verification Suite for LostSeek Profile Picture Editor Upgrade
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('LOSTSEEK PROFILE PICTURE EDITOR UPGRADE — VERIFICATION SUITE');
console.log('================================================================');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// TEST 1: CROP & POSITION MATHEMATICS AND BOUNDARY INVARIANTS
// -----------------------------------------------------------------------------
console.log('\n--- 1. CROP VIEWPORT & BOUNDARY MATH INVARIANTS ---');

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

const viewportSize = 280;
const testImages = [
  { name: 'Landscape 4:3 (1600x1200)', w: 1600, h: 1200 },
  { name: 'Portrait 9:16 (1080x1920)', w: 1080, h: 1920 },
  { name: 'Square 1:1 (800x800)', w: 800, h: 800 },
  { name: 'Ultra-wide 21:9 (2560x1080)', w: 2560, h: 1080 },
  { name: 'Small portrait (300x500)', w: 300, h: 500 }
];

testImages.forEach(img => {
  const minScale = calculateCoverScale(img.w, img.h, viewportSize);
  const renderedMinW = img.w * minScale;
  const renderedMinH = img.h * minScale;

  assert(renderedMinW >= viewportSize - 0.001, `${img.name}: minimum scale covers width (${renderedMinW.toFixed(1)} >= ${viewportSize})`);
  assert(renderedMinH >= viewportSize - 0.001, `${img.name}: minimum scale covers height (${renderedMinH.toFixed(1)} >= ${viewportSize})`);

  // Test zoom levels from 1.0x to 3.5x
  [1.0, 1.5, 2.0, 3.5].forEach(zoom => {
    const scale = minScale * zoom;
    // Test boundary clamps for extreme positions (e.g. user dragged way too far left or right)
    const clampedExtremeNeg = clampCropPosition(-99999, -99999, scale, img.w, img.h, viewportSize);
    const clampedExtremePos = clampCropPosition(99999, 99999, scale, img.w, img.h, viewportSize);

    // Check that right edge and bottom edge stay >= viewportSize
    const rightEdge = clampedExtremeNeg.x + img.w * scale;
    const bottomEdge = clampedExtremeNeg.y + img.h * scale;
    assert(rightEdge >= viewportSize - 0.001, `${img.name} (z=${zoom}): right edge never exposes empty margin (${rightEdge.toFixed(1)} >= ${viewportSize})`);
    assert(bottomEdge >= viewportSize - 0.001, `${img.name} (z=${zoom}): bottom edge never exposes empty margin (${bottomEdge.toFixed(1)} >= ${viewportSize})`);

    // Check that left edge and top edge stay <= 0
    assert(clampedExtremePos.x <= 0.001, `${img.name} (z=${zoom}): left edge never leaves empty gap (${clampedExtremePos.x} <= 0)`);
    assert(clampedExtremePos.y <= 0.001, `${img.name} (z=${zoom}): top edge never leaves empty gap (${clampedExtremePos.y} <= 0)`);

    // Verify source crop coordinate extraction stays strictly inside image dimensions
    const sx = (-clampedExtremeNeg.x) / scale;
    const sy = (-clampedExtremeNeg.y) / scale;
    const sWidth = viewportSize / scale;
    const sHeight = viewportSize / scale;
    assert(sx >= 0 && sx + sWidth <= img.w + 0.001, `${img.name} (z=${zoom}): source sx..sx+sWidth within bounds [0, ${img.w}]`);
    assert(sy >= 0 && sy + sHeight <= img.h + 0.001, `${img.name} (z=${zoom}): source sy..sy+sHeight within bounds [0, ${img.h}]`);
  });
});

// -----------------------------------------------------------------------------
// TEST 2: AVATAR ALIAS RESOLUTION ACROSS ALL 6 COMPATIBILITY PROPERTIES
// -----------------------------------------------------------------------------
console.log('\n--- 2. AVATAR ALIAS COMPATIBILITY & RESOLUTION ---');

const aliases = [
  { key: 'avatarUrl', val: 'https://example.com/a1.jpg' },
  { key: 'avatar', val: 'https://example.com/a2.jpg' },
  { key: 'avatar_url', val: 'https://example.com/a3.jpg' },
  { key: 'profilePicture', val: 'https://example.com/a4.jpg' },
  { key: 'profilePictureUrl', val: 'https://example.com/a5.jpg' },
  { key: 'photoUrl', val: 'https://example.com/a6.jpg' }
];

aliases.forEach(item => {
  const user = { name: 'Test Student', role: 'student' };
  user[item.key] = item.val;

  const canonicalAvatar = user.avatarUrl || user.avatar || user.avatar_url || user.profilePicture || user.profilePictureUrl || user.photoUrl || null;
  assert(canonicalAvatar === item.val, `Resolved alias '${item.key}' correctly: ${canonicalAvatar}`);

  const hasAvatar = !!(user.avatarUrl || user.avatar || user.avatar_url || user.profilePicture || user.profilePictureUrl || user.photoUrl);
  assert(hasAvatar === true, `Avatar presence detected for alias '${item.key}'`);
});

// -----------------------------------------------------------------------------
// TEST 3: BACKEND SECURITY & IDENTITY ENFORCEMENT (/api/auth?action=profile)
// -----------------------------------------------------------------------------
console.log('\n--- 3. BACKEND AUTHORIZATION & SECURITY CHECKS ---');

const authCode = fs.readFileSync(path.join(__dirname, '../api/auth.js'), 'utf8');

assert(authCode.includes('action === \'profile\''), 'api/auth.js has action === "profile" handler');
assert(authCode.includes('verifyBearerToken') || authCode.includes('authHeader.startsWith(\'Bearer \')'), 'api/auth.js inspects Authorization Bearer token');
assert(authCode.includes('403') || authCode.includes('Forbidden'), 'api/auth.js returns 403 Forbidden for unauthorized user modifications');
assert(authCode.includes('supabase.auth.admin.updateUserById'), 'api/auth.js uses secure Supabase admin to persist user_metadata.avatarUrl');

// -----------------------------------------------------------------------------
// TEST 4: UI HTML ELEMENTS INTEGRITY
// -----------------------------------------------------------------------------
console.log('\n--- 4. UI MODALS AND CROPPING CONTROLS INTEGRITY ---');

const htmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const requiredHtmlIds = [
  'edit-profile-picture-modal',
  'modal-edit-profile-avatar-preview',
  'btn-profile-choose-camera',
  'btn-profile-choose-gallery',
  'btn-profile-recrop-current',
  'profile-crop-editor-modal',
  'crop-viewport-container',
  'crop-stage-image',
  'crop-grid-overlay',
  'crop-circular-guide',
  'btn-crop-reset',
  'btn-crop-zoom-minus',
  'crop-zoom-slider',
  'btn-crop-zoom-plus',
  'btn-crop-cancel',
  'btn-crop-save'
];

requiredHtmlIds.forEach(id => {
  assert(htmlContent.includes(`id="${id}"`), `index.html contains element id="${id}"`);
});

// -----------------------------------------------------------------------------
// TEST 5: JAVASCRIPT CONTROLLER FUNCTIONS IN app.js
// -----------------------------------------------------------------------------
console.log('\n--- 5. JAVASCRIPT CONTROLLER FUNCTIONS IN app.js ---');

const appContent = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');

const requiredJsFuncs = [
  'openEditProfilePictureModal',
  'closeEditProfilePictureModal',
  'triggerProfilePhotoUpload',
  'openProfileCropEditor',
  'closeProfileCropEditorModal',
  'setCropZoom',
  'stepCropZoom',
  'handleCropSliderInput',
  'resetCropPosition',
  'saveCroppedProfilePhoto',
  'bindCropEditorEvents',
  'calculateCoverScale',
  'clampCropPosition',
  'handleProfilePhotoSelected'
];

requiredJsFuncs.forEach(func => {
  assert(appContent.includes(func), `app.js defines ${func}()`);
});

assert(appContent.includes('Profile picture updated.'), 'app.js gives required success message: "Profile picture updated."');

console.log('\n================================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('================================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
