/**
 * LostSeek - Verification Test Suite:
 * 1. LOST Report Image Authorization & Privacy
 * 2. Profile Avatar Persistence, Synchronization & Access Control
 */

const assert = require('assert');
const db = require('../server/db.js');
const { evaluateHeuristicMatch } = require('../server/matcher.js');
const authHandler = require('../api/auth.js');
const reportsHandler = require('../api/reports.js');
const syncHandler = require('../api/sync.js');

function mockReqRes(options = {}) {
  const req = {
    url: options.url || '/',
    method: options.method || 'GET',
    headers: options.headers || {},
    body: options.body || {}
  };
  let statusCode = 200;
  let responseData = null;
  const headers = {};

  const res = {
    setHeader: (k, v) => { headers[k.toLowerCase()] = v; },
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
    },
    end: () => res
  };

  return { req, res, getResult: () => ({ statusCode, data: responseData, headers }) };
}

async function runTests() {
  console.log('========================================================');
  console.log('RUNNING LOSTSEEK PRIVACY & PROFILE AVATAR TEST SUITE');
  console.log('========================================================\n');

  // -------------------------------------------------------------------
  // TEST 1: Heuristic Match Scoring (Never category alone)
  // -------------------------------------------------------------------
  console.log('[Test 1] Testing evaluateHeuristicMatch rules...');
  const lostItem = {
    id: 'lost-test-1',
    category: 'electronics',
    title: 'Apple iPhone 14 Pro Max Space Black',
    description: 'Lost near Central Library with matte blue case',
    color: 'black',
    location: 'Central Library',
    brand: 'Apple',
    distinguishingFeatures: 'tiny scratch near speaker'
  };

  const foundItemDifferentCat = {
    id: 'found-diff-cat',
    category: 'clothing',
    title: 'Blue jacket with black zipper',
    description: 'Found at Central Library',
    color: 'blue',
    location: 'Central Library'
  };
  const diffCatMatch = evaluateHeuristicMatch(lostItem, foundItemDifferentCat);
  assert.strictEqual(diffCatMatch.isMatch, false, 'Different category must not match');

  const foundItemCategoryOnly = {
    id: 'found-cat-only',
    category: 'electronics',
    title: 'Random USB Dongle',
    description: 'Unknown plastic piece found at Sports Complex',
    color: 'white',
    location: 'Sports Complex',
    brand: 'Generic'
  };
  const catOnlyMatch = evaluateHeuristicMatch(lostItem, foundItemCategoryOnly);
  assert.strictEqual(catOnlyMatch.isMatch, false, 'Category match ALONE must NOT be a meaningful match');

  const foundItemMeaningful = {
    id: 'found-meaningful-1',
    category: 'electronics',
    title: 'Found iPhone smartphone in black case',
    description: 'Found on 2nd floor Central Library reading desk',
    color: 'black',
    location: 'Central Library',
    brand: 'Apple'
  };
  const meaningfulMatch = evaluateHeuristicMatch(lostItem, foundItemMeaningful);
  assert.strictEqual(meaningfulMatch.isMatch, true, 'Corroborated multi-signal item must match');
  assert.ok(meaningfulMatch.score >= 50, `Score should be >= 50, got ${meaningfulMatch.score}`);
  console.log('✓ Heuristic match tests passed (Category alone rejected, multi-signal accepted).\n');

  // -------------------------------------------------------------------
  // TEST 2: Server-Side Image Privacy in db.getReports
  // -------------------------------------------------------------------
  console.log('[Test 2] Testing server-side image privacy in db.getReports...');

  const timestamp = Date.now();
  const testOwner = { username: `lostowner_${timestamp}@campus.edu`, id: `usr-owner-${timestamp}`, role: 'student' };
  const testFoundReporter = { username: `finder_${timestamp}@campus.edu`, id: `usr-finder-${timestamp}`, role: 'student' };
  const testUnrelatedStudent = { username: `stranger_${timestamp}@campus.edu`, id: `usr-stranger-${timestamp}`, role: 'student' };
  const testAdmin = { username: 'admin@campus.edu', id: 'usr-admin', role: 'admin' };

  // Create test LOST report with real photo
  const lostRepData = {
    id: `lost-test-${timestamp}`,
    type: 'LOST',
    title: 'Engineering Casio Calculator FX-991CW',
    category: 'electronics',
    color: 'black',
    location: 'Academic Block B',
    description: 'Black Casio scientific calculator with name sticker',
    photo: 'https://smart-campus-pro.vercel.app/test-lost-image.jpg',
    reporterId: testOwner.username,
    reporterName: 'Lost Owner Student'
  };
  const createdLost = await db.createReport(lostRepData, testOwner);

  // Create meaningfully matched FOUND report by testFoundReporter
  const foundRepData = {
    id: `found-test-${timestamp}`,
    type: 'FOUND',
    title: 'Found Scientific Calculator Casio',
    category: 'electronics',
    color: 'black',
    location: 'Academic Block B',
    description: 'Found black Casio FX series calculator in Block B lab',
    photo: 'https://smart-campus-pro.vercel.app/test-found-image.jpg',
    reporterId: testFoundReporter.username,
    reporterName: 'Finder Student'
  };
  const createdFound = await db.createReport(foundRepData, testFoundReporter);

  // A. LOST OWNER: Must see own image
  const ownerReports = await db.getReports({ id: createdLost.id }, testOwner);
  assert.ok(ownerReports.length > 0);
  assert.strictEqual(ownerReports[0].photo, lostRepData.photo, 'Owner must receive own lost image');
  assert.strictEqual(ownerReports[0].imageUrl, lostRepData.photo, 'Owner must receive own lost imageUrl');
  console.log('✓ LOST Owner can view own image.');

  // B. ADMIN: Must see lost image
  const adminReports = await db.getReports({ id: createdLost.id }, testAdmin);
  assert.ok(adminReports.length > 0);
  assert.strictEqual(adminReports[0].photo, lostRepData.photo, 'Admin must receive lost image');
  console.log('✓ Admin can view lost image.');

  // C. SIMILAR FOUND REPORTER: Must see lost image with imageSharedForMatch = true
  const finderReports = await db.getReports({ id: createdLost.id }, testFoundReporter);
  assert.ok(finderReports.length > 0);
  assert.strictEqual(finderReports[0].photo, lostRepData.photo, 'Matched finder must receive lost image');
  assert.strictEqual(finderReports[0].imageSharedForMatch, true, 'imageSharedForMatch flag must be true');
  console.log('✓ Meaningfully matched Found Reporter can view lost image with imageSharedForMatch = true.');

  // D. UNRELATED STUDENT: Must NOT receive lost image URL
  const strangerReports = await db.getReports({ id: createdLost.id }, testUnrelatedStudent);
  assert.ok(strangerReports.length > 0);
  assert.strictEqual(strangerReports[0].photo, null, 'Unrelated student must NOT receive photo');
  assert.strictEqual(strangerReports[0].imageUrl, null, 'Unrelated student must NOT receive imageUrl');
  assert.strictEqual(strangerReports[0].imageSharedForMatch, false, 'imageSharedForMatch must be false');
  console.log('✓ Unrelated student is blocked server-side from receiving lost image.');

  // E. UNAUTHENTICATED REQUEST: Must NOT receive lost image URL
  const publicReports = await db.getReports({ id: createdLost.id }, null);
  assert.ok(publicReports.length > 0);
  assert.strictEqual(publicReports[0].photo, null, 'Public unauthenticated caller must NOT receive photo');
  assert.strictEqual(publicReports[0].imageUrl, null, 'Public unauthenticated caller must NOT receive imageUrl');
  console.log('✓ Unauthenticated caller is blocked server-side from receiving lost image.\n');

  // -------------------------------------------------------------------
  // TEST 3: API Layer Reports Endpoint (/api/reports)
  // -------------------------------------------------------------------
  console.log('[Test 3] Testing /api/reports route privacy enforcement...');
  // As stranger via header
  const { req: rReq, res: rRes, getResult: rResult } = mockReqRes({
    url: `/api/reports?id=${createdLost.id}`,
    method: 'GET',
    headers: { 'x-lostseek-user': encodeURIComponent(JSON.stringify(testUnrelatedStudent)) }
  });
  await reportsHandler(rReq, rRes);
  const rResData = rResult().data;
  assert.ok(rResData && rResData.success);
  assert.strictEqual(rResData.reports[0].photo, null, 'API must not leak photo to stranger');
  assert.strictEqual(rResData.reports[0].imageUrl, null, 'API must not leak imageUrl to stranger');
  console.log('✓ /api/reports verified secure against image leakage.\n');

  // -------------------------------------------------------------------
  // TEST 4: Profile Avatar Single Source of Truth & Persistence
  // -------------------------------------------------------------------
  console.log('[Test 4] Testing Profile Avatar persistence & API data flow...');

  const avatarTestUser = `avataruser_${timestamp}@campus.edu`;
  const initialAvatar = 'https://smart-campus-pro.vercel.app/test-avatar-1.jpg';
  const updatedAvatar = 'https://smart-campus-pro.vercel.app/test-avatar-cropped-2.jpg';

  // 1. Create user
  await db.createUser({
    username: avatarTestUser,
    name: 'Avatar Test Student',
    role: 'student',
    studentId: `STU-AV-${timestamp}`,
    avatarUrl: initialAvatar,
    passwordHash: 'scrypt:test:hash'
  });

  // 2. Fetch user
  const loadedUser = await db.getUser(avatarTestUser);
  assert.strictEqual(loadedUser.avatarUrl, initialAvatar, 'Initial avatar must persist in db');

  // 3. Update avatar via /api/auth?action=profile
  const { req: profReq, res: profRes, getResult: profResult } = mockReqRes({
    url: '/api/auth?action=profile',
    method: 'POST',
    headers: { 'x-lostseek-user': encodeURIComponent(JSON.stringify({ username: avatarTestUser, role: 'student' })) },
    body: {
      username: avatarTestUser,
      avatarUrl: updatedAvatar
    }
  });
  await authHandler(profReq, profRes);
  const profData = profResult().data;
  assert.strictEqual(profResult().statusCode, 200);
  assert.strictEqual(profData.profile.avatarUrl, updatedAvatar, 'Updated avatar returned by profile endpoint');

  // 4. Verify in DB
  const userAfterUpdate = await db.getUser(avatarTestUser);
  assert.strictEqual(userAfterUpdate.avatarUrl, updatedAvatar, 'DB has updated avatar');

  // 5. Verify via /api/sync
  const { req: syncReq, res: syncRes, getResult: syncResult } = mockReqRes({
    url: '/api/sync',
    method: 'GET',
    headers: { 'x-lostseek-user': encodeURIComponent(JSON.stringify({ username: avatarTestUser, role: 'student' })) }
  });
  await syncHandler(syncReq, syncRes);
  const syncData = syncResult().data;
  assert.ok(syncData && syncData.user, 'Sync returned user profile');
  assert.strictEqual(syncData.user.avatarUrl, updatedAvatar, 'Sync returned updated avatarUrl');
  assert.strictEqual(syncData.user.profilePicture, updatedAvatar, 'Sync returned updated profilePicture alias');

  // 6. Verify Admin directory /api/auth?action=users
  const { req: usersReq, res: usersRes, getResult: usersResult } = mockReqRes({
    url: '/api/auth?action=users',
    method: 'GET',
    headers: { 'x-lostseek-user': encodeURIComponent(JSON.stringify({ username: 'admin@campus.edu', role: 'admin' })) }
  });
  await authHandler(usersReq, usersRes);
  assert.strictEqual(usersResult().statusCode, 200);
  const directory = usersResult().data.users;
  assert.ok(Array.isArray(directory), 'Users directory is an array');
  const foundStudentInDir = directory.find(u => u.username === avatarTestUser);
  assert.ok(foundStudentInDir, 'Student found in admin directory');
  assert.strictEqual(foundStudentInDir.avatarUrl, updatedAvatar, 'Admin receives the student newly updated avatar');
  console.log('✓ Admin users directory returns student newly updated avatar.');

  // 7. Non-admin access to /api/auth?action=users is forbidden
  const { req: nonAdminReq, res: nonAdminRes, getResult: nonAdminResult } = mockReqRes({
    url: '/api/auth?action=users',
    method: 'GET',
    headers: { 'x-lostseek-user': encodeURIComponent(JSON.stringify({ username: avatarTestUser, role: 'student' })) }
  });
  await authHandler(nonAdminReq, nonAdminRes);
  assert.strictEqual(nonAdminResult().statusCode, 403, 'Non-admin must receive 403 Forbidden on user directory');
  console.log('✓ Non-admin access to /api/auth?action=users is properly forbidden (403).\n');

  // Cleanup test reports
  try {
    await db.deleteReport(createdLost.id, testAdmin);
    await db.deleteReport(createdFound.id, testAdmin);
  } catch (e) {}

  console.log('========================================================');
  console.log('ALL TESTS PASSED WITH 100% SUCCESS!');
  console.log('========================================================');
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
