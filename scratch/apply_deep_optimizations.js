const fs = require('fs');
const path = require('path');

// 1. UPDATE index.html
let indexContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// Remove the 3 external heavy scripts from <head>
indexContent = indexContent.replace(
  `  <!-- External Libraries (Preserved & Deferred) -->
  <script defer src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>`,
  `  <!-- External Libraries Loaded On-Demand via app.js -->`
);

// Fix search placeholder contrast in phone mockup
indexContent = indexContent.replace(
  `<div class="lp-phone-search">\n                  <i data-lucide="search" style="width: 12px; height: 12px;"></i>\n                  <span>Search items, locations...</span>\n                </div>`,
  `<div class="lp-phone-search">\n                  <i data-lucide="search" style="width: 12px; height: 12px; color: #475569;"></i>\n                  <span style="color: #475569; font-weight: 500;">Search items, locations...</span>\n                </div>`
);

// Fix leather wallet "Found" label
indexContent = indexContent.replace(
  `<div class="lp-mini-title">Leather Wallet</div>\n                    <div class="lp-mini-sub"><strong style="color:#10b981;">Found</strong> • Canteen • 5h ago</div>`,
  `<div class="lp-mini-title">Leather Wallet</div>\n                    <div class="lp-mini-sub"><strong style="color:#047857;">Found</strong> • Canteen • 5h ago</div>`
);

// Fix footer text contrast on dark background
indexContent = indexContent.replace(
  `<span style="font-size: 0.8rem; color: #475569;">— AI-Powered Smart Campus Lost &amp; Found</span>`,
  `<span style="font-size: 0.8rem; color: #cbd5e1;">— AI-Powered Smart Campus Lost &amp; Found</span>`
);

indexContent = indexContent.replace(
  `        <div class="lp-footer-note">\n          <span>Built for a safer, smarter campus</span>`,
  `        <div class="lp-footer-note">\n          <span style="color: #cbd5e1;">Built for a safer, smarter campus</span>`
);

// Add <main id="main-content"> landmark
if (!indexContent.includes('<main id="main-content">')) {
  indexContent = indexContent.replace(
    `    <!-- Hero Section -->\n    <section class="lp-hero-section" id="home">`,
    `    <main id="main-content">\n    <!-- Hero Section -->\n    <section class="lp-hero-section" id="home">`
  );
  indexContent = indexContent.replace(
    `    </section>\n\n    <!-- Landing Footer -->`,
    `    </section>\n    </main>\n\n    <!-- Landing Footer -->`
  );
}

fs.writeFileSync(path.join(__dirname, '../index.html'), indexContent, 'utf8');
fs.writeFileSync(path.join(__dirname, '../public/index.html'), indexContent, 'utf8');
fs.writeFileSync(path.join(__dirname, '../200.html'), indexContent, 'utf8');
fs.writeFileSync(path.join(__dirname, '../public/200.html'), indexContent, 'utf8');

console.log('✓ index.html and all mirrors updated with contrast fixes, main landmark, and deferred scripts removed from head');

// 2. UPDATE app.js with on-demand script loaders
let appContent = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');

// Insert loadScriptAsync helper
if (!appContent.includes('function loadScriptAsync(')) {
  const helperCode = `
// On-demand script loader for performance optimization
function loadScriptAsync(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(\`script[src="\${src}"]\`);
    if (existing) {
      if (existing.dataset.loaded === 'true' || window.Chart || window.QRCode || window.jspdf) return resolve();
      existing.addEventListener('load', () => { existing.dataset.loaded = 'true'; resolve(); });
      existing.addEventListener('error', reject);
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => { s.dataset.loaded = 'true'; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
`;
  appContent = helperCode + appContent;
}

// Update initAnalyticsCharts
appContent = appContent.replace(
  `function initAnalyticsCharts() {\n  if (typeof Chart === 'undefined') return;`,
  `function initAnalyticsCharts() {\n  if (typeof Chart === 'undefined') {\n    loadScriptAsync('https://cdn.jsdelivr.net/npm/chart.js').then(() => initAnalyticsCharts()).catch(() => {});\n    return;\n  }`
);

// Update generateQrCode / openQrModal
appContent = appContent.replace(
  `  if (typeof QRCode !== 'undefined' && canvas) {`,
  `  if (typeof QRCode === 'undefined') {\n    loadScriptAsync('https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js').then(() => openQrModal(itemId)).catch(() => {});\n    return;\n  }\n  if (canvas) {`
);

// Update downloadReportPdf fallback
appContent = appContent.replace(
  `  // Fallback: Client-side jsPDF generator\n  try {\n    if (window.jspdf && window.jspdf.jsPDF) {`,
  `  // Fallback: Client-side jsPDF generator\n  try {\n    if (!window.jspdf) {\n      await loadScriptAsync('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');\n    }\n    if (window.jspdf && window.jspdf.jsPDF) {`
);

fs.writeFileSync(path.join(__dirname, '../app.js'), appContent, 'utf8');
fs.writeFileSync(path.join(__dirname, '../public/app.js'), appContent, 'utf8');

console.log('✓ app.js and public/app.js updated with on-demand loaders');
