const fs = require('fs');
const path = require('path');

let content = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// 1. Google fonts + Preload LCP logo
const oldFontBlock = `  <!-- Google Fonts: Plus Jakarta Sans, Outfit, Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">`;

const newFontBlock = `  <!-- Google Fonts: Plus Jakarta Sans, Outfit, Inter (Non-blocking with swap) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap">
  </noscript>
  <link rel="preload" as="image" href="assets/images/lostseek-logo.webp" type="image/webp">`;

if (content.includes(oldFontBlock)) {
  content = content.replace(oldFontBlock, newFontBlock);
  console.log('✓ Updated font block & added WebP logo preload');
} else {
  console.log('✗ Font block target not found exactly');
}

// 2. Scripts in <head>
const oldHeadScripts = `  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>

  <!-- External Libraries (Preserved) -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>`;

const newHeadScripts = `  <!-- Lucide Icons (Deferred) -->
  <script defer src="https://unpkg.com/lucide@latest"></script>

  <!-- External Libraries (Preserved & Deferred) -->
  <script defer src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>`;

if (content.includes(oldHeadScripts)) {
  content = content.replace(oldHeadScripts, newHeadScripts);
  console.log('✓ Deferred head scripts');
} else {
  console.log('✗ Head scripts target not found');
}

// 3. Header Brand Logo
const oldBrandLogo = `<img 
            src="assets/images/lostseek-logo.png" 
            onerror="if(!this.dataset.r){this.dataset.r='1';this.src='/assets/images/lostseek-logo.png';}else if(this.dataset.r==='1'){this.dataset.r='2';this.src='./lostseek-logo.png';}else{this.src='public/assets/images/lostseek-logo.png';}" 
            alt="LostSeek logo" 
            class="lp-brand-logo" 
          />`;

const newBrandLogo = `<picture>
            <source srcset="assets/images/lostseek-logo.webp" type="image/webp">
            <img 
              src="assets/images/lostseek-logo.png" 
              onerror="if(!this.dataset.r){this.dataset.r='1';this.src='/assets/images/lostseek-logo.png';}else if(this.dataset.r==='1'){this.dataset.r='2';this.src='./lostseek-logo.png';}else{this.src='public/assets/images/lostseek-logo.png';}" 
              alt="LostSeek logo" 
              class="lp-brand-logo" 
              width="42" 
              height="42"
              loading="eager"
              decoding="async"
              fetchpriority="high"
            />
          </picture>`;

if (content.includes(oldBrandLogo)) {
  content = content.replace(oldBrandLogo, newBrandLogo);
  console.log('✓ Updated header brand logo with WebP picture & dimensions');
} else {
  console.log('✗ Header brand logo not matched');
}

// 4. Phone mockup subtext and colors
content = content.replace(
  `color: #059669; font-weight: 700; margin-bottom: 6px;">\n                  Lost something?`,
  `color: #047857; font-weight: 700; margin-bottom: 6px;">\n                  Lost something?`
);
content = content.replace(
  `<strong style="color:#10b981;">Found</strong>`,
  `<strong style="color:#047857;">Found</strong>`
);
content = content.replace(
  `<strong style="color:#ef4444;">Lost</strong>`,
  `<strong style="color:#b91c1c;">Lost</strong>`
);
content = content.replace(
  `<span style="font-size: 0.8rem; opacity: 0.7;">— AI-Powered Smart Campus Lost &amp; Found</span>`,
  `<span style="font-size: 0.8rem; color: #475569;">— AI-Powered Smart Campus Lost &amp; Found</span>`
);

// 5. Android banner logo
content = content.replace(
  `<img src="assets/images/lostseek-logo.png" alt="LostSeek Android" />`,
  `<picture><source srcset="assets/images/lostseek-logo.webp" type="image/webp"><img src="assets/images/lostseek-logo.png" alt="LostSeek Android" width="48" height="48" loading="lazy" decoding="async" /></picture>`
);

// 6. Footer logo
content = content.replace(
  `<img src="assets/images/lostseek-logo.png" alt="LostSeek" style="width: 30px; height: 30px; border-radius: 8px;" />`,
  `<picture><source srcset="assets/images/lostseek-logo.webp" type="image/webp"><img src="assets/images/lostseek-logo.png" alt="LostSeek" style="width: 30px; height: 30px; border-radius: 8px;" width="30" height="30" loading="lazy" decoding="async" /></picture>`
);

// 7. Defer app.js script tag
content = content.replace(
  `<script src="app.js"></script>`,
  `<script defer src="app.js"></script>`
);

