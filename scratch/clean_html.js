const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\Users\\prakash c\\Desktop\\smart campus-pro';

const htmlFiles = [
  'public/index.html',
  'public/story.html',
  'public/200.html',
  'index.html',
  'story.html',
  '200.html',
  'scratch/build_manage_pages.js' // just in case
];

htmlFiles.forEach(relPath => {
  const p = path.join(rootDir, relPath);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    
    // Remove Reset Demo Data li element completely
    content = content.replace(/<li[^>]*>\s*<a[^>]*resetHackathonDemoData[^>]*>.*?<\/a>\s*<\/li>/g, '');
    
    // Also replace AI Match Precision with Match Results
    content = content.replace(/AI Match Precision/g, 'Match Results');
    
    fs.writeFileSync(p, content);
    console.log("Updated", relPath);
  }
});
