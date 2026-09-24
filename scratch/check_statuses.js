const fs = require('fs');
const path = require('path');

const targets = [
  'app.js',
  'api/db.js',
  'api/reports.js',
  'api/claims.js',
  'api/matcher.js',
  'api/sync.js'
];

const checkTerms = [
  'Looking',
  'Possible Match',
  'Active',
  'Pending',
  'Under Verification',
  'Claim Approved',
  'Verified',
  'Returned',
  'Recovered',
  'Closed',
  'Expired'
];

targets.forEach(relPath => {
  const fullPath = path.resolve(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');

  console.log(`\n=== File: ${relPath} ===`);
  lines.forEach((line, idx) => {
    checkTerms.forEach(term => {
      if (line.includes(`'${term}'`) || line.includes(`"${term}"`)) {
        console.log(`Line ${idx + 1} [${term}]: ${line.trim()}`);
      }
    });
  });
});
