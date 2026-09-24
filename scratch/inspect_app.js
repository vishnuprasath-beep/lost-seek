const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

const terms = ['DEFAULT_OFFICIAL_CONTACTS', 'officialContacts', 'showPage', 'renderAdmin', 'submitReport', 'generateReportReview', 'lost-location', 'findMatches'];

terms.forEach(term => {
  const matches = [];
  lines.forEach((l, i) => {
    if (l.includes(term)) matches.push(i + 1);
  });
  console.log(`Term "${term}": ${matches.length} matches. Lines:`, matches.slice(0, 10));
});
