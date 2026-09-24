const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: body }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('--- TEST 1: GET /api/reports (initial) ---');
  let res = await request({ host: '127.0.0.1', port: 3000, path: '/api/reports', method: 'GET' });
  console.log('Status:', res.status);
  console.log('Body:', res.data);

  console.log('\n--- TEST 2: POST /api/reports (create) ---');
  const payload = JSON.stringify({
    type: 'LOST',
    itemName: 'Blue Bottle',
    description: 'Blue bottle with football sticker',
    category: 'Bottle',
    color: 'Blue',
    location: 'Library'
  });
  res = await request({
    host: '127.0.0.1', port: 3000, path: '/api/reports', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
  }, payload);
  console.log('Status:', res.status);
  console.log('Body:', res.data);

  console.log('\n--- TEST 3: GET /api/reports (after insert) ---');
  res = await request({ host: '127.0.0.1', port: 3000, path: '/api/reports', method: 'GET' });
  console.log('Status:', res.status);
  console.log('Body:', res.data);

  console.log('\n--- TEST 4: DELETE /api/reports (clear) ---');
  res = await request({ host: '127.0.0.1', port: 3000, path: '/api/reports', method: 'DELETE' });
  console.log('Status:', res.status);
  console.log('Body:', res.data);

  console.log('\n--- TEST 5: GET /api/reports (after delete) ---');
  res = await request({ host: '127.0.0.1', port: 3000, path: '/api/reports', method: 'GET' });
  console.log('Status:', res.status);
  console.log('Body:', res.data);
}

runTests().catch(err => console.error('Test error:', err));
