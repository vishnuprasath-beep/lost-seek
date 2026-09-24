const crypto = require('crypto');
const fs = require('fs');

const appJs = fs.readFileSync('app.js', 'utf8');

// Extract AUTH_HASH_DIRECTORY
const match = appJs.match(/const AUTH_HASH_DIRECTORY = \{([\s\S]*?)\};/);
if (!match) {
  console.error('Could not find AUTH_HASH_DIRECTORY');
  process.exit(1);
}

const AUTH_HASH_DIRECTORY = eval('({' + match[1] + '})');

const salt = 'lostseek_secure_salt_2026_campus';
function computeLoginHash(username, password) {
  const rawStr = salt + ':' + String(username).toLowerCase().trim() + ':' + String(password);
  return crypto.createHash('sha256').update(rawStr).digest('hex');
}

function clientAuthenticate(role, username, password) {
  const hash = computeLoginHash(username, password);
  const matched = AUTH_HASH_DIRECTORY[hash];
  if (matched && matched.role === role) {
    return { success: true, user: { ...matched, username } };
  }
  return { success: false };
}

console.log('=== TESTING CLIENT HASH AUTHENTICATION (AUTH_HASH_DIRECTORY) ===');
const testCases = [
  // Existing
  { desc: 'Existing Student (email)', role: 'student', user: 'student@campus.edu', pass: 'StudentPass2026!', shouldPass: true, expectedName: 'Alex Rivera' },
  { desc: 'Existing Student (username)', role: 'student', user: 'student', pass: 'StudentPass2026!', shouldPass: true, expectedName: 'Alex Rivera' },
  { desc: 'Existing Admin (email)', role: 'admin', user: 'admin@campus.edu', pass: 'AdminPass2026!', shouldPass: true, expectedName: 'Vikram Singh' },
  { desc: 'Existing Admin (username)', role: 'admin', user: 'admin', pass: 'AdminPass2026!', shouldPass: true, expectedName: 'Vikram Singh' },

  // Six new student accounts
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

  // Security checks
  { desc: 'Security: Vishnu Prasath cannot login as Admin', role: 'admin', user: 'vishnu.prasath', pass: 'VP73#Kmp9s', shouldPass: false },
  { desc: 'Security: Girl1 cannot login as Admin', role: 'admin', user: 'girl1', pass: 'GL36#Hvn8x', shouldPass: false },
  { desc: 'Security: Invalid password rejected', role: 'student', user: 'vishnu.prasath', pass: 'WrongPassword123', shouldPass: false },
];

let passed = 0;
for (const tc of testCases) {
  const res = clientAuthenticate(tc.role, tc.user, tc.pass);
  if (tc.shouldPass) {
    if (res.success && res.user.name === tc.expectedName && res.user.role === tc.role) {
      console.log(`[PASS] ${tc.desc} -> ${res.user.name} (${res.user.role})`);
      passed++;
    } else {
      console.error(`[FAIL] ${tc.desc}`, res);
    }
  } else {
    if (!res.success) {
      console.log(`[PASS] ${tc.desc} -> Correctly blocked`);
      passed++;
    } else {
      console.error(`[FAIL] ${tc.desc} -> Unexpectedly passed!`);
    }
  }
}

console.log(`\nClient Hash Test Results: ${passed}/${testCases.length} passed.`);
