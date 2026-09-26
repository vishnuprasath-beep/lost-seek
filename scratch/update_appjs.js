const fs = require('fs');

let js = fs.readFileSync('app.js', 'utf8');

const ensureCode = `
let _modalsLoaded = false;
function ensureModalsLoaded() {
  if (_modalsLoaded) return;
  const tmpl = document.getElementById('lazy-modals-template');
  if (tmpl) {
    document.body.appendChild(tmpl.content.cloneNode(true));
    tmpl.remove();
    _modalsLoaded = true;
    if (window.lucide) window.lucide.createIcons();
  }
}

let _adminLoaded = false;
function ensureAdminLoaded() {
  if (_adminLoaded) return;
  const tmpl = document.getElementById('lazy-admin-template');
  if (tmpl) {
    // Inject it into main wrapper where it belongs
    const mainWrapper = document.querySelector('main') || document.querySelector('.main-wrapper') || document.body;
    mainWrapper.appendChild(tmpl.content.cloneNode(true));
    tmpl.remove();
    _adminLoaded = true;
    if (window.lucide) window.lucide.createIcons();
  }
}
`;
js = ensureCode + js;

// Prepend to all open*Modal functions
js = js.replace(/(function open[A-Za-z]+Modal\([^)]*\)\s*\{)/g, '$1\n  ensureModalsLoaded();');

// Inject ensureAdminLoaded into showPage
js = js.replace(/(function showPage\(pageId\)\s*\{)/, '$1\n  if (pageId.startsWith("admin-")) ensureAdminLoaded();\n');

fs.writeFileSync('app.js', js);
fs.writeFileSync('public/app.js', js);
console.log('Optimized app.js');

// Also update public/src/0_core.js and public/src/6_navigation___routing__spa_.js if they exist
try {
  let corePath = 'public/src/0_core.js';
  if (fs.existsSync(corePath)) {
     let core = fs.readFileSync(corePath, 'utf8');
     if (!core.includes('ensureModalsLoaded')) {
       core = ensureCode + core;
       fs.writeFileSync(corePath, core);
     }
  }
  let navPath = 'public/src/6_navigation___routing__spa_.js';
  if (fs.existsSync(navPath)) {
      let nav = fs.readFileSync(navPath, 'utf8');
      nav = nav.replace(/(function showPage\(pageId\)\s*\{)/, '$1\n  if (pageId.startsWith("admin-")) ensureAdminLoaded();\n');
      fs.writeFileSync(navPath, nav);
  }
  
  let srcJsFiles = fs.readdirSync('public/src');
  srcJsFiles.forEach(file => {
    let content = fs.readFileSync('public/src/' + file, 'utf8');
    let changed = false;
    if (content.match(/(function open[A-Za-z]+Modal\([^)]*\)\s*\{)/)) {
      content = content.replace(/(function open[A-Za-z]+Modal\([^)]*\)\s*\{)/g, '$1\n  ensureModalsLoaded();');
      changed = true;
    }
    if (changed) {
      fs.writeFileSync('public/src/' + file, content);
    }
  });

} catch(e) {
  console.log('Error updating public/src:', e.message);
}

try {
  require('child_process').execSync('node build.js');
  console.log('Rebuilt app.js');
} catch(e) {}
