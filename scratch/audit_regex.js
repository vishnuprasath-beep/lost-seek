const fs = require('fs');

const js = fs.readFileSync('app.js', 'utf8');
const lines = js.split('\n');

const keywords = ['pdf', 'supervisor', 'director', 'issues'];

keywords.forEach(kw => {
  console.log(`\n=== Matches for "${kw}" (word boundary) in app.js ===`);
  const regex = new RegExp(`\\b${kw}\\b`, 'i');
  lines.forEach((l, idx) => {
    if (regex.test(l)) {
      console.log(`${idx + 1}: ${l.trim()}`);
    }
  });
});
