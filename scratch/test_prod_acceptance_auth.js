import https from 'https';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val.trim();
  }
});

const PROD_URL = 'https://smart-campus-pro.vercel.app';
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function sendRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(PROD_URL + endpoint);
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Accept': 'application/json' };
    if (data) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = https.request(parsed, { method, headers }, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(resBody); } catch (e) {}
        resolve({
          status: res.statusCode,
          contentType: res.headers['content-type'] || '',
          body: json,
          raw: resBody
        });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runProductionTests() {
  console.log('====================================================');
  console.log('LOSTSEEK PHASE 9 — REAL PRODUCTION ACCEPTANCE TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function record(title, ok, details) {
    total++;
    if (ok) passed++;
    console.log(`${ok ? '✓ PASS' : '✗ FAIL'} [Test ${total}]: ${title}`);
    if (details) console.log(`   ${details}`);
  }

  // 1. Existing student login (email)
  const t1 = await sendRequest('/api/login', 'POST', {
    role: 'student',
    username: 'student@campus.edu',
    password: 'StudentPass2026!'
  });
  record(
    'Existing Student Login (student@campus.edu / StudentPass2026!)',
    t1.status === 200 && t1.body?.success === true && t1.body?.user?.role === 'student',
    `Status: ${t1.status}, User: ${t1.body?.user?.name} (${t1.body?.user?.username}), Token issued: ${!!t1.body?.user?.token}`
  );

  // 1b. Existing student login (short username)
  const t1b = await sendRequest('/api/login', 'POST', {
    role: 'student',
    username: 'student',
    password: 'student123'
  });
  record(
    'Existing Student Login (student / student123 fallback)',
    t1b.status === 200 && t1b.body?.success === true,
    `Status: ${t1b.status}, User: ${t1b.body?.user?.name}`
  );

  // 2. Existing admin login (email)
  const t2 = await sendRequest('/api/login', 'POST', {
    role: 'admin',
    username: 'admin@campus.edu',
    password: 'AdminPass2026!'
  });
  record(
    'Existing Admin Login (admin@campus.edu / AdminPass2026!)',
    t2.status === 200 && t2.body?.success === true && t2.body?.user?.role === 'admin',
    `Status: ${t2.status}, User: ${t2.body?.user?.name}, Role: ${t2.body?.user?.role}`
  );

  // 2b. Existing admin login (short username & fallback)
  const t2b = await sendRequest('/api/login', 'POST', {
    role: 'admin',
    username: 'admin',
    password: 'admin123'
  });
  record(
    'Existing Admin Login (admin / admin123 fallback)',
    t2b.status === 200 && t2b.body?.success === true,
    `Status: ${t2b.status}, User: ${t2b.body?.user?.name}`
  );

  // 3. Registered student (vishnu.prasath)
  const t3 = await sendRequest('/api/login', 'POST', {
    role: 'student',
    username: 'vishnu.prasath',
    password: 'VP73#Kmp9s'
  });
  record(
    'Registered Student Login (vishnu.prasath / VP73#Kmp9s)',
    t3.status === 200 && t3.body?.success === true && t3.body?.user?.name === 'Vishnu Prasath',
    `Status: ${t3.status}, Name: ${t3.body?.user?.name}, StudentId: ${t3.body?.user?.studentId}`
  );

  // 3b. Registered student (email variant)
  const t3b = await sendRequest('/api/login', 'POST', {
    role: 'student',
    username: 'vishnu.prasath@campus.edu',
    password: 'VP73#Kmp9s'
  });
  record(
    'Registered Student Login (vishnu.prasath@campus.edu / VP73#Kmp9s)',
    t3b.status === 200 && t3b.body?.success === true,
    `Status: ${t3b.status}, User: ${t3b.body?.user?.name}`
  );

  // 4. Role Isolation: Student attempting to log into Admin portal
  const t4 = await sendRequest('/api/login', 'POST', {
    role: 'admin',
    username: 'student@campus.edu',
    password: 'StudentPass2026!'
  });
  record(
    'Role Isolation: Student barred from Admin portal',
    t4.status === 401 && t4.body?.success === false,
    `Status: ${t4.status}, Error Message: "${t4.body?.message}"`
  );

  // 4b. Role Isolation: Admin attempting to log into Student portal
  const t4b = await sendRequest('/api/login', 'POST', {
    role: 'student',
    username: 'admin@campus.edu',
    password: 'AdminPass2026!'
  });
  record(
    'Role Isolation: Admin redirected from Student portal',
    t4b.status === 401 && t4b.body?.success === false,
    `Status: ${t4b.status}, Error Message: "${t4b.body?.message}"`
  );

  // 5. Invalid Credentials Rejected
  const t5 = await sendRequest('/api/login', 'POST', {
    role: 'student',
    username: 'student@campus.edu',
    password: 'IncorrectPassword999'
  });
  record(
    'Invalid Credentials Properly Rejected',
    t5.status === 401 && t5.body?.success === false,
    `Status: ${t5.status}, Error: "${t5.body?.message}"`
  );

  // 6. Test Profile Image Upload via /api/upload
  const tinyImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const t6 = await sendRequest('/api/upload', 'POST', {
    image: tinyImg,
    filename: 'audit-avatar.png'
  });
  const uploadedAvatarUrl = t6.body?.url || null;
  record(
    'Profile Photo Upload to Vercel Blob (/api/upload)',
    t6.status === 200 && !!uploadedAvatarUrl,
    `Status: ${t6.status}, Permanent Blob URL: ${uploadedAvatarUrl}`
  );

  // 7. Brand New Student Registration via /api/register
  const testEmail = `newstudent_${Date.now()}@campus.edu`;
  const initialPass = 'InitialStudentPass2026!';
  const changedPass = 'NewStudentPass2026#Updated';

  const t7 = await sendRequest('/api/register', 'POST', {
    name: 'Real Device Test Student',
    email: testEmail,
    studentId: 'STU-PROD-9901',
    password: initialPass,
    confirmPassword: initialPass,
    avatarUrl: uploadedAvatarUrl,
    role: 'student'
  });
  record(
    'New Student Registration (/api/register)',
    t7.status === 201 && t7.body?.success === true && t7.body?.user?.username === testEmail,
    `Status: ${t7.status}, Created User ID: ${t7.body?.user?.id}, Message: "${t7.body?.message}"`
  );

  // 8. New Student Login with newly registered credentials
  const t8 = await sendRequest('/api/login', 'POST', {
    role: 'student',
    username: testEmail,
    password: initialPass
  });
  record(
    'New Student Login with Registered Credentials',
    t8.status === 200 && t8.body?.success === true && t8.body?.user?.username === testEmail,
    `Status: ${t8.status}, Authenticated: ${t8.body?.user?.name}`
  );

  // 9. Change Password for newly created student
  const t9 = await sendRequest('/api/change-password', 'POST', {
    username: testEmail,
    currentPassword: initialPass,
    newPassword: changedPass,
    confirmPassword: changedPass
  });
  record(
    'Change Password Feature (/api/change-password)',
    t9.status === 200 && t9.body?.success === true,
    `Status: ${t9.status}, Message: "${t9.body?.message}"`
  );

  // 10. Login with Changed Password (and verify old password fails)
  const t10Old = await sendRequest('/api/login', 'POST', {
    role: 'student',
    username: testEmail,
    password: initialPass
  });
  const t10New = await sendRequest('/api/login', 'POST', {
    role: 'student',
    username: testEmail,
    password: changedPass
  });
  record(
    'Old Password Rejected & New Password Authenticated',
    t10Old.status === 401 && t10New.status === 200,
    `Old Pass Status: ${t10Old.status} (Rejected ✓), New Pass Status: ${t10New.status} (Accepted ✓)`
  );

  // 11. Verification Bug Check: Literal 'lost' or 'found'
  const t11Lost = await sendRequest('/api/verify?id=lost', 'GET');
  record(
    'Verification Route: Literal "lost" Route ID Blocked',
    t11Lost.status === 400 && t11Lost.body?.error === 'InvalidReportId',
    `Status: ${t11Lost.status}, Error Code: ${t11Lost.body?.error}, Message: "${t11Lost.body?.message}"`
  );

  // 12. Verification with Real Temporary Report
  const t12Report = await sendRequest('/api/reports', 'POST', {
    title: 'AUDIT_VERIFY_TEST_ITEM',
    description: 'Temporary item for verification route testing',
    category: 'Electronics',
    type: 'LOST',
    status: 'Active',
    location: 'Campus Library',
    item_date: new Date().toISOString().split('T')[0],
    contact_email: testEmail,
    user_id: testEmail
  });
  const repId = t12Report.body?.report?.id || t12Report.body?.id;
  
  let t12Verify = { status: 0 };
  if (repId) {
    t12Verify = await sendRequest(`/api/verify?id=${repId}`, 'GET');
  }
  record(
    'Verification Route: Real Report ID Verified',
    t12Verify.status === 200 && t12Verify.body?.success === true && t12Verify.body?.record?.id === repId,
    `Status: ${t12Verify.status}, Verified Record ID: ${t12Verify.body?.record?.id}, Custody: "${t12Verify.body?.record?.custody}"`
  );

  // Cleanup temporary test data only
  console.log('\n--- CLEANING UP TEMPORARY AUDIT DATA ---');
  if (repId) {
    await supabase.from('reports').delete().eq('id', repId);
    console.log(`Deleted temporary report: ${repId}`);
  }
  await supabase.from('users').delete().eq('username', testEmail);
  console.log(`Deleted temporary test user: ${testEmail}`);

  console.log('\n====================================================');
  console.log(`PRODUCTION TEST SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log('====================================================\n');
}

runProductionTests().catch(console.error);
