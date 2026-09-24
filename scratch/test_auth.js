const loginHandler = require('../api/login.js');

async function testLogin(role, username, password) {
  return new Promise((resolve) => {
    const req = {
      method: 'POST',
      body: { role, username, password }
    };
    let statusCode = 200;
    const res = {
      setHeader: () => {},
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (data) => {
        resolve({ statusCode, data });
      }
    };
    loginHandler(req, res);
  });
}

async function runTests() {
  console.log('=== TESTING API/LOGIN.JS ===');

  const testCases = [
    // Existing accounts
    { desc: 'Existing Student (email)', role: 'student', user: 'student@campus.edu', pass: 'StudentPass2026!', shouldPass: true, expectedName: 'Alex Rivera' },
    { desc: 'Existing Student (username)', role: 'student', user: 'student', pass: 'StudentPass2026!', shouldPass: true, expectedName: 'Alex Rivera' },
    { desc: 'Existing Admin (email)', role: 'admin', user: 'admin@campus.edu', pass: 'AdminPass2026!', shouldPass: true, expectedName: 'Vikram Singh' },
    { desc: 'Existing Admin (username)', role: 'admin', user: 'admin', pass: 'AdminPass2026!', shouldPass: true, expectedName: 'Vikram Singh' },

    // Six new student accounts (by username)
    { desc: 'Vishnu Prasath (loginId)', role: 'student', user: 'vishnu.prasath', pass: 'VP73#Kmp9s', shouldPass: true, expectedName: 'Vishnu Prasath' },
    { desc: 'Vishnu Prasath (email)', role: 'student', user: 'vishnu.prasath@campus.edu', pass: 'VP73#Kmp9s', shouldPass: true, expectedName: 'Vishnu Prasath' },
    { desc: 'Vishnu Varthan (loginId)', role: 'student', user: 'vishnu.varthan', pass: 'VV28$Sky4m', shouldPass: true, expectedName: 'Vishnu Varthan' },
    { desc: 'Vishnu Varthan (email)', role: 'student', user: 'vishnu.varthan@campus.edu', pass: 'VV28$Sky4m', shouldPass: true, expectedName: 'Vishnu Varthan' },
    { desc: 'Sivavaiyapuri (loginId)', role: 'student', user: 'sivavaiyapuri', pass: 'SV84@Qst6r', shouldPass: true, expectedName: 'Sivavaiyapuri' },
    { desc: 'Sivavaiyapuri (email)', role: 'student', user: 'sivavaiyapuri@campus.edu', pass: 'SV84@Qst6r', shouldPass: true, expectedName: 'Sivavaiyapuri' },
    { desc: 'Boobathy (loginId)', role: 'student', user: 'boobathy', pass: 'BB59*Lnk2v', shouldPass: true, expectedName: 'Boobathy' },
    { desc: 'Boobathy (email)', role: 'student', user: 'boobathy@campus.edu', pass: 'BB59*Lnk2v', shouldPass: true, expectedName: 'Boobathy' },
    { desc: 'Krish (loginId)', role: 'student', user: 'krish', pass: 'KR91!Trk7p', shouldPass: true, expectedName: 'Krish' },
    { desc: 'Krish (email)', role: 'student', user: 'krish@campus.edu', pass: 'KR91!Trk7p', shouldPass: true, expectedName: 'Krish' },
    { desc: 'Girl1 (loginId)', role: 'student', user: 'girl1', pass: 'GL36#Hvn8x', shouldPass: true, expectedName: 'Girl1' },
    { desc: 'Girl1 (email)', role: 'student', user: 'girl1@campus.edu', pass: 'GL36#Hvn8x', shouldPass: true, expectedName: 'Girl1' },

    // Security checks: Students cannot login as Admin
    { desc: 'Security: Vishnu Prasath cannot login as Admin', role: 'admin', user: 'vishnu.prasath', pass: 'VP73#Kmp9s', shouldPass: false },
    { desc: 'Security: Girl1 cannot login as Admin', role: 'admin', user: 'girl1', pass: 'GL36#Hvn8x', shouldPass: false },
    { desc: 'Security: Invalid password rejected', role: 'student', user: 'vishnu.prasath', pass: 'WrongPassword123', shouldPass: false },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const res = await testLogin(tc.role, tc.user, tc.pass);
    const success = res.statusCode === 200 && res.data.success;
    if (tc.shouldPass) {
      if (success && res.data.user && res.data.user.name === tc.expectedName && res.data.user.role === tc.role) {
        console.log(`[PASS] ${tc.desc} -> ${res.data.user.name} (${res.data.user.role})`);
        passed++;
      } else {
        console.error(`[FAIL] ${tc.desc} -> status ${res.statusCode}`, res.data);
      }
    } else {
      if (!success) {
        console.log(`[PASS] ${tc.desc} -> Correctly blocked (Status ${res.statusCode})`);
        passed++;
      } else {
        console.error(`[FAIL] ${tc.desc} -> Unexpectedly succeeded!`);
      }
    }
  }

  console.log(`\nAPI Test Results: ${passed}/${testCases.length} passed.`);
}

runTests();
