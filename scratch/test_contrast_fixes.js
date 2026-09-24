const fs = require('fs');

function sRGBtoLin(c) {
  c = c / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function getLuminance(r, g, b) {
  return 0.2126 * sRGBtoLin(r) + 0.7152 * sRGBtoLin(g) + 0.0722 * sRGBtoLin(b);
}
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const num = parseInt(hex, 16);
  return [ (num >> 16) & 255, (num >> 8) & 255, num & 255 ];
}
function getContrast(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const L1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const L2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

const tests = [
  // Landing Page fixes
  { name: 'LP Hero Title Green (#047857 on #f0fdf4)', fg: '#047857', bg: '#f0fdf4', req: 3.0 },
  { name: 'LP Hero Title Green (#047857 on #ffffff)', fg: '#047857', bg: '#ffffff', req: 3.0 },
  { name: 'LP Phone subtext (#047857 on #ffffff)', fg: '#047857', bg: '#ffffff', req: 4.5 },
  { name: 'LP Mini Found (#047857 on #ffffff)', fg: '#047857', bg: '#ffffff', req: 4.5 },
  { name: 'LP Mini Lost (#b91c1c on #ffffff)', fg: '#b91c1c', bg: '#ffffff', req: 4.5 },
  { name: 'LP Android Version Tag (#cbd5e1 on #0f172a)', fg: '#cbd5e1', bg: '#0f172a', req: 4.5 },
  { name: 'LP Footer Muted (#475569 on #ffffff)', fg: '#475569', bg: '#ffffff', req: 4.5 },

  // Dark Theme fixes
  { name: 'Dark Theme text-muted (#8AAEA8 on #0D252B)', fg: '#8AAEA8', bg: '#0D252B', req: 4.5 },
  { name: 'Dark Theme text-muted (#8AAEA8 on #071A1F)', fg: '#8AAEA8', bg: '#071A1F', req: 4.5 },
  { name: 'Dark Badge Matched (#A78BFA on #0D252B)', fg: '#A78BFA', bg: '#0D252B', req: 4.5 },
  { name: 'Dark Badge Claimed (#60A5FA on #0D252B)', fg: '#60A5FA', bg: '#0D252B', req: 4.5 },
  { name: 'Dark Badge Rejected (#F87171 on #0D252B)', fg: '#F87171', bg: '#0D252B', req: 4.5 },
  { name: 'Dark Badge Warning (#FBBF24 on #0D252B)', fg: '#FBBF24', bg: '#0D252B', req: 4.5 },

  // Light Theme fixes
  { name: 'Light Theme text-muted (#50706D on #FFFFFF)', fg: '#50706D', bg: '#FFFFFF', req: 4.5 },
  { name: 'Light Theme text-muted (#50706D on #F8FFFE)', fg: '#50706D', bg: '#F8FFFE', req: 4.5 },
  { name: 'Light Badge Pending (#B45309 on #FFFFFF)', fg: '#B45309', bg: '#FFFFFF', req: 4.5 },
  { name: 'Light Badge Matched (#6D28D9 on #FFFFFF)', fg: '#6D28D9', bg: '#FFFFFF', req: 4.5 },
  { name: 'Light Badge Claimed (#1D4ED8 on #FFFFFF)', fg: '#1D4ED8', bg: '#FFFFFF', req: 4.5 },
  { name: 'Light Badge Verified (#0F766E on #FFFFFF)', fg: '#0F766E', bg: '#FFFFFF', req: 4.5 },
  { name: 'Light Badge Returned (#15803D on #FFFFFF)', fg: '#15803D', bg: '#FFFFFF', req: 4.5 },
  { name: 'Light Badge Rejected (#B91C1C on #FFFFFF)', fg: '#B91C1C', bg: '#FFFFFF', req: 4.5 },
  { name: 'Light Badge Urgent (#B91C1C on #FFFFFF)', fg: '#B91C1C', bg: '#FFFFFF', req: 4.5 },
];

let allPass = true;
tests.forEach(t => {
  const r = getContrast(t.fg, t.bg);
  const pass = r >= t.req;
  if (!pass) allPass = false;
  console.log(`${pass ? '✓ [PASS]' : '✗ [FAIL]'} ${t.name} -> Ratio: ${r.toFixed(2)}:1 (Min: ${t.req}:1)`);
});
console.log(`\nOverall Result: ${allPass ? 'ALL PROPOSED COLORS PASS WCAG 2.2 AA!' : 'FAILURES REMAIN'}`);
