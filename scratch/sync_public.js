const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy index.html to 200.html for SPA routing
fs.copyFileSync(path.join(root, 'index.html'), path.join(root, '200.html'));
console.log('Synced index.html -> 200.html');

const files = [
  'index.html',
  '200.html',
  'styles.css',
  'app.js',
  'lostseek-logo.png',
  'student-avatar.png',
  'admin-avatar.png'
];

files.forEach(file => {
  const src = path.join(root, file);
  const dest = path.join(publicDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Synced ${file} -> public/${file}`);
  }
});

// Also ensure assets/ directory in root is synced to public/assets
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const rootAssets = path.join(root, 'assets');
const publicAssets = path.join(publicDir, 'assets');
if (fs.existsSync(rootAssets)) {
  copyDirRecursive(rootAssets, publicAssets);
  console.log('Synced assets/ -> public/assets/');
}

console.log('Sync to public/ complete!');
