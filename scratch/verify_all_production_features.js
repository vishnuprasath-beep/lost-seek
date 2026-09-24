/**
 * Comprehensive Production Verification Suite
 * Tests all 4 fixes + full regressions directly against https://smart-campus-pro.vercel.app
 */

const BASE_URL = 'https://smart-campus-pro.vercel.app';

let testResults = [];

function record(suite, name, passed, details) {
  testResults.push({ suite, name, passed, details });
  const icon = passed ? '✓ PASS' : '❌ FAIL';
  console.log(`${icon} [${suite}] ${name}: ${details || ''}`);
}

async function run() {
  console.log(`\n======================================================`);
  console.log(`LOSTSEEK PRODUCTION VERIFICATION - ${BASE_URL}`);
  console.log(`======================================================\n`);

  // -------------------------------------------------------------------------
  // 1. AUTHENTICATION & SESSIONS
  // -------------------------------------------------------------------------
  console.log('--- 1. AUTHENTICATION SUITE ---');
  let studentToken = null;
  let adminToken = null;

  // 1.1 Existing Student Login
  try {
    const res = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'student', password: 'StudentPass2026!' })
    });
    const data = await res.json();
    const passed = res.ok && data.success && data.user && data.user.role === 'student' && data.user.avatarUrl !== undefined;
    studentToken = data.user?.token;
    record('AUTH', 'Existing Student Login', passed, `Logged in as ${data.user?.username}, avatar: ${data.user?.avatarUrl || 'silhouette'}`);
  } catch (err) {
    record('AUTH', 'Existing Student Login', false, err.message);
  }

  // 1.2 Existing Admin Login
  try {
    const res = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'AdminPass2026!', role: 'admin' })
    });
    const data = await res.json();
    const passed = res.ok && data.success && data.user && data.user.role === 'admin';
    adminToken = data.user?.token;
    record('AUTH', 'Existing Admin Login', passed, `Logged in as ${data.user?.username}, role: ${data.user?.role}`);
  } catch (err) {
    record('AUTH', 'Existing Admin Login', false, err.message);
  }

  // 1.3 New Student Registration
  const newStudentUser = `auto.student.${Date.now()}`;
  const newStudentPass = 'StudentPass2026!';
  try {
    const res = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Auto Student Tester',
        email: `${newStudentUser}@campus.edu`,
        username: newStudentUser,
        password: newStudentPass,
        confirmPassword: newStudentPass,
        studentId: `STU-2026-${Math.floor(1000 + Math.random() * 9000)}`
      })
    });
    const data = await res.json();
    const passed = (res.status === 200 || res.status === 201) && data.success && data.user;
    record('AUTH', 'Student Registration', passed, `Created account ${newStudentUser}`);
  } catch (err) {
    record('AUTH', 'Student Registration', false, err.message);
  }

  // 1.4 New Student Login
  try {
    const res = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newStudentUser, password: newStudentPass })
    });
    const data = await res.json();
    const passed = res.ok && data.success && data.user && data.user.role === 'student';
    record('AUTH', 'New Student Login', passed, `Successfully authenticated new user ${newStudentUser}`);
  } catch (err) {
    record('AUTH', 'New Student Login', false, err.message);
  }

  // -------------------------------------------------------------------------
  // 2. PROFILE PICTURE EDITING & PERSISTENCE
  // -------------------------------------------------------------------------
  console.log('\n--- 2. PROFILE PICTURE SUITE ---');
  const testAvatarUrl = 'https://smart-campus-pro.vercel.app/test-avatar-blob.jpg';

  // 2.1 Update Profile Picture for Student
  try {
    const res = await fetch(`${BASE_URL}/api/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-lostseek-user': encodeURIComponent(JSON.stringify({ username: newStudentUser, role: 'student' }))
      },
      body: JSON.stringify({
        username: newStudentUser,
        avatarUrl: testAvatarUrl
      })
    });
    const data = await res.json();
    const passed = res.ok && data.success && (data.profile?.avatarUrl === testAvatarUrl || data.user?.avatarUrl === testAvatarUrl);
    record('PROFILE', 'Student Edit Profile Picture API', passed, `Saved avatar: ${testAvatarUrl}`);
  } catch (err) {
    record('PROFILE', 'Student Edit Profile Picture API', false, err.message);
  }

  // 2.2 Verify Profile Picture Persistence after re-login
  try {
    const res = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newStudentUser, password: newStudentPass })
    });
    const data = await res.json();
    const passed = res.ok && data.success && (data.user?.avatarUrl === testAvatarUrl || data.user?.avatar === testAvatarUrl);
    record('PROFILE', 'Profile Picture Persistence on Login', passed, `Retrieved persisted avatar: ${data.user?.avatarUrl}`);
  } catch (err) {
    record('PROFILE', 'Profile Picture Persistence on Login', false, err.message);
  }

  // 2.3 Update Profile Picture for Admin
  try {
    const res = await fetch(`${BASE_URL}/api/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-lostseek-user': encodeURIComponent(JSON.stringify({ username: 'admin', role: 'admin' }))
      },
      body: JSON.stringify({
        username: 'admin',
        avatarUrl: 'https://smart-campus-pro.vercel.app/admin-avatar.png'
      })
    });
    const data = await res.json();
    const passed = res.ok && data.success;
    record('PROFILE', 'Admin Edit Profile Picture API', passed, `Admin avatar updated: ${data.success}`);
  } catch (err) {
    record('PROFILE', 'Admin Edit Profile Picture API', false, err.message);
  }

  // -------------------------------------------------------------------------
  // 3. PHONE NUMBER SHARING & PRIVACY (CRITICAL)
  // -------------------------------------------------------------------------
  console.log('\n--- 3. PHONE NUMBER SHARING & PRIVACY SUITE ---');

  const sharedPhoneNum = '+91 98401 23456';
  const privatePhoneNum = '+91 91234 56789';

  let sharedReportId = null;
  let privateReportId = null;

  // 3.1 Create Report with Shared Phone (State B)
  try {
    const res = await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-lostseek-user': encodeURIComponent(JSON.stringify({ username: newStudentUser, role: 'student' }))
      },
      body: JSON.stringify({
        type: 'LOST',
        title: 'Black HP Laptop Charger',
        itemName: 'Black HP Laptop Charger',
        category: 'electronics',
        location: 'Library',
        description: 'Left on 2nd floor study carrel',
        phone: sharedPhoneNum,
        phoneNumber: sharedPhoneNum,
        sharePhone: true,
        phoneSharingConsent: true
      })
    });
    const data = await res.json();
    sharedReportId = data.report?.id;
    const passed = res.ok && data.success && sharedReportId;
    record('PHONE', 'Create Report with Shared Phone', passed, `Created report ${sharedReportId}`);
  } catch (err) {
    record('PHONE', 'Create Report with Shared Phone', false, err.message);
  }

  // 3.2 Create Report with Private Phone (State A)
  try {
    const res = await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-lostseek-user': encodeURIComponent(JSON.stringify({ username: newStudentUser, role: 'student' }))
      },
      body: JSON.stringify({
        type: 'FOUND',
        title: 'Silver Titan Watch',
        itemName: 'Silver Titan Watch',
        category: 'accessories',
        location: 'Saffron Canteen',
        description: 'Found on table near counter',
        phone: privatePhoneNum,
        phoneNumber: privatePhoneNum,
        sharePhone: false,
        phoneSharingConsent: false
      })
    });
    const data = await res.json();
    privateReportId = data.report?.id;
    const passed = res.ok && data.success && privateReportId;
    record('PHONE', 'Create Report with Private Phone', passed, `Created report ${privateReportId}`);
  } catch (err) {
    record('PHONE', 'Create Report with Private Phone', false, err.message);
  }

  // 3.3 CASE 1 (State B): Another user views the shared report -> phone number MUST appear!
  try {
    const res = await fetch(`${BASE_URL}/api/reports?id=${sharedReportId}`, {
      method: 'GET',
      headers: {
        'x-lostseek-user': encodeURIComponent(JSON.stringify({ username: 'student', role: 'student' }))
      }
    });
    const data = await res.json();
    const rep = data.reports?.[0];
    const passed = rep && (rep.phone === sharedPhoneNum || rep.phoneNumber === sharedPhoneNum) && rep.sharePhone === true;
    record('PHONE', 'CASE 1: Shared Phone Visible to Other Student', passed, `Returned phone: ${rep?.phone}, sharePhone: ${rep?.sharePhone}`);
  } catch (err) {
    record('PHONE', 'CASE 1: Shared Phone Visible to Other Student', false, err.message);
  }

  // 3.4 CASE 2 (State A): Another user views unshared report -> phone number MUST be null/hidden!
  try {
    const res = await fetch(`${BASE_URL}/api/reports?id=${privateReportId}`, {
      method: 'GET',
      headers: {
        'x-lostseek-user': encodeURIComponent(JSON.stringify({ username: 'student', role: 'student' }))
      }
    });
    const data = await res.json();
    const rep = data.reports?.[0];
    const passed = rep && !rep.phone && !rep.phoneNumber && rep.sharePhone === false;
    record('PHONE', 'CASE 2: Unshared Phone Hidden from Other Student', passed, `Phone value: ${rep?.phone} (Protected), sharePhone: ${rep?.sharePhone}`);
  } catch (err) {
    record('PHONE', 'CASE 2: Unshared Phone Hidden from Other Student', false, err.message);
  }

  // 3.5 Admin can see unshared phone for safety/verification
  try {
    const res = await fetch(`${BASE_URL}/api/reports?id=${privateReportId}`, {
      method: 'GET',
      headers: {
        'x-lostseek-user': encodeURIComponent(JSON.stringify({ username: 'admin', role: 'admin' }))
      }
    });
    const data = await res.json();
    const rep = data.reports?.[0];
    const passed = rep && (rep.phone === privatePhoneNum || rep.phoneNumber === privatePhoneNum);
    record('PHONE', 'Admin Can View Private Phone for Handover', passed, `Admin received: ${rep?.phone}`);
  } catch (err) {
    record('PHONE', 'Admin Can View Private Phone for Handover', false, err.message);
  }

  // -------------------------------------------------------------------------
  // 4. REGRESSION SUITE
  // -------------------------------------------------------------------------
  console.log('\n--- 4. REGRESSION SUITE ---');

  // 4.1 Sync Endpoint
  try {
    const res = await fetch(`${BASE_URL}/api/sync`, {
      headers: { 'x-lostseek-user': encodeURIComponent(JSON.stringify({ username: 'student', role: 'student' })) }
    });
    const data = await res.json();
    const passed = res.ok && data.success && Array.isArray(data.lostReports) && Array.isArray(data.foundReports);
    record('REGRESSION', 'Full State Cloud Sync', passed, `Lost: ${data.lostReports?.length}, Found: ${data.foundReports?.length}`);
  } catch (err) {
    record('REGRESSION', 'Full State Cloud Sync', false, err.message);
  }

  // 4.2 Matches API
  try {
    const res = await fetch(`${BASE_URL}/api/matches`);
    const data = await res.json();
    const passed = res.ok && data.success && Array.isArray(data.matches);
    record('REGRESSION', 'Matches Engine API', passed, `Found ${data.matches?.length} matches`);
  } catch (err) {
    record('REGRESSION', 'Matches Engine API', false, err.message);
  }

  // 4.3 Claims API
  try {
    const res = await fetch(`${BASE_URL}/api/claims`, {
      headers: { 'x-lostseek-user': encodeURIComponent(JSON.stringify({ username: 'admin', role: 'admin' })) }
    });
    const data = await res.json();
    const passed = res.ok && data.success && Array.isArray(data.claims);
    record('REGRESSION', 'Claims Management API', passed, `Claims count: ${data.claims?.length}`);
  } catch (err) {
    record('REGRESSION', 'Claims Management API', false, err.message);
  }

  // 4.4 Public Verification with Hash Protection
  try {
    const res = await fetch(`${BASE_URL}/api/verify?id=lost-test-invalid-hash`);
    const data = await res.json();
    const passed = (res.status === 404 || !data.success);
    record('REGRESSION', 'Verification Security (Hash Guard)', passed, `HTTP ${res.status}: Properly rejected invalid tag`);
  } catch (err) {
    record('REGRESSION', 'Verification Security (Hash Guard)', false, err.message);
  }

  // 4.5 Static HTML Serving
  try {
    const res = await fetch(`${BASE_URL}/`);
    const text = await res.text();
    const passed = res.ok && text.includes('edit-profile-picture-modal') && text.includes('LostSeek');
    record('REGRESSION', 'Production Web UI Assets', passed, `Contains Edit Profile modal: ${text.includes('edit-profile-picture-modal')}`);
  } catch (err) {
    record('REGRESSION', 'Production Web UI Assets', false, err.message);
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log('PRODUCTION TEST RESULTS SUMMARY:');
  const total = testResults.length;
  const passedCount = testResults.filter(t => t.passed).length;
  const failedCount = total - passedCount;
  console.log(`Total Tests: ${total} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log(`Success Rate: ${Math.round((passedCount / total) * 100)}%`);
  console.log('======================================================\n');
}

run();
