const https = require('https');

const BASE_URL = 'https://smart-campus-pro.vercel.app';

// 1x1 transparent png
const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const postData = JSON.stringify({
  image: sampleBase64,
  filename: 'test_image.png',
  reportType: 'FOUND'
});

const url = new URL('/api/upload', BASE_URL);
const req = https.request(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Upload status:', res.statusCode);
    console.log('Response body:', body);
  });
});

req.on('error', (e) => console.error(e));
req.write(postData);
req.end();
