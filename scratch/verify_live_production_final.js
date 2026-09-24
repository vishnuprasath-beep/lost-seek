/**
 * Live Production Verification Script
 */

const https = require('https');

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, data });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runLiveVerification() {
  console.log('========================================================');
  console.log('LIVE VERCEL PRODUCTION DEPLOYMENT CHECKS');
  console.log('========================================================\n');

  // 1. Google Verification HTML
  console.log('1. Checking Google Search Console verification file...');
  const gRes = await fetchUrl('https://smart-campus-pro.vercel.app/googled552e0cbc66fc7ac.html');
  console.log(`HTTP Status: ${gRes.statusCode}`);
  console.log(`Content: ${gRes.data.trim()}`);
  if (gRes.statusCode === 200 && gRes.data.includes('google-site-verification: googled552e0cbc66fc7ac.html')) {
    console.log('✓ Google Search Console verification file is intact and returns 200 OK.\n');
  } else {
    throw new Error('Google Search Console verification failed!');
  }

  // 2. Web landing page
  console.log('2. Checking root landing page...');
  const rootRes = await fetchUrl('https://smart-campus-pro.vercel.app/');
  console.log(`HTTP Status: ${rootRes.statusCode}`);
  if (rootRes.statusCode === 200 && rootRes.data.includes('id="landing-page"')) {
    console.log('✓ Root returns 200 OK and serves public landing page.\n');
  } else {
    throw new Error('Root landing page verification failed!');
  }

  // 3. Download page
  console.log('3. Checking /download page for Version 2.4.0...');
  const dlRes = await fetchUrl('https://smart-campus-pro.vercel.app/download');
  console.log(`HTTP Status: ${dlRes.statusCode}`);
  if (dlRes.statusCode === 200 && dlRes.data.includes('Version 2.4.0')) {
    console.log('✓ /download page returns 200 OK and displays Version 2.4.0.\n');
  } else {
    throw new Error('/download page verification failed!');
  }

  // 4. LostSeek.apk binary
  console.log('4. Checking /LostSeek.apk production binary download...');
  const apkRes = await fetchUrl('https://smart-campus-pro.vercel.app/LostSeek.apk', { method: 'HEAD' });
  console.log(`HTTP Status: ${apkRes.statusCode}`);
  console.log(`Content-Type: ${apkRes.headers['content-type']}`);
  console.log(`Content-Length: ${apkRes.headers['content-length']} bytes`);
  if (apkRes.statusCode === 200 && Number(apkRes.headers['content-length']) > 4000000) {
    console.log('✓ Production LostSeek.apk returns 200 OK with valid binary size (>4MB).\n');
  } else {
    throw new Error('LostSeek.apk verification failed!');
  }

  // 5. Live API /api/auth?action=login
  console.log('5. Checking live login endpoint...');
  const loginRes = await fetchUrl('https://smart-campus-pro.vercel.app/api/auth?action=login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { username: 'student', password: 'student123', role: 'student' }
  });
  console.log(`HTTP Status: ${loginRes.statusCode}`);
  const loginBody = JSON.parse(loginRes.data);
  console.log('User returned:', loginBody.user ? { name: loginBody.user.name, avatarUrl: loginBody.user.avatarUrl } : loginBody);
  if (loginRes.statusCode === 200 && loginBody.success && loginBody.user && loginBody.user.avatarUrl) {
    console.log('✓ Live login successful and returns authoritative user avatarUrl.\n');
  } else {
    throw new Error('Live login verification failed!');
  }

  // 6. Live API /api/sync
  console.log('6. Checking live /api/sync endpoint...');
  const syncRes = await fetchUrl('https://smart-campus-pro.vercel.app/api/sync', {
    method: 'GET',
    headers: {
      'x-lostseek-user': encodeURIComponent(JSON.stringify(loginBody.user))
    }
  });
  console.log(`HTTP Status: ${syncRes.statusCode}`);
  const syncBody = JSON.parse(syncRes.data);
  console.log(`Synced: ${syncBody.lostReports ? syncBody.lostReports.length : 0} lost, ${syncBody.foundReports ? syncBody.foundReports.length : 0} found`);
  if (syncRes.statusCode === 200 && syncBody.success && syncBody.user && syncBody.user.avatarUrl) {
    console.log(`✓ Live sync successful with user avatarUrl: ${syncBody.user.avatarUrl}\n`);
  } else {
    throw new Error('Live sync verification failed!');
  }

  console.log('========================================================');
  console.log('ALL LIVE PRODUCTION CHECKS COMPLETED SUCCESSFULLY!');
  console.log('========================================================');
}

runLiveVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
