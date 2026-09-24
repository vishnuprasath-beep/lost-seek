const authHandler = require('../api/auth.js');
const notificationsHandler = require('../api/notifications.js');
const reportsHandler = require('../api/reports.js');
const alertsHandler = require('../api/alerts.js');
const db = require('../server/db.js');
const fs = require('fs');
const path = require('path');

function mockRequest(method, urlStr, body = {}, headers = {}) {
  let resStatus = 200;
  let resHeaders = {};
  let resBody = '';

  const req = {
    method,
    url: urlStr,
    headers: { 'content-type': 'application/json', ...headers },
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

async function runStage4Verification() {
  console.log('====================================================');
  console.log('STARTING VERIFICATION SUITE: BUGS 1-8 & LAUNCHER ICON');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${testName}: ${details}`);
    }
  }

  // ----------------------------------------------------
  // TEST 1: LAUNCHER ICONS & ANDROID GRADLE CONFIG
  // ----------------------------------------------------
  console.log('--- TEST GROUP 1: Launcher Icons & Versioning ---');
  const resDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
  const densities = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
  
  let allIconsExist = true;
  for (const d of densities) {
    const launcher = path.join(resDir, d, 'ic_launcher.png');
    const launcherRound = path.join(resDir, d, 'ic_launcher_round.png');
    const launcherFg = path.join(resDir, d, 'ic_launcher_foreground.png');
    if (!fs.existsSync(launcher) || !fs.existsSync(launcherRound) || !fs.existsSync(launcherFg)) {
      allIconsExist = false;
      console.error(`Missing icon in ${d}`);
    }
  }
  assert(allIconsExist, 'All launcher mipmap icons (ic_launcher, ic_launcher_round, ic_launcher_foreground) exist across mdpi-xxxhdpi');

  const colorsXml = fs.readFileSync(path.join(resDir, 'values', 'colors.xml'), 'utf8');
  assert(colorsXml.includes('<color name="ic_launcher_background">#ffffff</color>'), 'colors.xml defines #ffffff background for launcher icon');

  const buildGradle = fs.readFileSync(path.join(__dirname, '..', 'android', 'app', 'build.gradle'), 'utf8');
  assert(buildGradle.includes('versionCode 3') && buildGradle.includes('versionName "2.1.0"'), 'build.gradle bumped to versionCode 3 and versionName 2.1.0');

  // ----------------------------------------------------
  // TEST 2: BUG 1 - NOTIFICATIONS "CLEAR ALL" & ISOLATION
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 2: Bug 1 - Notifications "Clear All" & Isolation ---');
  const userA = 'student-test-notif-a-' + Date.now();
  const userB = 'student-test-notif-b-' + Date.now();

  // Create notifications for userA and userB
  await db.createNotification({
    userId: userA,
    type: 'sighting',
    title: 'Sighting Test A1',
    message: 'User A notification 1'
  });
  await db.createNotification({
    userId: userA,
    type: 'sighting',
    title: 'Sighting Test A2',
    message: 'User A notification 2'
  });
  await db.createNotification({
    userId: userB,
    type: 'system',
    title: 'User B Notification',
    message: 'User B notification message'
  });

  const notifsA = await db.getNotifications(userA);
  assert(notifsA.length >= 2, `User A received at least 2 notifications (found ${notifsA.length})`);

  // Clear all for user A via DELETE /api/notifications
  const deleteReq = mockRequest('DELETE', `/api/notifications?userId=${userA}`);
  const deleteRes = await deleteReq.run(notificationsHandler);
  assert(deleteRes.status === 200 && deleteRes.body.success === true, 'DELETE /api/notifications returns 200 success');

  const notifsAAfter = await db.getNotifications(userA);
  assert(notifsAAfter.length === 0, 'User A notifications array is now completely empty (cleared)');

  // Ensure user B notifications were NOT deleted (isolation)
  const notifsBAfter = await db.getNotifications(userB);
  assert(notifsBAfter.length >= 1, 'User B notifications remain intact (no cross-user clearing)');

  // ----------------------------------------------------
  // TEST 3: BUG 2 - PROFILE RENDERING SAFE GUARDS & NO REFERENCEERROR
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 3: Bug 2 - Profile Rendering No ReferenceError ---');
  const appJsCode = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const profileSnippet = appJsCode.slice(appJsCode.indexOf('function renderProfile'), appJsCode.indexOf('function renderProfile') + 1200);
  assert(!profileSnippet.includes('${isAdmin ?'), 'renderProfile does not contain rogue undefined ${isAdmin ?}');
  assert(profileSnippet.includes('isAdminOrStaff'), 'renderProfile uses properly defined isAdminOrStaff');

  // Verify roles handled: Student, Admin, Supervisor, Director
  assert(appJsCode.includes('Supervisor') && appJsCode.includes('Director'), 'app.js handles Supervisor and Director roles in profile');

  // ----------------------------------------------------
  // TEST 4: BUG 3 - NEW STUDENT REGISTRATION WITH AVATAR
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 4: Bug 3 - Registration Avatar & Normalization ---');
  const testRegUser = 'teststudent_' + Date.now();
  const testAvatarUrl = 'https://smart-campus-pro.vercel.app/avatars/test-avatar-123.jpg';

  const regMock = mockRequest('POST', '/api/auth?action=register', {
    username: testRegUser,
    email: `${testRegUser}@campus.edu`,
    password: 'SecurePassword2026!',
    name: 'Test Avatar Student',
    role: 'student',
    rollNumber: '26CS999',
    department: 'Computer Science',
    year: 'III',
    section: 'A',
    phone: '9876543210',
    avatarUrl: testAvatarUrl
  });
  const regRes = await regMock.run(authHandler);
  assert(regRes.status === 201 || regRes.status === 200, `Registration returned status ${regRes.status}`, regRes.body?.error);
  assert(regRes.body?.user?.avatarUrl === testAvatarUrl, `Registered user object contains normalized avatarUrl: ${regRes.body?.user?.avatarUrl}`);

  // Test login returns avatarUrl
  const loginMock = mockRequest('POST', '/api/auth?action=login', {
    username: testRegUser,
    password: 'SecurePassword2026!',
    role: 'student'
  });
  const loginRes = await loginMock.run(authHandler);
  assert(loginRes.status === 200, `Login returned status 200`, loginRes.body?.error);
  assert(loginRes.body?.user?.avatarUrl === testAvatarUrl, `Login response preserves avatarUrl: ${loginRes.body?.user?.avatarUrl}`);

  // ----------------------------------------------------
  // TEST 5: BUG 4 - CHANGE PASSWORD SECURITY & CALLER AUTH
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 5: Bug 4 - Change Password Security & Authorization ---');
  
  // 5a. Unauthorized user (different student) trying to change testRegUser's password
  const unauthorizedChange = mockRequest('POST', '/api/auth?action=change-password', {
    userId: loginRes.body.user.id,
    username: testRegUser,
    currentPassword: 'SecurePassword2026!',
    newPassword: 'HackedPassword2026!',
    confirmPassword: 'HackedPassword2026!',
    callerUser: { id: 'different-student-id', role: 'student', username: 'other_student' }
  });
  const unauthRes = await unauthorizedChange.run(authHandler);
  assert(unauthRes.status === 403, `Unauthorized caller is blocked with 403 (got ${unauthRes.status})`);

  // 5b. Change with incorrect current password
  const badCurrentPass = mockRequest('POST', '/api/auth?action=change-password', {
    userId: loginRes.body.user.id,
    username: testRegUser,
    currentPassword: 'WrongPassword!',
    newPassword: 'BrandNewPassword2026!',
    confirmPassword: 'BrandNewPassword2026!',
    callerUser: { id: loginRes.body.user.id, role: 'student', username: testRegUser }
  });
  const badPassRes = await badCurrentPass.run(authHandler);
  assert(badPassRes.status === 401 || badPassRes.status === 400, `Incorrect current password rejected with 400/401 (got ${badPassRes.status})`);

  // 5c. Valid change password by account owner
  const validChange = mockRequest('POST', '/api/auth?action=change-password', {
    userId: loginRes.body.user.id,
    username: testRegUser,
    currentPassword: 'SecurePassword2026!',
    newPassword: 'BrandNewPassword2026!',
    confirmPassword: 'BrandNewPassword2026!',
    callerUser: { id: loginRes.body.user.id, role: 'student', username: testRegUser }
  });
  const validChangeRes = await validChange.run(authHandler);
  assert(validChangeRes.status === 200 && validChangeRes.body.success === true, `Password successfully updated with 200 (message: ${validChangeRes.body?.message})`);

  // 5d. Verify old password fails and new password works for login
  const oldLogin = mockRequest('POST', '/api/auth?action=login', {
    username: testRegUser,
    password: 'SecurePassword2026!',
    role: 'student'
  });
  const oldLoginRes = await oldLogin.run(authHandler);
  assert(oldLoginRes.status === 401, 'Old password rejected after change');

  const newLogin = mockRequest('POST', '/api/auth?action=login', {
    username: testRegUser,
    password: 'BrandNewPassword2026!',
    role: 'student'
  });
  const newLoginRes = await newLogin.run(authHandler);
  assert(newLoginRes.status === 200, 'New password successfully logs in');

  // ----------------------------------------------------
  // TEST 6: BUG 5 - REPORT OWNERSHIP & DELETION AUTHORIZATION
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 6: Bug 5 - Report Ownership & Deletion Authorization ---');
  
  // Create a report by user testRegUser
  const testReport = await db.createReport({
    type: 'lost',
    title: 'Blue Water Bottle - Verification Test',
    category: 'Bottle',
    location: 'Mechanical Block 2nd Floor',
    description: 'Stainless steel blue water bottle with sticker',
    reportedBy: loginRes.body.user.name || testRegUser,
    userId: loginRes.body.user.id,
    userRole: 'student'
  });
  assert(testReport && testReport.id, `Report created with ID: ${testReport.id}`);

  // Another student tries to delete testReport
  const anotherStudent = { id: 'another-student-999', role: 'student', username: 'intruder' };
  const rogueDelete = mockRequest('DELETE', `/api/reports?id=${testReport.id}`, {
    callerUser: anotherStudent
  }, {
    'x-user-id': anotherStudent.id,
    'x-user-role': anotherStudent.role
  });
  const rogueDeleteRes = await rogueDelete.run(reportsHandler);
  assert(rogueDeleteRes.status === 403, `Non-owner deletion blocked with 403 Forbidden (got ${rogueDeleteRes.status})`);

  // Admin tries to delete (admin moderation permitted)
  const adminCaller = { id: 'admin-1', role: 'admin', username: 'admin' };
  const adminDelete = mockRequest('DELETE', `/api/reports?id=${testReport.id}`, {
    callerUser: adminCaller
  }, {
    'x-user-id': adminCaller.id,
    'x-user-role': adminCaller.role
  });
  const adminDeleteRes = await adminDelete.run(reportsHandler);
  assert(adminDeleteRes.status === 200 && adminDeleteRes.body.success === true, `Admin can delete/moderate report (got 200)`);

  const reportAfterDelete = await db.getReportById(testReport.id);
  assert(!reportAfterDelete, 'Deleted report is removed from database');

  // ----------------------------------------------------
  // TEST 7: BUG 6 - SIGHTING DIRECT NOTIFICATION TO OWNER
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 7: Bug 6 - Direct Sighting Notification to Owner ---');
  
  // Create lost report owned by testRegUser
  const ownerReport = await db.createReport({
    type: 'lost',
    title: 'Scientific Calculator fx-991EX',
    category: 'Electronics',
    location: 'Library Hall A',
    description: 'Casio black scientific calculator',
    reportedBy: loginRes.body.user.name || testRegUser,
    userId: loginRes.body.user.id,
    userRole: 'student'
  });

  // Clear any existing notifications for owner
  await db.clearNotifications(loginRes.body.user.id);

  // Observer submits a sighting
  const observer = { id: 'observer-student-55', name: 'Observant Student', role: 'student' };
  const sightingMock = mockRequest('POST', `/api/alerts?action=sighting&id=${ownerReport.id}`, {
    observation: 'I saw this calculator on Table 14 in Library Hall A near the window.',
    location: 'Library Hall A - Table 14',
    userId: observer.id,
    userName: observer.name
  });
  const sightingRes = await sightingMock.run(alertsHandler);
  assert(sightingRes.status === 200 && sightingRes.body.success === true, `Sighting submission returned 200 success`);

  // Verify owner received direct notification
  const ownerNotifs = await db.getNotifications(loginRes.body.user.id);
  const sightingNotif = ownerNotifs.find(n => n.type === 'sighting');
  assert(sightingNotif !== undefined, `Owner received direct sighting notification`);
  assert(sightingNotif && sightingNotif.message.includes('Library Hall A'), `Sighting notification contains location/details`);

  // Verify admin did NOT receive direct sighting notification by default
  const adminNotifs = await db.getNotifications('admin-1');
  const adminSighting = (adminNotifs || []).find(n => n.reportId === ownerReport.id);
  assert(!adminSighting, `Admin was NOT spammed with direct item sighting notification`);

  // ----------------------------------------------------
  // TEST 8: FRONTEND SYNCHRONIZATION WITH PUBLIC FOLDER
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 8: Root and Public/ Mirror Synchronization ---');
  const rootApp = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const pubApp = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
  assert(rootApp === pubApp, 'root app.js matches public/app.js identically');

  const rootCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
  const pubCss = fs.readFileSync(path.join(__dirname, '..', 'public', 'styles.css'), 'utf8');
  assert(rootCss === pubCss, 'root styles.css matches public/styles.css identically');

  console.log('\n====================================================');
  console.log(`STAGE 4 VERIFICATION RESULTS: ${passed}/${total} PASSED`);
  console.log('====================================================');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runStage4Verification().catch(err => {
  console.error('FATAL ERROR DURING VERIFICATION:', err);
  process.exit(1);
});
