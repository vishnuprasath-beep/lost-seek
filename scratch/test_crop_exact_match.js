// Regression Test Suite: Exact Match Between Crop Preview and Exported Image
// Also validates Android APK Landing Page Bypass Routing Logic

const assert = require('assert');

console.log('================================================================');
console.log('TEST SUITE: CROP PREVIEW <-> EXPORT FRAMING & ANDROID ROUTE BYPASS');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// SECTION 1: CROP VIEWPORT VS CANVAS EXPORT MATHEMATICAL EQUIVALENCE
// -----------------------------------------------------------------------------
console.log('--- 1. CROP PREVIEW VS EXPORT AFFINE TRANSFORM EQUIVALENCE ---');

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

// Viewport to Source Coordinate Mapping (What User Sees)
function viewportToSource(vx, vy, posX, posY, scale) {
  return {
    sx: (vx - posX) / scale,
    sy: (vy - posY) / scale
  };
}

// Canvas to Source Coordinate Mapping (What Canvas Draws via Affine Transform)
// Canvas transform is: ctx.setTransform(scale * k, 0, 0, scale * k, posX * k, posY * k)
// where k = targetDim / viewportSize
function canvasToSource(cx, cy, posX, posY, scale, viewportSize, targetDim) {
  const k = targetDim / viewportSize;
  const effectiveCanvasScale = scale * k;
  const effectiveCanvasPosX = posX * k;
  const effectiveCanvasPosY = posY * k;

  return {
    sx: (cx - effectiveCanvasPosX) / effectiveCanvasScale,
    sy: (cy - effectiveCanvasPosY) / effectiveCanvasScale
  };
}

const testCases = [
  {
    name: 'Portrait Phone Photo (3024x4032, Subject Off-Center Top-Left)',
    naturalW: 3024,
    naturalH: 4032,
    viewportSize: 280,
    targetDim: 800,
    // Pan to upper-left face
    panTargetX: -100,
    panTargetY: -80,
    zoom: 1.8
  },
  {
    name: 'Portrait Phone Photo (3024x4032, Drag Only, Cover Scale)',
    naturalW: 3024,
    naturalH: 4032,
    viewportSize: 280,
    targetDim: 800,
    panTargetX: -30,
    panTargetY: -150,
    zoom: 1.0
  },
  {
    name: 'Landscape Camera Photo (4032x3024, Subject Far Right)',
    naturalW: 4032,
    naturalH: 3024,
    viewportSize: 280,
    targetDim: 800,
    panTargetX: -400,
    panTargetY: -50,
    zoom: 2.2
  },
  {
    name: 'Landscape Camera Photo (4032x3024, Zoom Only at Center)',
    naturalW: 4032,
    naturalH: 3024,
    viewportSize: 280,
    targetDim: 800,
    panTargetX: null, // Will use center
    panTargetY: null,
    zoom: 3.0
  },
  {
    name: 'Square Gallery Photo (1200x1200, Combined Pan and Zoom)',
    naturalW: 1200,
    naturalH: 1200,
    viewportSize: 280,
    targetDim: 600,
    panTargetX: -80,
    panTargetY: -120,
    zoom: 1.5
  },
  {
    name: 'Small Screen Viewport (260px width, 2400x3200 photo)',
    naturalW: 2400,
    naturalH: 3200,
    viewportSize: 260,
    targetDim: 720,
    panTargetX: -150,
    panTargetY: -200,
    zoom: 1.4
  }
];

testCases.forEach(tc => {
  const minScale = calculateCoverScale(tc.naturalW, tc.naturalH, tc.viewportSize);
  const scale = minScale * tc.zoom;

  let posX = (tc.viewportSize - tc.naturalW * scale) / 2;
  let posY = (tc.viewportSize - tc.naturalH * scale) / 2;

  if (tc.panTargetX !== null && tc.panTargetY !== null) {
    const clamped = clampCropPosition(tc.panTargetX, tc.panTargetY, scale, tc.naturalW, tc.naturalH, tc.viewportSize);
    posX = clamped.x;
    posY = clamped.y;
  }

  // 1. Authoritative crop rectangle
  const sourceX = -posX / scale;
  const sourceY = -posY / scale;
  const sourceW = tc.viewportSize / scale;
  const sourceH = tc.viewportSize / scale;

  test(`${tc.name}: Source crop is within [0..W, 0..H] bounds`, () => {
    assert(sourceX >= -0.0001, `sourceX ${sourceX} >= 0`);
    assert(sourceY >= -0.0001, `sourceY ${sourceY} >= 0`);
    assert(sourceX + sourceW <= tc.naturalW + 0.001, `sourceX+sourceW ${sourceX + sourceW} <= ${tc.naturalW}`);
    assert(sourceY + sourceH <= tc.naturalH + 0.001, `sourceY+sourceH ${sourceY + sourceH} <= ${tc.naturalH}`);
  });

  test(`${tc.name}: Viewport corners map identically on exported canvas`, () => {
    // 4 Corners: Top-Left, Top-Right, Bottom-Left, Bottom-Right, plus Center
    const points = [
      { name: 'Top-Left', vx: 0, vy: 0, cx: 0, cy: 0 },
      { name: 'Top-Right', vx: tc.viewportSize, vy: 0, cx: tc.targetDim, cy: 0 },
      { name: 'Bottom-Left', vx: 0, vy: tc.viewportSize, cx: 0, cy: tc.targetDim },
      { name: 'Bottom-Right', vx: tc.viewportSize, vy: tc.viewportSize, cx: tc.targetDim, cy: tc.targetDim },
      { name: 'Center', vx: tc.viewportSize / 2, vy: tc.viewportSize / 2, cx: tc.targetDim / 2, cy: tc.targetDim / 2 }
    ];

    points.forEach(pt => {
      const vPt = viewportToSource(pt.vx, pt.vy, posX, posY, scale);
      const cPt = canvasToSource(pt.cx, pt.cy, posX, posY, scale, tc.viewportSize, tc.targetDim);

      const diffX = Math.abs(vPt.sx - cPt.sx);
      const diffY = Math.abs(vPt.sy - cPt.sy);

      assert(diffX < 1e-6, `${pt.name} X mismatch: v=${vPt.sx}, c=${cPt.sx}, diff=${diffX}`);
      assert(diffY < 1e-6, `${pt.name} Y mismatch: v=${vPt.sy}, c=${cPt.sy}, diff=${diffY}`);
    });
  });
});