// 8. Add aria-label to form inputs & selects missing labels
const ariaAdditions = [
  { id: 'global-search-input', label: 'Search items by keyword or location' },
  { id: 'find-item-search-input', label: 'Search lost and found items' },
  { id: 'find-filter-type', label: 'Filter by item type' },
  { id: 'find-filter-category', label: 'Filter by category' },
  { id: 'find-filter-location', label: 'Filter by campus location' },
  { id: 'find-filter-status', label: 'Filter by item status' },
  { id: 'reg-camera-input', label: 'Take profile photo with camera' },
  { id: 'reg-gallery-input', label: 'Upload profile photo from gallery' },
  { id: 'lost-camera-input', label: 'Take photo of lost item with camera' },
  { id: 'lost-gallery-input', label: 'Upload photo of lost item from gallery' },
  { id: 'lost-file-input', label: 'Select photo file of lost item' },
  { id: 'lost-location-other', label: 'Specify custom lost location' },
  { id: 'lost-color-picker', label: 'Pick item color' },
  { id: 'lost-color-val', label: 'Color hex code' },
  { id: 'found-camera-input', label: 'Take photo of found item with camera' },
  { id: 'found-gallery-input', label: 'Upload photo of found item from gallery' },
  { id: 'found-file-input', label: 'Select photo file of found item' },
  { id: 'found-location-other', label: 'Specify custom found location' },
  { id: 'found-color-picker', label: 'Pick item color' },
  { id: 'found-color-val', label: 'Color hex code' },
  { id: 'admin-lost-search-input', label: 'Search lost reports' },
  { id: 'admin-lost-filter-category', label: 'Filter lost reports by category' },
  { id: 'admin-lost-filter-location', label: 'Filter lost reports by location' },
  { id: 'admin-lost-filter-status', label: 'Filter lost reports by status' },
  { id: 'admin-lost-filter-sort', label: 'Sort lost reports' },
  { id: 'admin-found-search-input', label: 'Search found reports' },
  { id: 'admin-found-filter-category', label: 'Filter found reports by category' },
  { id: 'admin-found-filter-location', label: 'Filter found reports by location' },
  { id: 'admin-found-filter-status', label: 'Filter found reports by status' },
  { id: 'admin-found-filter-custody', label: 'Filter found reports by custody' },
  { id: 'admin-found-filter-sort', label: 'Sort found reports' },
  { id: 'admin-all-search-input', label: 'Search all reports' },
  { id: 'admin-all-filter-type', label: 'Filter all reports by type' },
  { id: 'admin-all-filter-category', label: 'Filter all reports by category' },
  { id: 'admin-all-filter-location', label: 'Filter all reports by location' },
  { id: 'admin-all-filter-status', label: 'Filter all reports by status' },
  { id: 'admin-all-filter-sort', label: 'Sort all reports' },
  { id: 'admin-claims-search-input', label: 'Search claim requests' },
  { id: 'admin-match-search-input', label: 'Search matches' },
  { id: 'admin-match-filter-threshold', label: 'Filter matches by threshold' },
  { id: 'students-search-input', label: 'Search students directory' },
  { id: 'ifound-camera-input', label: 'Take photo of sighting' },
  { id: 'ifound-gallery-input', label: 'Upload photo of sighting' },
  { id: 'ifound-location-other', label: 'Specify custom sighting location' },
  { id: 'admin-photo-input', label: 'Upload photo for similarity search' },
  { id: 'crop-zoom-slider', label: 'Adjust crop zoom' },
  { id: 'admin-help-search-input', label: 'Search assistance requests' },
  { id: 'admin-help-new-note-input', label: 'Add note to assistance request' },
  { id: 'admin-help-modal-status-select', label: 'Change assistance request status' },
  { id: 'sighting-camera-input', label: 'Take sighting photo' },
  { id: 'sighting-gallery-input', label: 'Upload sighting photo' }
];

let ariaCount = 0;
ariaAdditions.forEach(({ id, label }) => {
  const reg = new RegExp(`id=["']${id}["']([^>]*)>`, 'g');
  if (reg.test(content)) {
    content = content.replace(reg, (m, rest) => {
      if (!rest.includes('aria-label=')) {
        ariaCount++;
        return `id="${id}" aria-label="${label}"${rest}>`;
      }
      return m;
    });
  }
});
console.log(`✓ Added aria-labels to ${ariaCount} form controls in index.html`);

fs.writeFileSync(path.join(__dirname, '../index.html'), content, 'utf8');
console.log('✓ index.html saved successfully');
