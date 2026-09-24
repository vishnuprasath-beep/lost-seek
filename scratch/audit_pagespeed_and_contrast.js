const fs = require('fs');
const path = require('path');

console.log('=== AUDIT 1: RESOURCE SIZES & RENDER-BLOCKING ASSETS ===');

const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '../styles.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');

// Check head scripts
const headMatch = indexHtml.match(/<head>([\s\S]*?)<\/head>/i);
if (headMatch) {
  const headContent = headMatch[1];
  const scriptsInHead = [...headContent.matchAll(/<script[\s\S]*?>[\s\S]*?<\/script>/gi)];
  console.log(`Scripts in <head>: ${scriptsInHead.length}`);
  scriptsInHead.forEach((s, idx) => {
    console.log(`  [Head Script ${idx + 1}] ${s[0].slice(0, 120)}...`);
  });

  const linksInHead = [...headContent.matchAll(/<link[\s\S]*?>/gi)];
  console.log(`\nLinks in <head>: ${linksInHead.length}`);
  linksInHead.forEach((l, idx) => {
    console.log(`  [Head Link ${idx + 1}] ${l[0]}`);
  });
}

// Check images
const imageFiles = [
  'lostseek-logo.png',
  'student-avatar.png',
  'admin-avatar.png',
  'assets/images/lostseek-logo.png',
  'assets/images/student-avatar.png',
  'assets/images/admin-avatar.png'
];

console.log('\n=== IMAGE SIZES ===');
imageFiles.forEach(img => {
  const p = path.join(__dirname, '..', img);
  if (fs.existsSync(p)) {
    const stats = fs.statSync(p);
    console.log(`  ${img}: ${(stats.size / 1024).toFixed(1)} KB`);
  }
});

// Check total sizes of CSS and JS
console.log('\n=== FILE SIZES ===');
console.log(`  index.html: ${(indexHtml.length / 1024).toFixed(1)} KB`);
console.log(`  styles.css: ${(stylesCss.length / 1024).toFixed(1)} KB`);
console.log(`  app.js: ${(appJs.length / 1024).toFixed(1)} KB`);
