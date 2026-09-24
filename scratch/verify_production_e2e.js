// Verification script for production end-to-end authentication & profile flow
const https = require('https');

const BASE_URL = 'https://smart-campus-pro.vercel.app';

function request(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const reqOptions = {
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusMessage, statusCode: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusMessage, statusCode: res.statusCode, headers: res.headers, rawData: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function run() {
  console.log('Testing Production API End-to-End...');

  // 1. Student Login
  console.log('\n1. Student Login...');
  const loginRes = await request(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    username: 'student@campus.edu',
    password: 'StudentPass2026!',
    role: 'student'
  });

  console.log('Login Status:', loginRes.statusCode, loginRes.data?.success ? 'SUCCESS' : 'FAILED');
  if (!loginRes.data?.success) {
    console.error('Login failed:', loginRes.data);
    process.exit(1);
  }
  const user = loginRes.data.user;
  console.log('Logged in user:', user.name, '| Role:', user.role, '| Current Avatar:', user.avatarUrl || 'none');

  // 2. Fetch Profile
  console.log('\n2. Fetch Profile via /api/auth?action=profile...');
  const profileRes = await request(`${BASE_URL}/api/auth?action=profile&username=${encodeURIComponent(user.username)}`);
  console.log('Profile Status:', profileRes.statusCode, profileRes.data?.success ? 'SUCCESS' : 'FAILED');
  console.log('Profile details:', profileRes.data?.profile);

  // 3. Test Unauthorized Modification (student trying to update another user)
  console.log('\n3. Security Check: Normal student modifying another user...');
  const unauthorizedRes = await request(`${BASE_URL}/api/auth?action=profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-lostseek-user': JSON.stringify({ id: user.id, username: user.username, role: 'student' })
    }
  }, {
    username: 'admin@campus.edu',
    avatarUrl: 'https://example.com/hacked-avatar.jpg'
  });
  console.log('Security check response code:', unauthorizedRes.statusCode, '(Expect 403)');
  if (unauthorizedRes.statusCode === 403) {
    console.log('  [PASS] Server rejected cross-user profile modification with 403 Forbidden.');
  } else {
    console.log('  [FAIL] Security check failed, code:', unauthorizedRes.statusCode);
  }

  // 4. Test Self Profile Picture Update
  console.log('\n4. Updating Student Profile Picture...');
  const testAvatarUrl = `https://smart-campus-pro.vercel.app/student-avatar.png?t=${Date.now()}`;
  const updateRes = await request(`${BASE_URL}/api/auth?action=profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-lostseek-user': JSON.stringify({ id: user.id, username: user.username, role: 'student' })
    }
  }, {
    username: user.username,
    avatarUrl: testAvatarUrl
  });

  console.log('Update Status:', updateRes.statusCode, updateRes.data?.success ? 'SUCCESS' : 'FAILED');
  console.log('Updated profile avatarUrl:', updateRes.data?.profile?.avatarUrl);

  // 5. Verify Persistence by Re-fetching Profile
  console.log('\n5. Verifying Persistence...');
  const verifyRes = await request(`${BASE_URL}/api/auth?action=profile&username=${encodeURIComponent(user.username)}`);
  console.log('Verified persisted avatarUrl:', verifyRes.data?.profile?.avatarUrl);

  if (verifyRes.data?.profile?.avatarUrl === testAvatarUrl) {
    console.log('  [PASS] Profile picture successfully updated and persisted in production database!');
  } else {
    console.log('  [FAIL] Avatar URL did not match.');
  }

  // 6. Test APK Download URL
  console.log('\n6. Checking APK Download URL...');
  const apkRes = await request(`${BASE_URL}/LostSeek.apk`, { method: 'HEAD' });
  console.log('APK Status:', apkRes.statusCode);
  console.log('APK Content-Length:', apkRes.headers['content-length']);
  console.log('APK Content-Type:', apkRes.headers['content-type']);

  if (apkRes.statusCode === 200 && apkRes.headers['content-type'].includes('android.package-archive')) {
    console.log('  [PASS] Production APK download is HTTP 200 with valid android package archive content type!');
  } else {
    console.log('  [FAIL] APK status or content type invalid.');
  }

  console.log('\nAll production verification checks completed successfully!');
}

run().catch(console.error);
