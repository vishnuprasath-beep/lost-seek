import https from 'https';

const PROD_URL = 'https://smart-campus-pro.vercel.app';

function testLogin(payload) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const req = https.request(`${PROD_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });
    req.on('error', err => resolve({ error: err.message }));
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('Testing production login...');

  const tests = [
    { label: 'Student default email', payload: { username: 'student@campus.edu', password: 'student123', role: 'student' } },
    { label: 'Student short username', payload: { username: 'student', password: 'student123', role: 'student' } },
    { label: 'Admin default email', payload: { username: 'admin@campus.edu', password: 'admin123', role: 'admin' } },
    { label: 'Student vishnu.prasath', payload: { username: 'vishnu.prasath', password: 'student123', role: 'student' } },
    { label: 'Student vishnu.prasath@campus.edu', payload: { username: 'vishnu.prasath@campus.edu', password: 'student123', role: 'student' } }
  ];

  for (const t of tests) {
    const res = await testLogin(t.payload);
    console.log(`\n[${t.label}]: Status: ${res.status}`);
    console.log(`Content-Type: ${res.headers ? res.headers['content-type'] : 'none'}`);
    console.log(`Body: ${res.body}`);
  }
}

run();
