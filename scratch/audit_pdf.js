const fs = require('fs');

const js = fs.readFileSync('app.js', 'utf8');
const lines = js.split('\n');

lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('pdf')) {
    console.log(`PDF -> ${idx + 1}: ${line.trim()}`);
  }
});
