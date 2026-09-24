const fs = require('fs');

const js = fs.readFileSync('app.js', 'utf8');
const lines = js.split('\n');

lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('pdf') || line.toLowerCase().includes('director')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
