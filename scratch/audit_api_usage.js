const fs = require('fs');

const files = ['app.js', 'index.html'];
const apiCalls = new Set();

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.matchAll(/\/api\/[a-zA-Z0-9_\-]+/g);
  for (const m of matches) {
    apiCalls.add(m[0]);
  }
});

console.log('Client-side /api calls:');
console.log(Array.from(apiCalls).sort());
