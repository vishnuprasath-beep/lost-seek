const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

console.log('Total HTML lines:', lines.length);

const terms = ['student-nav-sections', 'admin-nav-sections', 'lost-location', 'found-location', 'ifound-location', 'find-filter-location', 'admin-filter-location', 'admin-photo-location', 'admin-contact-help-modal', 'page-section'];

terms.forEach(term => {
  const matches = [];
  lines.forEach((l, i) => {
    if (l.includes(term)) matches.push(i + 1);
  });
  console.log(`Term "${term}": ${matches.length} matches. Lines:`, matches.slice(0, 10));
});
