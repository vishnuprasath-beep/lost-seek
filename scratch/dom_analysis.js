const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Find all elements using a very basic regex
const sections = html.split('<section');
let total = 0;
sections.forEach(sec => {
  const match = sec.match(/id="([^"]+)"/);
  const id = match ? match[1] : 'unknown';
  const tagCount = (sec.match(/<[a-z]+/gi) || []).length;
  console.log(`Section ${id}: ${tagCount} tags`);
  total += tagCount;
});
console.log(`Total tags (rough): ${total}`);

const modals = html.split('<div class="modal-overlay"');
let modalTotal = 0;
modals.slice(1).forEach(m => {
  const match = m.match(/id="([^"]+)"/);
  const id = match ? match[1] : 'unknown';
  const count = (m.match(/<[a-z]+/gi) || []).length;
  console.log(`Modal ${id}: ${count} tags`);
  modalTotal += count;
});
console.log(`Total Modal tags: ${modalTotal}`);
