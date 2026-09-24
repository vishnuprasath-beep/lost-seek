const authHandler = require('../api/auth.js');
const verifyHandler = require('../api/verify.js');

function mockRequest(method, urlStr, body = {}) {
  let resStatus = 200;
  let resHeaders = {};
  let resBody = '';

  const req = {
    method,
    url: urlStr,
    headers: { 'content-type': 'application/json' },
    body
  };

  const res = {
    setHeader: (k, v) => { resHeaders[k.toLowerCase()] = v; },
    status: (code) => {
      resStatus = code;
      return res;
    },
    json: (obj) => {
      resBody = JSON.stringify(obj);
      return res;
    },
    end: (str) => {
      if (str) resBody = str;
      return res;
    }
  };

  return {
    req,
    res,
    run: async (handler) => {
      await handler(req, res);
      return {
        status: resStatus,
        headers: resHeaders,
        body: resBody ? JSON.parse(resBody) : null
      };
    }
  };
}

async function runTests() {
  console.log('=== RUNNING LOCAL AUTHENTICATION TEST SUITE ===');

  const testCases = [
    // 1. Existing Student
    { name: 'Student (email, StudentPass2026!)', role: 'student', user: 'student@campus.edu', pass: 'StudentPass2026!', expectedStatus: 200 },
    { name: 'Student (email, student123)', role: 'student', user: 'student@campus.edu', pass: 'student123', expectedStatus: 200 },
    { name: 'Student (short username)', role: 'student', user: 'student', pass: 'StudentPass2026!', expectedStatus: 200 },
    
    // 2. Existing Admin
    { name: 'Admin (email, AdminPass2026!)', role: 'admin', user: 'admin@campus.edu', pass: 'AdminPass2026!', expectedStatus: 200 },
    { name: 'Admin (email, admin123)', role: 'admin', user: 'admin@campus.edu', pass: 'admin123', expectedStatus: 200 },
    { name: 'Admin (short username)', role: 'admin', user: 'admin', pass: 'AdminPass2026!', expectedStatus: 200 },

    // 3. Registered Student (vishnu.prasath)
    { name: 'Vishnu Prasath (username, VP73#Kmp9s)', role: 'student', user: 'vishnu.prasath', pass: 'VP73#Kmp9s', expectedStatus: 200 },
    { name: 'Vishnu Prasath (email, VP73#Kmp9s)', role: 'student', user: 'vishnu.prasath@campus.edu', pass: 'VP73#Kmp9s', expectedStatus: 200 },
    { name: 'Vishnu Prasath (fallback student123)', role: 'student', user: 'vishnu.prasath', pass: 'student123', expectedStatus: 200 },

    // 4. Role Isolation
    { name: 'Security: Student logging into Admin portal', role: 'admin', user: 'student@campus.edu', pass: 'StudentPass2026!', expectedStatus: 401 },
    { name: 'Security: Admin logging into Student portal', role: 'student', user: 'admin@campus.edu', pass: 'AdminPass2026!', expectedStatus: 401 },
    { name: 'Security: Vishnu logging into Admin portal', role: 'admin', user: 'vishnu.prasath', pass: 'VP73#Kmp9s', expectedStatus: 401 },

    // 5. Bad Credentials
    { name: 'Security: Invalid password rejected', role: 'student', user: 'student@campus.edu', pass: 'WrongPass!', expectedStatus: 401 },
    { name: 'Security: Unknown username rejected', role: 'student', user: 'nonexistent@campus.edu', pass: 'StudentPass2026!', expectedStatus: 401 }
  ];

  let passed = 0;
  for (const tc of testCases) {
    const mock = mockRequest('POST', '/api/auth?action=login', {
      role: tc.role,
      username: tc.user,
      password: tc.pass
    });
    const result = await mock.run(authHandler);
    const ok = result.status === tc.expectedStatus;
    if (ok) {
      console.log(`✓ [PASS] ${tc.name} -> Status ${result.status} (User: ${result.body?.user?.name || 'none'})`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${tc.name} -> Expected ${tc.expectedStatus}, got ${result.status}`, result.body);
    }
  }

  // 6. Test Verification Route with 'lost'
  console.log('\n=== TESTING VERIFICATION ROUTE WITH LITERAL ID: lost ===');
  const mockLost = mockRequest('GET', '/api/verify?id=lost');
  const resLost = await mockLost.run(verifyHandler);
  console.log('Verification with id=lost: Status =', resLost.status, 'Body =', resLost.body);
  if (resLost.status === 400 && resLost.body.error === 'InvalidReportId') {
    console.log('✓ [PASS] Literal "lost" correctly rejected with 400 Bad Request');
    passed++;
  } else {
    console.error('✗ [FAIL] Literal "lost" was not rejected as 400');
  }

  // 7. Test Verification Route without ID
  const mockEmpty = mockRequest('GET', '/api/verify');
  const resEmpty = await mockEmpty.run(verifyHandler);
  console.log('Verification with no id: Status =', resEmpty.status);
  if (resEmpty.status === 400) {
    console.log('✓ [PASS] Empty ID correctly rejected with 400 Bad Request');
    passed++;
  }

  console.log(`\nLocal Auth Suite Completed: ${passed}/${testCases.length + 2} Passed.`);
}

runTests().catch(console.error);
