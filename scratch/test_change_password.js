const https = require('https');

async function testChangePassword() {
  const url = 'https://smart-campus-pro.vercel.app/api/change-password';
  
  // We will test with 'sivavaiyapuri' account, which we reset to 'student123'
  const payload = JSON.stringify({
    userId: 'usr-siva', // Wait, do I know the user ID? Let's use username.
    username: 'sivavaiyapuri',
    currentPassword: 'student123',
    newPassword: 'NewSecurePassword123!',
    confirmPassword: 'NewSecurePassword123!'
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      // Mock auth headers if needed by the app
      'x-lostseek-user': encodeURIComponent(JSON.stringify({ username: 'sivavaiyapuri', role: 'student' }))
    }
  };

  console.log(`Sending password change request to ${url}...`);

  const req = https.request(url, options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Response Body: ${data}`);
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.write(payload);
  req.end();
}

testChangePassword();
