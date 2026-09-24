const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');

lines.forEach((l, i) => {
  if (l.includes('<section') || l.includes('profile-') || l.includes('login-form')) {
    if (l.includes('id=')) {
      console.log(`${i + 1}: ${l.trim()}`);
    }
  }
});
