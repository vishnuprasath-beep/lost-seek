const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\Users\\prakash c\\Desktop\\smart campus-pro';

const htmlFiles = [
  'public/index.html',
  'public/story.html',
  'public/200.html',
  'index.html',
  'story.html',
  '200.html'
];

htmlFiles.forEach(relPath => {
  const p = path.join(rootDir, relPath);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    
    // Remove Karma text in description
    content = content.replace(/and karma standings\./g, 'and claim history.');
    
    // Remove Karma <th>
    content = content.replace(/<th>Karma<\/th>/g, '');
    
    // Remove Karma pill
    content = content.replace(/<!-- Karma Counter Pill -->[\s\S]*?<div class="karma-header-pill"[\s\S]*?<\/div>\s*<\/div>/g, '');
    // Or more specifically:
    content = content.replace(/<!-- Karma Counter Pill -->\s*<div class="karma-header-pill"[^>]*>[\s\S]*?<\/div>\s*<\/div>/g, ''); // Ensure closing tags match

    fs.writeFileSync(p, content);
  }
});
console.log("HTML Karma text scrubbed.");
