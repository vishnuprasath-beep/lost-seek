const https = require('https');

const data = JSON.stringify({
  role: 'student',
  username: 'student@campus.edu',
  password: 'StudentPass2026!'
});

const options = {
  hostname: 'smart-campus-pro.vercel.app',
  port: 443,
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log('Login Status Code:', res.statusCode);
  
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      if (json.user) {
        console.log('Login Success. Has token?', !!json.user.token);
        if (json.user.token) {
          console.log('Token length:', json.user.token.length);
          testReportCreation(json.user.token);
        }
      } else {
        console.log('No user object returned!', json);
      }
    } catch (e) {
      console.log('Failed to parse JSON. Raw body:', body.slice(0, 500));
    }
  });
});

req.on('error', error => console.error(error));
req.write(data);
req.end();

function testReportCreation(token) {
  const reportData = JSON.stringify({
    title: 'Test Lost Item',
    itemName: 'Test Laptop',
    description: 'Testing token from test script',
    type: 'LOST',
    status: 'Active'
  });

  const reqOptions = {
    hostname: 'smart-campus-pro.vercel.app',
    port: 443,
    path: '/api/reports',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': reportData.length,
      'Authorization': 'Bearer ' + token
    }
  };

  const req2 = https.request(reqOptions, (res2) => {
    console.log('Report POST Status Code:', res2.statusCode);
    let body2 = '';
    res2.on('data', d => body2 += d);
    res2.on('end', () => {
      console.log('Report POST response:', body2.slice(0, 300));
    });
  });
  req2.write(reportData);
  req2.end();
}