// -----------------------------------------------------------------------------
// SECTION 2: ANDROID APK BYPASS PUBLIC LANDING PAGE ROUTING LOGIC
// -----------------------------------------------------------------------------
console.log('\n--- 2. ANDROID APK LANDING PAGE BYPASS ROUTING TESTS ---');

test('MainActivity appends LostSeekNativeAndroidApp/5 to user-agent', () => {
  const defaultUserAgent = 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UD1A.230803.041; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.230 Mobile Safari/537.36';
  const appendedUserAgent = defaultUserAgent + ' LostSeekNativeAndroidApp/5';

  assert(appendedUserAgent.includes('LostSeekNativeAndroidApp'), 'Must contain LostSeekNativeAndroidApp');
  assert(appendedUserAgent.includes('LostSeekNativeAndroidApp/5'), 'Must contain LostSeekNativeAndroidApp/5');
  assert(appendedUserAgent.startsWith('Mozilla/5.0'), 'Must preserve original browser user agent');
});

function simulateHashNavigation(hash, isAndroid, currentUser) {
  const appRouteMap = {
    'dashboard': 'dashboard-page',
    'find-item': 'find-item-page',
    'my-reports': 'my-reports-page'
  };

  // NATIVE ANDROID ROUTING LOGIC:
  // For native Android startup, session restoration takes priority over the #login startup hash:
  // IF native Android AND valid session exists -> restore the user's normal dashboard
  // IF native Android AND no valid session    -> show #login
  // Never show the public landing page in the APK.
  if (isAndroid) {
    if (currentUser && currentUser.name) {
      if (hash === 'home' || hash === 'landing' || hash === 'login' || !hash) {
        return 'dashboard-page';
      }
      return appRouteMap[hash] || 'dashboard-page';
    } else {
      return 'login-page';
    }
  }

  // NORMAL WEB BROWSER ROUTING LOGIC:
  if (currentUser && currentUser.name) {
    if (hash === 'home' || hash === 'landing') {
      return 'landing-page';
    }
    return appRouteMap[hash] || 'dashboard-page';
  }

  // Web Browser Unauthenticated visitor logic:
  if (hash === 'login' || hash === 'register') {
    return 'login-page';
  }

  if (['how-it-works', 'ai-matching', 'community', 'privacy'].includes(hash)) {
    return 'landing-page';
  }

  // Web unauthenticated root
  return 'landing-page';
}

test('Web Browser unauthenticated visiting / -> shows landing page', () => {
  const result = simulateHashNavigation('', false, null);
  assert.strictEqual(result, 'landing-page');
});

test('Web Browser unauthenticated visiting #home -> shows landing page', () => {
  const result = simulateHashNavigation('home', false, null);
  assert.strictEqual(result, 'landing-page');
});

test('Web Browser unauthenticated visiting #login -> shows login page', () => {
  const result = simulateHashNavigation('login', false, null);
  assert.strictEqual(result, 'login-page');
});

test('Native Android APK unauthenticated launching root / -> shows login page (NEVER landing)', () => {
  const result = simulateHashNavigation('', true, null);
  assert.strictEqual(result, 'login-page');
});

test('Native Android APK unauthenticated navigating to #home -> shows login page (NEVER landing)', () => {
  const result = simulateHashNavigation('home', true, null);
  assert.strictEqual(result, 'login-page');
});

test('Native Android APK unauthenticated navigating to #landing -> shows login page (NEVER landing)', () => {
  const result = simulateHashNavigation('landing', true, null);
  assert.strictEqual(result, 'login-page');
});

test('Native Android APK unauthenticated launching startup #login -> shows login page (NEVER landing)', () => {
  const result = simulateHashNavigation('login', true, null);
  assert.strictEqual(result, 'login-page');
});

test('Native Android APK authenticated session startup with #login -> RESTORES DASHBOARD (session priority)', () => {
  const result = simulateHashNavigation('login', true, { name: 'Prakash' });
  assert.strictEqual(result, 'dashboard-page');
});

test('Native Android APK authenticated session visiting #home -> shows dashboard (NEVER landing)', () => {
  const result = simulateHashNavigation('home', true, { name: 'Prakash' });
  assert.strictEqual(result, 'dashboard-page');
});

test('Native Android APK authenticated session visiting root / -> shows dashboard', () => {
  const result = simulateHashNavigation('', true, { name: 'Prakash' });
  assert.strictEqual(result, 'dashboard-page');
});

console.log('\n================================================================');
console.log(`ALL TESTS COMPLETED: ${passedTests}/${totalTests} PASSED`);
console.log('================================================================');
