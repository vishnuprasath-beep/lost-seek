const authHandler = require('../api/auth.js');
const http = require('http');

const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    req.body = body;
    authHandler(req, res);
  });
});

server.listen(3000, () => {
  const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, (res) => {
    console.log('Status:', res.statusCode);
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
      console.log('Response:', data);
      process.exit(0);
    });
  });
  
  req.write(JSON.stringify({
    role: 'student',
    username: 'student@campus.edu',
    password: 'StudentPass2026!'
  }));
  req.end();
});
