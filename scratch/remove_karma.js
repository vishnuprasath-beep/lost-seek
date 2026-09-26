const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\Users\\prakash c\\Desktop\\smart campus-pro';

function replaceInFile(relativePath, replacements) {
  const p = path.join(rootDir, relativePath);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');
  let original = content;
  
  for (const r of replacements) {
    if (r.type === 'regex') {
      content = content.replace(r.search, r.replace);
    } else {
      content = content.split(r.search).join(r.replace);
    }
  }
  
  if (original !== content) {
    fs.writeFileSync(p, content);
    console.log(`Updated ${relativePath}`);
  }
}

// 1. Completely remove gamification system
const gamificationJs = 'public/src/18_gamification_system__karma___badges_.js';
replaceInFile(gamificationJs, [
  { type: 'regex', search: /function addKarma[\s\S]*?\n\}/g, replace: 'function addKarma() { /* Karma removed */ }' },
  { type: 'regex', search: /function getBadgeForKarma[\s\S]*?\n\}/g, replace: 'function getBadgeForKarma() { return ""; }' },
  { type: 'regex', search: /function updateKarmaUI[\s\S]*?\n\}/g, replace: 'function updateKarmaUI() { /* Karma removed */ }' }
]);

// 2. Remove karma additions
const jsFiles = [
  'public/src/12_my_reports___lifecycle_timeline.js',
  'public/src/15_admin_verification_desk___admin_page_.js',
  'public/src/34_safe_handover_modal___workflow.js',
  'public/src/32__i_found_an_item__flow.js',
  'public/src/5_auth___login_logic.js',
  'public/src/27_profile___settings_views.js',
  'public/src/6_navigation___routing__spa_.js',
  'public/src/24_admin__students__directory.js'
];

jsFiles.forEach(f => {
  replaceInFile(f, [
    { type: 'regex', search: /addKarma\([^\)]+\);?/g, replace: '' },
    { type: 'regex', search: /\+\s*\d+\s*Karma/ig, replace: '' },
    { type: 'regex', search: /Karma earned/ig, replace: '' },
    { type: 'regex', search: /karmaScore\s*:\s*\d+,?/g, replace: '' },
    { type: 'regex', search: /appState\.user\.karmaScore/g, replace: '0' },
    // Specific block removals:
    { type: 'regex', search: /<div class="user-karma">[\s\S]*?<\/div>/g, replace: '' },
    { type: 'regex', search: /<div class="student-karma">[\s\S]*?<\/div>/g, replace: '' },
    { type: 'regex', search: /<span class="user-karma-badge">.*?<\/span>/g, replace: '' },
    { type: 'regex', search: /<span class="nav-karma">.*?<\/span>/g, replace: '' },
    // Remove "Points" from profile stats
    { type: 'regex', search: /<div class="stat-box">[\s\S]*?<div class="stat-label">Points<\/div>\s*<\/div>/g, replace: '' }
  ]);
});

// 3. Remove Karma from HTML
const htmlFiles = [
  'public/index.html', 'index.html',
  'public/story.html', 'story.html',
  'public/200.html', '200.html',
  'scratch/build_manage_pages.js'
];

htmlFiles.forEach(f => {
  replaceInFile(f, [
    { type: 'regex', search: /<div class="nav-karma"[^>]*>[\s\S]*?<\/div>/g, replace: '' },
    { type: 'regex', search: /<div class="user-karma">[\s\S]*?<\/div>/g, replace: '' },
    { type: 'regex', search: /<span class="user-karma-badge">[\s\S]*?<\/span>/g, replace: '' },
    { type: 'regex', search: /<span class="nav-karma">[\s\S]*?<\/span>/g, replace: '' },
    // Points / Karma labels
    { type: 'regex', search: /<div class="stat-box">\s*<div class="stat-value">\d+<\/div>\s*<div class="stat-label">Points<\/div>\s*<\/div>/g, replace: '' },
    { type: 'regex', search: /<span class="badge badge-primary">\+\d+ Karma<\/span>/g, replace: '' }
  ]);
});

console.log("Karma scrubbing complete!");
