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
  'scratch/build_manage_pages.js'
];

htmlFiles.forEach(relPath => {
  const p = path.join(rootDir, relPath);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    
    // Remove the button with resetHackathonDemoData
    content = content.replace(/<button[^>]*resetHackathonDemoData[^>]*>[\s\S]*?<\/button>/g, '');
    
    fs.writeFileSync(p, content);
  }
});
console.log("Removed reset buttons.");
