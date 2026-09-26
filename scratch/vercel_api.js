const fs = require('fs');
const path = require('path');
const https = require('https');

const paths = [
  path.join(process.env.APPDATA || '', 'vercel', 'auth.json'),
  path.join(process.env.LOCALAPPDATA || '', 'vercel', 'auth.json'),
  path.join(require('os').homedir(), '.local', 'share', 'com.vercel.cli', 'auth.json')
];

let token = null;
for (const p of paths) {
  try {
    if (fs.existsSync(p)) {
      const auth = JSON.parse(fs.readFileSync(p, 'utf8'));
      token = auth.token;
      break;
    }
  } catch(e) {}
}

if (!token) {
  console.log('No token found');
  process.exit(1);
}
console.log('Token found!');

const req = https.request('https://api.vercel.com/v9/projects', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const json = JSON.parse(data);
    if(json.projects) {
      json.projects.forEach(p => console.log(p.name, p.id));
    }
  });
});
req.end();
