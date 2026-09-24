const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');
const matches = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)];
let missing = false;
matches.forEach(m => {
  if (m[1].includes('manga-page-')) {
    const p = 'public/' + m[1].split('?')[0];
    if (!fs.existsSync(p)) {
      console.log('MISSING: ' + p);
      missing = true;
    } else {
      console.log('FOUND: ' + p + ' (' + fs.statSync(p).size + ' bytes)');
    }
  }
});
if (!missing) console.log('ALL IMAGES VERIFIED!');
