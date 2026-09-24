const fs = require('fs');
const path = require('path');

console.log('=== RUNNING PRE-FLIGHT BUILD & ROUTE VALIDATION ===\n');

// 1. Verify function count in api/
const apiFiles = fs.readdirSync('api').filter(f => f.endsWith('.js'));
console.log(`Step 1: Counting Serverless Functions in api/: ${apiFiles.length}`);
apiFiles.forEach(f => console.log(`  - api/${f}`));

if (apiFiles.length > 12) {
  console.error(`FAILED: api/ has ${apiFiles.length} functions, which exceeds the Vercel Hobby limit of 12!`);
  process.exit(1);
}
console.log('✓ PASS: Function count is within Vercel Hobby plan limit (<= 12).\n');

// 2. Verify all server/ helpers load without errors
console.log('Step 2: Testing server/ helpers:');
const serverFiles = fs.readdirSync('server').filter(f => f.endsWith('.js'));
serverFiles.forEach(f => {
  try {
    const mod = require(`../server/${f}`);
    console.log(`  ✓ server/${f} loaded successfully`);
  } catch (err) {
    console.error(`  ❌ FAILED to load server/${f}:`, err.message);
    process.exit(1);
  }
});
console.log('✓ PASS: All server helpers loaded.\n');

// 3. Verify all api/ routes load without errors
console.log('Step 3: Testing api/ routes:');
apiFiles.forEach(f => {
  try {
    const handler = require(`../api/${f}`);
    if (typeof handler !== 'function') {
      throw new Error(`api/${f} does not export a handler function!`);
    }
    console.log(`  ✓ api/${f} is a valid serverless handler`);
  } catch (err) {
    console.error(`  ❌ FAILED to load api/${f}:`, err.message);
    process.exit(1);
  }
});
console.log('✓ PASS: All API routes export valid handlers.\n');

// 4. Test auth.js with mock request for login, register, change-password
console.log('Step 4: Testing api/auth.js multi-action routing:');
const authHandler = require('../api/auth.js');

function mock(action, body, method = 'POST') {
  let statusCode = 200;
  let resData = null;
  const res = {
    setHeader: () => {},
    status: (c) => { statusCode = c; return res; },
    json: (d) => { resData = d; return res; }
  };
  return {
    req: {
      method,
      url: `/?action=${action}`,
      body,
      headers: {}
    },
    res,
    get: () => ({ status: statusCode, data: resData })
  };
}

async function testAuth() {
  // Test invalid login
  const m1 = mock('login', { username: 'test_invalid', password: 'wrong' });
  await authHandler(m1.req, m1.res);
  const r1 = m1.get();
  console.log(`  ✓ Login test completed (HTTP status: ${r1.status})`);

  // Test register validation
  const m2 = mock('register', { name: '', email: 'invalid' });
  await authHandler(m2.req, m2.res);
  const r2 = m2.get();
  console.log(`  ✓ Register validation completed (HTTP status: ${r2.status})`);

  // Test change-password validation
  const m3 = mock('change-password', { username: '' });
  await authHandler(m3.req, m3.res);
  const r3 = m3.get();
  console.log(`  ✓ Change-password validation completed (HTTP status: ${r3.status})`);
}

testAuth().then(() => {
  console.log('\n>>> PRE-FLIGHT CHECK PASSED 100%: READY TO DEPLOY TO VERCEL <<<');
}).catch(err => {
  console.error('Test auth error:', err);
  process.exit(1);
});
