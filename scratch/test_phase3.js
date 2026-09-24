const https = require('https');
const { getSupabaseConfig } = require('../api/db.js');
const { createClient } = require('@supabase/supabase-js');

const BASE_URL = 'https://smart-campus-pro.vercel.app';

function request(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = options.headers || {};
    if (body) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(body);
    }
    const req = https.request(url, {
      method: options.method || 'GET',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function run() {
  console.log('=== RUNNING PHASE 3: REGISTRATION & PASSWORD ACCEPTANCE TESTS ===');

  const testEmail = `student_${Date.now()}@campus.edu`;
  const initialPass = 'InitialPass2026!';
  const updatedPass = 'UpdatedSecurePass2026!';

  const cfg = getSupabaseConfig();
  const sb = createClient(cfg.url, cfg.key);

  try {
    // 1. Register Student with malicious role: 'admin' attempt
    console.log('\n--- TEST 1: Register student (attempting role=admin exploit) ---');
    const regPayload = JSON.stringify({
      name: 'Test Candidate Student',
      email: testEmail,
      username: testEmail,
      password: initialPass,
      confirmPassword: initialPass,
      role: 'admin' // Attempt privilege escalation
    });

    const regRes = await request('/api/register', { method: 'POST' }, regPayload);
    console.log('Registration HTTP Status:', regRes.status);
    console.log('Registration Message:', regRes.data?.message);
    console.log('Returned Role:', regRes.data?.user?.role);

    if (regRes.status !== 201) throw new Error('Registration failed: ' + JSON.stringify(regRes.data));
    if (regRes.data?.user?.role !== 'student') throw new Error('Server allowed privileged role escalation!');

    // Check DB row
    const { data: dbUser } = await sb.from('users').select('*').eq('username', testEmail).single();
    console.log('Database row role:', dbUser?.role);
    if (dbUser?.role !== 'student') throw new Error('Database row role is not student!');

    // 2. Login with registered student
    console.log('\n--- TEST 2: Login with newly created student ---');
    const loginRes = await request('/api/login', { method: 'POST' }, JSON.stringify({
      role: 'student',
      username: testEmail,
      password: initialPass
    }));

    console.log('Login HTTP Status:', loginRes.status);
    console.log('Login Authenticated Name:', loginRes.data?.user?.name);
    console.log('Login Authenticated Role:', loginRes.data?.user?.role);
    if (loginRes.status !== 200 || !loginRes.data?.success) {
      throw new Error('Login with new student credentials failed!');
    }

    // 3. Change password
    console.log('\n--- TEST 3: Change Password ---');
    const changeRes = await request('/api/change-password', { method: 'POST' }, JSON.stringify({
      username: testEmail,
      currentPassword: initialPass,
      newPassword: updatedPass,
      confirmPassword: updatedPass
    }));

    console.log('Change Password HTTP Status:', changeRes.status);
    console.log('Change Password Message:', changeRes.data?.message);
    if (changeRes.status !== 200 || !changeRes.data?.success) {
      throw new Error('Change password failed: ' + JSON.stringify(changeRes.data));
    }

    // 4. Verify old password fails
    console.log('\n--- TEST 4: Verify Old Password Fails ---');
    const oldLoginRes = await request('/api/login', { method: 'POST' }, JSON.stringify({
      role: 'student',
      username: testEmail,
      password: initialPass
    }));
    console.log('Old Password Login Status:', oldLoginRes.status, '(Expected 401)');
    if (oldLoginRes.status !== 401) throw new Error('Old password still worked after change!');

    // 5. Verify new password works
    console.log('\n--- TEST 5: Verify New Password Works ---');
    const newLoginRes = await request('/api/login', { method: 'POST' }, JSON.stringify({
      role: 'student',
      username: testEmail,
      password: updatedPass
    }));
    console.log('New Password Login Status:', newLoginRes.status, '(Expected 200)');
    console.log('New Password Authenticated Role:', newLoginRes.data?.user?.role);
    if (newLoginRes.status !== 200 || !newLoginRes.data?.success) {
      throw new Error('New password login failed!');
    }

    console.log('\n>>> PHASE 3 VERIFICATION RESULT: PASS <<<');
  } catch (err) {
    console.error('Phase 3 test error:', err);
  } finally {
    console.log('\n--- CLEANING UP TEMPORARY REGISTERED STUDENT ROW ---');
    try {
      await sb.from('users').delete().eq('username', testEmail);
      console.log('Deleted temporary test user:', testEmail);
    } catch (e) {
      console.warn('Cleanup error:', e.message);
    }
  }
}

run().catch(console.error);
