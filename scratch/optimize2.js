const fs = require('fs');

function optimizeIndex() {
  let html = fs.readFileSync('index.html', 'utf8');

  // 1. Replace unpkg lucide with local
  html = html.replace('https://unpkg.com/lucide@latest', 'assets/lucide.min.js');

  // 2. Fix heading level
  html = html.replace('<h4>Better Together</h4>', '<h3>Better Together</h3>');

  // 3. Lazy load for images below fold
  html = html.replace(/<img src="assets\/images\/lostseek-logo\.png" alt="LostSeek" style="width: 30px; height: 30px; border-radius: 8px;" width="30" height="30"  decoding="async" \/>/,
    '<img src="assets/images/lostseek-logo.png" alt="LostSeek" style="width: 30px; height: 30px; border-radius: 8px;" width="30" height="30" loading="lazy" decoding="async" />');

  // 4. Extract Modals
  const modalStartIdx = html.indexOf('<!-- =========================================================================\n       3. CLAIM VERIFICATION MODAL');
  const modalEndIdx = html.indexOf('</body>');

  if (modalStartIdx !== -1 && modalEndIdx !== -1) {
    const modalsContent = html.substring(modalStartIdx, modalEndIdx);
    html = html.substring(0, modalStartIdx) + '<template id="lazy-modals-template">\n' + modalsContent + '\n</template>\n' + html.substring(modalEndIdx);
  }

  // 5. Extract Admin pages to reduce DOM
  const adminSectionsRegex = /<section id="admin-[a-z-]+-page"[^>]*>[\s\S]*?<\/section>/g;
  let adminMatches = [];
  let match;
  while ((match = adminSectionsRegex.exec(html)) !== null) {
      adminMatches.push(match[0]);
  }
  
  if (adminMatches.length > 0) {
      // Remove them from HTML
      html = html.replace(adminSectionsRegex, '');
      
      // Inject them as a template at the end of app-layout
      const appLayoutEndIdx = html.indexOf('</div>\n\n  <!-- =========================================================================\n       3. CLAIM VERIFICATION MODAL');
      // Actually let's just put it right before </main> or </div> <!-- End main wrapper -->
      const mainEnd = html.indexOf('</main>');
      if (mainEnd !== -1) {
          const adminTemplate = '<template id="lazy-admin-template">\n' + adminMatches.join('\n') + '\n</template>\n';
          html = html.substring(0, mainEnd) + adminTemplate + html.substring(mainEnd);
      }
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

optimizeIndex();
optimizeDownload();
optimizeCss();

// Re-run build.js to ensure everything is synced
try {
  require('child_process').execSync('node build.js');
  console.log('Rebuilt app.js');
} catch(e) {}
