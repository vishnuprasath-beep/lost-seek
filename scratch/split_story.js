const fs = require('fs');
const path = require('path');

const idxPath = path.join(__dirname, '..', 'public', 'index.html');
const backupPath = path.join(__dirname, '..', 'public', '200.html');
const storyPath = path.join(__dirname, '..', 'public', 'story.html');
const vercelPath = path.join(__dirname, '..', 'vercel.json');

// Read files
let idxHTML = fs.readFileSync(idxPath, 'utf8');
const backupHTML = fs.readFileSync(backupPath, 'utf8');

// --- 1. EXTRACT ORIGINAL LANDING PAGE MAIN ---
const origStart = backupHTML.indexOf('<main id="main-content">');
const origEnd = backupHTML.indexOf('</main>', origStart) + 7;
let origMain = backupHTML.substring(origStart, origEnd);

// Add "Reveal the Story" button to original main
const buttonHtml = `
              <button type="button" class="lp-btn lp-btn-outline" onclick="window.location.href='/story'" style="border-color: #f59e0b; color: #f59e0b;">
                <i data-lucide="book-open" style="width: 16px; height: 16px;"></i>
                <span>Reveal the Story</span>
              </button>
`;
// Replace the exact closing div for the secondary CTAs to inject the new button
origMain = origMain.replace(
  '<span>Get Android App</span>\n              </a>\n            </div>',
  '<span>Get Android App</span>\n              </a>\n' + buttonHtml + '            </div>'
);


// --- 2. CREATE STORY.HTML ---
// Create story.html by taking current index.html (which has manga)
let storyHTML = idxHTML;

// Add Back to LostSeek button
const backButton = `
<div style="position: absolute; top: 100px; left: 24px; z-index: 1000;">
  <a href="/" class="lp-btn lp-btn-outline" style="background: rgba(15,23,42,0.85); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.1); color: white; text-decoration: none; padding: 8px 16px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 8px; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
    Back to Home
  </a>
</div>
`;
storyHTML = storyHTML.replace('<main id="main-content" class="manga-viewer-container">', '<main id="main-content" class="manga-viewer-container">' + backButton);

// Update Skip Story button to actually redirect to /#login
storyHTML = storyHTML.replace(
  'onclick="goToAppLogin()"',
  'onclick="window.location.href=\'/#login\'"'
);

// We need to hide header/footer in story mode so it feels like a standalone story page (or just leave them, they are fine).
// The user said: "But the story page can retain its manga/anime visual style. The landing page should NOT look like a manga page."
// Actually leaving the header/footer is perfectly fine.

fs.writeFileSync(storyPath, storyHTML);


// --- 3. RESTORE INDEX.HTML ---
const mangaStart = idxHTML.indexOf('<main id="main-content" class="manga-viewer-container">');
const mangaEnd = idxHTML.indexOf('</main>', mangaStart) + 7;
idxHTML = idxHTML.substring(0, mangaStart) + origMain + idxHTML.substring(mangaEnd);

fs.writeFileSync(idxPath, idxHTML);
fs.writeFileSync(backupPath, idxHTML);


// --- 4. UPDATE VERCEL.JSON ---
let vercelJson = fs.readFileSync(vercelPath, 'utf8');
if (!vercelJson.includes('"/story"')) {
  vercelJson = vercelJson.replace(
    '{ "source": "/((?!api/|.*\\\\..*).*)", "destination": "/index.html" }',
    '{ "source": "/story", "destination": "/story.html" },\n    { "source": "/((?!api/|.*\\\\..*).*)", "destination": "/index.html" }'
  );
  fs.writeFileSync(vercelPath, vercelJson);
}

console.log('Successfully separated manga story into story.html and restored original landing page!');
