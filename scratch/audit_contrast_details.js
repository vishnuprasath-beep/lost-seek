const fs = require('fs');
const path = require('path');

// WCAG relative luminance calculation
function sRGBtoLin(c) {
  c = c / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function getLuminance(r, g, b) {
  return 0.2126 * sRGBtoLin(r) + 0.7152 * sRGBtoLin(g) + 0.0722 * sRGBtoLin(b);
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const num = parseInt(hex, 16);
  return [ (num >> 16) & 255, (num >> 8) & 255, num & 255 ];
}

function getContrast(rgb1, rgb2) {
  const L1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const L2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
  const brighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (brighter + 0.05) / (darker + 0.05);
}

function testPair(label, fgHex, bgHex, isLargeText = false) {
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  const ratio = getContrast(fg, bg);
  const req = isLargeText ? 3.0 : 4.5;
  const pass = ratio >= req;
  console.log(`${pass ? '✓ [PASS]' : '✗ [FAIL]'} ${label}: FG=${fgHex} BG=${bgHex} -> Ratio: ${ratio.toFixed(2)}:1 (Min: ${req}:1)`);
  return { label, fgHex, bgHex, ratio, pass };
}

console.log('=== WCAG 2.2 AA CONTRAST AUDIT ===\n');

console.log('--- 1. LANDING PAGE COMBINATIONS ---');
testPair('LP Hero Title Green on Light BG', '#10b981', '#f0fdf4', true);
testPair('LP Hero Title Green on White', '#10b981', '#ffffff', true);
testPair('LP Hero Desc (Muted text)', '#64748b', '#f8fafc', false);
testPair('LP Hero Desc (Muted text) on White', '#64748b', '#ffffff', false);
testPair('LP Phone "Lost something?" text', '#059669', '#ffffff', false);
testPair('LP Mini Card Found label', '#10b981', '#ffffff', false);
testPair('LP Mini Card Lost label', '#ef4444', '#ffffff', false);
testPair('LP Highlights Icon/Text Muted', '#64748b', '#ffffff', false);
testPair('LP Step subtitle (Muted)', '#64748b', '#ffffff', false);
testPair('LP Card subtitle (Muted)', '#64748b', '#f8fafc', false);
testPair('LP Institutional Subtitle', '#64748b', '#f8fafc', false);
testPair('LP Footer Muted Text', '#64748b', '#ffffff', false);
testPair('LP Footer Brand Subtitle (opacity 0.7)', '#64748b', '#ffffff', false);
testPair('LP Version tag text', '#64748b', '#0f172a', false); // in dark android banner
testPair('LP Android disclaimer text', '#94a3b8', '#0f172a', false);

console.log('\n--- 2. APPLICATION THEME VARIABLES (DARK THEME) ---');
testPair('Dark Theme text-primary on bg-card', '#F4FAF9', '#0D252B', false);
testPair('Dark Theme text-secondary on bg-card', '#9BB5B3', '#0D252B', false);
testPair('Dark Theme text-muted on bg-card', '#628280', '#0D252B', false);
testPair('Dark Theme text-muted on bg-app', '#628280', '#071A1F', false);
testPair('Dark Theme chart-text on bg-card', '#9BB5B3', '#0D252B', false);

console.log('\n--- 3. APPLICATION THEME VARIABLES (LIGHT THEME) ---');
testPair('Light Theme text-primary on bg-card', '#0B2024', '#FFFFFF', false);
testPair('Light Theme text-secondary on bg-card', '#456865', '#FFFFFF', false);
testPair('Light Theme text-muted on bg-card', '#749693', '#FFFFFF', false);
testPair('Light Theme text-muted on bg-app', '#749693', '#F8FFFE', false);

console.log('\n--- 4. STATUS BADGES IN LIGHT THEME (ON WHITE CARD) ---');
testPair('Badge Pending/Searching (Warning)', '#F59E0B', '#FFFFFF', false);
testPair('Badge Matched/Possible (Violet)', '#8B5CF6', '#FFFFFF', false);
testPair('Badge Claimed/Review (Blue)', '#2563EB', '#FFFFFF', false);
testPair('Badge Verified (Teal bright)', '#14B8A6', '#FFFFFF', false);
testPair('Badge Returned/Approved (Success)', '#22C55E', '#FFFFFF', false);
testPair('Badge Rejected (Error)', '#EF4444', '#FFFFFF', false);
testPair('Badge Expired (text-secondary)', '#456865', '#FFFFFF', false);
testPair('Badge Urgent', '#EF4444', '#FFFFFF', false);

console.log('\n--- 5. STATUS BADGES IN DARK THEME (ON #0D252B) ---');
testPair('Dark Badge Pending (Warning)', '#F59E0B', '#0D252B', false);
testPair('Dark Badge Matched (Violet)', '#8B5CF6', '#0D252B', false);
testPair('Dark Badge Claimed (Blue)', '#2563EB', '#0D252B', false);
testPair('Dark Badge Verified (Teal bright)', '#14B8A6', '#0D252B', false);
testPair('Dark Badge Returned (Success)', '#22C55E', '#0D252B', false);
testPair('Dark Badge Rejected (Error)', '#EF4444', '#0D252B', false);
testPair('Dark Badge Expired', '#9BB5B3', '#0D252B', false);
