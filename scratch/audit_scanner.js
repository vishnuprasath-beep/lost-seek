const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');

console.log('--- AUDIT CHECK ---');
console.log('index.html length:', html.length);
console.log('app.js length:', js.length);

const targets = [
  'analytics-page',
  'chart-categories',
  'an-total-reports',
  'issues',
  'pdf',
  'supervisor',
  'director',
  'admin-help-page',
  'help-safety-page'
];

targets.forEach(t => {
  console.log(`Searching for "${t}":`);
  console.log(`  in index.html: ${html.toLowerCase().includes(t.toLowerCase())}`);
  console.log(`  in app.js: ${js.toLowerCase().includes(t.toLowerCase())}`);
});
