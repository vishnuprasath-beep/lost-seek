const { getSupabaseConfig } = require('../api/db.js');
const { createClient } = require('@supabase/supabase-js');
const registerHandler = require('../api/register.js');
const loginHandler = require('../api/login.js');
const changePasswordHandler = require('../api/change-password.js');

function mockReqRes(method, body = {}) {
  const req = {
    method,
    body,
    headers: {}
  };
  let statusCode = 200;
  let headers = {};
  let responseData = null;

  const res = {
    setHeader: (k, v) => { headers[k] = v; },
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
      return res;
    },
    send: (data) => {
      responseData = data;
      return res;
    }
  };

  return {
    req,
    res,
    getResponse: () => ({ status: statusCode, data: responseData })
  };
}

async function run() {
  console.log('=== RUNNING PHASE 3: REGISTRATION & PASSWORD LOCAL HANDLER ACCEPTANCE TESTS ===');

  const testEmail = `student_${Date.now()}@campus.edu`;
  const initialPass = 'InitialPass2026!';
  const updatedPass = 'UpdatedSecurePass2026!';

  const cfg = getSupabaseConfig();
  const sb = createClient(cfg.url, cfg.key);

  try {
    // 1. Register Student with malicious role: 'admin' attempt
    console.log('\n--- TEST 1: Register student (attempting role=admin exploit) ---');
    const { req: regReq, res: regRes, getResponse: getRegRes } = mockReqRes('POST', {
      name: 'Test Candidate Student',
      email: testEmail,
      username: testEmail,
      password: initialPass,
      confirmPassword: initialPass,
      role: 'admin' // Attempt privilege escalation
    });

    await registerHandler(regReq, regRes);
    const regResult = getRegRes();
    console.log('Registration HTTP Status:', regResult.status);
    console.log('Registration Message:', regResult.data?.message);
    console.log('Returned Role:', regResult.data?.user?.role);

    if (regResult.status !== 201) throw new Error('Registration failed: ' + JSON.stringify(regResult.data));
    if (regResult.data?.user?.role !== 'student') throw new Error('Server allowed privileged role escalation!');

    // Check DB row
    const { data: dbUser } = await sb.from('users').select('*').eq('username', testEmail).single();
    console.log('Database row role:', dbUser?.role);
    let parsedHash = '';
    try {
      const parsed = JSON.parse(dbUser.phone);
      parsedHash = parsed.passwordHash;
    } catch(e) {}
    console.log('Database password hash starts with:', parsedHash?.substring(0, 10));
    if (dbUser?.role !== 'student') throw new Error('Database row role is not student!');
    if (!parsedHash?.startsWith('scrypt:')) throw new Error('Password was not hashed with scrypt!');

    // 2. Login with registered student
    console.log('\n--- TEST 2: Login with newly created student ---');
    const { req: loginReq, res: loginRes, getResponse: getLoginRes } = mockReqRes('POST', {
      role: 'student',
      username: testEmail,
      password: initialPass
    });

    await loginHandler(loginReq, loginRes);
    const loginResult = getLoginRes();
    console.log('Login HTTP Status:', loginResult.status);
    console.log('Login Authenticated Name:', loginResult.data?.user?.name);
    console.log('Login Authenticated Role:', loginResult.data?.user?.role);
    if (loginResult.status !== 200 || !loginResult.data?.success) {
      throw new Error('Login with new student credentials failed!');
    }

    // 3. Change password
    console.log('\n--- TEST 3: Change Password ---');
    const { req: chReq, res: chRes, getResponse: getChRes } = mockReqRes('POST', {
      username: testEmail,
      currentPassword: initialPass,
      newPassword: updatedPass,
      confirmPassword: updatedPass
    });

    await changePasswordHandler(chReq, chRes);
    const chResult = getChRes();
    console.log('Change Password HTTP Status:', chResult.status);
    console.log('Change Password Message:', chResult.data?.message);
    if (chResult.status !== 200 || !chResult.data?.success) {
      throw new Error('Change password failed: ' + JSON.stringify(chResult.data));
    }

    // 4. Verify old password fails
    console.log('\n--- TEST 4: Verify Old Password Fails ---');
    const { req: oldReq, res: oldRes, getResponse: getOldRes } = mockReqRes('POST', {
      role: 'student',
      username: testEmail,
      password: initialPass
    });

    await loginHandler(oldReq, oldRes);
    const oldLoginResult = getOldRes();
    console.log('Old Password Login Status:', oldLoginResult.status, '(Expected 401)');
    if (oldLoginResult.status !== 401) throw new Error('Old password still worked after change!');

    // 5. Verify new password works
    console.log('\n--- TEST 5: Verify New Password Works ---');
    const { req: newReq, res: newRes, getResponse: getNewRes } = mockReqRes('POST', {
      role: 'student',
      username: testEmail,
      password: updatedPass
    });

    await loginHandler(newReq, newRes);
    const newLoginResult = getNewRes();
    console.log('New Password Login Status:', newLoginResult.status, '(Expected 200)');
    console.log('New Password Authenticated Role:', newLoginResult.data?.user?.role);
    if (newLoginResult.status !== 200 || !newLoginResult.data?.success) {
      throw new Error('New password login failed!');
    }

    console.log('\n>>> PHASE 3 LOCAL HANDLER VERIFICATION RESULT: ALL PASS <<<');
  } catch (err) {
    console.error('Phase 3 test error:', err);
    process.exitCode = 1;
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
