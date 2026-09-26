const fs = require('fs');

function optimizeIndex() {
  let html = fs.readFileSync('index.html', 'utf8');

  // 1. Replace unpkg lucide with local
  html = html.replace('https://unpkg.com/lucide@latest', 'assets/lucide.min.js');

  // 2. Fix heading level
  html = html.replace('<h4>Better Together</h4>', '<h3>Better Together</h3>');

  // 3. Lazy load for images below fold (the ones missing it)
  // line 589
  html = html.replace(/<img src="assets\/images\/lostseek-logo\.png" alt="LostSeek" style="width: 30px; height: 30px; border-radius: 8px;" width="30" height="30"  decoding="async" \/>/,
    '<img src="assets/images/lostseek-logo.png" alt="LostSeek" style="width: 30px; height: 30px; border-radius: 8px;" width="30" height="30" loading="lazy" decoding="async" />');

  // 4. Extract Modals
  const modalStartIdx = html.indexOf('<!-- =========================================================================\n       3. CLAIM VERIFICATION MODAL');
  const modalEndIdx = html.indexOf('</body>');

  if (modalStartIdx !== -1 && modalEndIdx !== -1) {
    const modalsContent = html.substring(modalStartIdx, modalEndIdx);
    html = html.substring(0, modalStartIdx) + '<template id="lazy-modals-template">\n' + modalsContent + '\n</template>\n' + html.substring(modalEndIdx);
  }

  fs.writeFileSync('index.html', html);
  fs.writeFileSync('public/index.html', html);
  console.log('Optimized index.html');
}

function optimizeDownload() {
  let html = fs.readFileSync('download.html', 'utf8');
  html = html.replace('https://unpkg.com/lucide@latest', 'assets/lucide.min.js');
  fs.writeFileSync('download.html', html);
  fs.writeFileSync('public/download.html', html);
  console.log('Optimized download.html');
}

function optimizeCss() {
  let css = fs.readFileSync('styles.css', 'utf8');
  // Fix contrast: Light theme text-muted #94A3B8 -> #64748B
  css = css.replace(/--text-muted:\s*#94A3B8;/g, '--text-muted: #64748B;');
  
  // Actually, wait, the light theme text-muted is at line 96. Let's make sure it's under [data-theme="light"]
  // I will just replace the exact line 96.
  let lines = css.split('\n');
  let inLight = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('[data-theme="light"]')) inLight = true;
    if (inLight && lines[i].includes('--text-muted: #94A3B8;')) {
      lines[i] = lines[i].replace('#94A3B8', '#64748B');
      break;
    }
  }
  fs.writeFileSync('styles.css', lines.join('\n'));
  fs.writeFileSync('public/styles.css', lines.join('\n'));
  console.log('Optimized styles.css');
}

function optimizeAppJs() {
  let js = fs.readFileSync('app.js', 'utf8');

  // Inject ensureModalsLoaded at the top
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
`;
  js = ensureCode + js;

  // Prepend to all open*Modal functions
  js = js.replace(/(function open[A-Za-z]+Modal\([^)]*\)\s*\{)/g, '$1\n  ensureModalsLoaded();');
  
  fs.writeFileSync('app.js', js);
  fs.writeFileSync('public/app.js', js);
  console.log('Optimized app.js');
}

optimizeIndex();
optimizeDownload();
optimizeCss();
optimizeAppJs();

// Note: we should also update public/src/ versions if they exist
try {
  let srcJsFiles = fs.readdirSync('public/src');
  srcJsFiles.forEach(file => {
    let content = fs.readFileSync('public/src/' + file, 'utf8');
    let changed = false;
    if (content.match(/(function open[A-Za-z]+Modal\([^)]*\)\s*\{)/)) {
      content = content.replace(/(function open[A-Za-z]+Modal\([^)]*\)\s*\{)/g, '$1\n  ensureModalsLoaded();');
      changed = true;
    }
    // we also inject ensureModalsLoaded into 0_core or something, but let's just do it in build.js instead, or just in app.js
    if (changed) {
      fs.writeFileSync('public/src/' + file, content);
    }
  });
  
  let corePath = 'public/src/0_core.js';
  if (fs.existsSync(corePath)) {
     let core = fs.readFileSync(corePath, 'utf8');
     if (!core.includes('ensureModalsLoaded')) {
       core = `
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
}\n` + core;
       fs.writeFileSync(corePath, core);
     }
  }
  console.log('Optimized public/src/*.js');
} catch(e) {
  console.log('No public/src/ found or error:', e.message);
}

// Re-run build.js to ensure everything is synced
try {
  require('child_process').execSync('node build.js');
  console.log('Rebuilt app.js');
} catch(e) {}
