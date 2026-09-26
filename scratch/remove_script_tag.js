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
    
    // Remove the gamification script tag
    content = content.replace(/<script src="[^"]*18_gamification_system__karma___badges_\.js"><\/script>\n?/g, '');
    
    fs.writeFileSync(p, content);
  }
});
console.log("Removed gamification script tags from HTML.");
