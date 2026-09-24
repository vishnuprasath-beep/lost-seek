const fs = require('fs');

const content = fs.readFileSync('app.js', 'utf8');
const lines = content.split('\n');

console.log('--- Matching / AI Functions in app.js ---');
lines.forEach((line, idx) => {
  if (line.includes('function ') && /match|ai|score|vision|detect|embed|yolo|clip/i.test(line)) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});

console.log('\n--- Section Comments mentioning AI / Match / Vision ---');
lines.forEach((line, idx) => {
  if (line.includes('===') && /match|ai|vision|intelligence/i.test(line)) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
