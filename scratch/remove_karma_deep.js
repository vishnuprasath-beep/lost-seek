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

replaceInFile('public/src/6_navigation___routing__spa_.js', [
  { type: 'regex', search: /updateKarmaDisplay\(\);/g, replace: '' }
]);

replaceInFile('public/src/5_auth___login_logic.js', [
  { type: 'regex', search: /updateKarmaDisplay\(\);/g, replace: '' }
]);

replaceInFile('public/src/27_profile___settings_views.js', [
  { type: 'regex', search: /const karma = appState\.karma \|\| 50;/g, replace: '' },
  { type: 'regex', search: /<div class="stat-card">[\s\S]*?<span class="stat-card-title">Campus Karma<\/span>[\s\S]*?<\/div>/g, replace: '' }
]);

replaceInFile('public/src/24_admin__students__directory.js', [
  { type: 'regex', search: /karma:\s*\d+,/g, replace: '' },
  { type: 'regex', search: /<th[^>]*>Karma<\/th>/g, replace: '' },
  { type: 'regex', search: /<td data-label="Karma">[\s\S]*?<\/td>/g, replace: '' }
]);

replaceInFile('public/src/18_gamification_system__karma___badges_.js', [
  { type: 'regex', search: /function updateKarmaDisplay[\s\S]*?\}\s*\}$/m, replace: 'function updateKarmaDisplay() { /* removed */ }' }
]);

// Wait, the regex for updateKarmaDisplay might fail. Let's just make the whole gamification file empty
fs.writeFileSync(path.join(rootDir, 'public/src/18_gamification_system__karma___badges_.js'), 
  'function addKarma() {}\nfunction updateKarmaDisplay() {}\nfunction getBadgeForKarma() { return ""; }\n');
