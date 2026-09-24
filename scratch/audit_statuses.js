const fs = require('fs');
const path = require('path');

const files = ['app.js', 'api/reports.js', 'api/db.js', 'api/matcher.js', 'api/claims.js', 'api/sync.js'];
const targetStatuses = [
  'Looking', 'Possible Match', 'Active', 'Pending', 
  'Under Verification', 'Claim Approved', 'Verified', 
  'Returned', 'Recovered', 'Closed', 'Expired'
];

console.log('--- AUDITING STATUS STRINGS ACROSS FILES ---');
files.forEach(file => {
  const filePath = path.resolve(__dirname, '..', file);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    targetStatuses.forEach(st => {
      if (line.includes(`'${st}'`) || line.includes(`"${st}"`)) {
        console.log(`${file}:${idx + 1} [${st}]: ${line.trim()}`);
      }
    });
  });
});
console.log('--- AUDIT COMPLETE ---');
