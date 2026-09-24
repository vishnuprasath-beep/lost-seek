const fs = require('fs');
['public/index.html', 'index.html'].forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/loading="lazy"/g, '');
  fs.writeFileSync(f, c);
});
console.log('Removed loading=lazy');
