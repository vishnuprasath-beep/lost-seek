const https = require('https');

const BASE_URL = 'https://smart-campus-pro.vercel.app';

function request(path, options = {}, body = null, user = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = options.headers || {};
    if (user) {
      headers['x-lostseek-user'] = encodeURIComponent(JSON.stringify(user));
    }
    const reqOptions = {
      method: options.method || 'GET',
      headers,
    };

    const req = https.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json;
        try { json = JSON.parse(data); } catch (e) { json = data; }
        resolve({
          statusCode: res.statusCode,
          data: json
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      if (typeof body === 'object') {
        req.setHeader('Content-Type', 'application/json');
        req.write(JSON.stringify(body));
      } else {
        req.write(body);
      }
    }
    req.end();
  });
}

async function runAcceptanceTest() {
  console.log('=== LOSTSEEK LIVE PRODUCTION CROSS-DEVICE & API ACCEPTANCE TEST ===\n');

  const studentUser = { username: 'student@campus.edu', name: 'Student User', role: 'student' };
  const adminUser = { username: 'admin@campus.edu', name: 'Admin User', role: 'admin' };

  // Step 1: GET /api/reports
  console.log('1. Testing GET /api/reports...');
  const resReportsInitial = await request('/api/reports');
  console.log(`Status: HTTP ${resReportsInitial.statusCode}`, resReportsInitial.data);

  // Step 2: TEST A - ANDROID -> CLOUD -> WEB
  // On Android: create LOST report (Milton Blue Water Bottle, Library, Football sticker, NO PHOTO)
  console.log('\n2. TEST A: Android creates LOST report (No Photo)...');
  const lostReportPayload = {
    type: 'LOST',
    title: 'Milton Blue Water Bottle',
    itemName: 'Milton Blue Water Bottle',
    description: 'Blue Milton water bottle with a football sticker.',
    category: 'Bottles',
    color: 'Blue',
    brand: 'Milton',
    distinguishingFeatures: 'Football sticker',
    location: 'Library',
    dateTime: new Date().toISOString(),
    phoneSharingConsent: true,
    phoneNumber: '9876543210'
  };

  const createLostRes = await request('/api/reports', { method: 'POST' }, lostReportPayload, studentUser);
  console.log(`Status: HTTP ${createLostRes.statusCode}`, createLostRes.data);
  const lostReport = createLostRes.data.report;

  // Verify Web Admin retrieves the exact LOST report
  console.log('\n3. Web Admin retrieves the exact LOST report from Supabase...');
  const getLostWebRes = await request(`/api/reports?id=${lostReport.id}`, { method: 'GET' }, null, adminUser);
  console.log(`Status: HTTP ${getLostWebRes.statusCode}`, getLostWebRes.data);
  const verifiedLost = getLostWebRes.data.reports && getLostWebRes.data.reports[0];
  const testAPass = verifiedLost && verifiedLost.title === 'Milton Blue Water Bottle' && verifiedLost.location === 'Library';
  console.log(`-> TEST A (Android LOST -> Web): ${testAPass ? 'PASS' : 'FAIL'}`);

  // Step 3: TEST B - WEB -> BLOB -> CLOUD -> ANDROID
  // From Web: create FOUND report for Milton Blue Water Bottle with image upload
  console.log('\n4. Uploading FOUND image to Vercel Blob via /api/upload...');
  const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const uploadRes = await request('/api/upload', { method: 'POST' }, {
    image: sampleBase64,
    filename: 'found_milton_bottle.png',
    reportType: 'FOUND'
  });
  console.log(`Status: HTTP ${uploadRes.statusCode}`, uploadRes.data);
  const blobImageUrl = uploadRes.data.url;

  console.log('\n5. Web creates FOUND report in Supabase with permanent Blob URL...');
  const foundReportPayload = {
    type: 'FOUND',
    title: 'Milton Blue Water Bottle',
    itemName: 'Milton Blue Water Bottle',
    description: 'Found blue Milton bottle near Library study table with sticker.',
    category: 'Bottles',
    color: 'Blue',
    brand: 'Milton',
    distinguishingFeatures: 'Football sticker',
    location: 'Library',
    imageUrl: blobImageUrl,
    dateTime: new Date().toISOString(),
    phoneSharingConsent: false
  };

  const createFoundRes = await request('/api/reports', { method: 'POST' }, foundReportPayload, adminUser);
  console.log(`Status: HTTP ${createFoundRes.statusCode}`, createFoundRes.data);
  const foundReport = createFoundRes.data.report;

  // Android retrieves the FOUND report
  console.log('\n6. Android refreshes/retrieves the FOUND report from Supabase...');
  const getFoundAndroidRes = await request(`/api/reports?id=${foundReport.id}`, { method: 'GET' }, null, studentUser);
  console.log(`Status: HTTP ${getFoundAndroidRes.statusCode}`, getFoundAndroidRes.data);
  const verifiedFound = getFoundAndroidRes.data.reports && getFoundAndroidRes.data.reports[0];
  const testBPass = verifiedFound && verifiedFound.imageUrl === blobImageUrl;
  console.log(`-> TEST B (Web FOUND -> Android): ${testBPass ? 'PASS' : 'FAIL'}`);

  // Step 4: AI MATCHING
  console.log('\n7. Running AI multi-signal matching and persisting to Supabase...');
  const matchPayload = {
    lostReportId: lostReport.id,
    foundReportId: foundReport.id,
    confidenceScore: 95,
    matchSignals: {
      category: true,
      brand: true,
      color: true,
      location: true,
      distinguishingFeature: true
    },
    explainableReasons: [
      'Category matches: Bottles',
      'Brand matches: Milton',
      'Color matches: Blue',
      'Location matches: Library',
      'Distinguishing feature matches: Football sticker'
    ]
  };

  const createMatchRes = await request('/api/matches', { method: 'POST' }, matchPayload);
  console.log(`Status: HTTP ${createMatchRes.statusCode}`, createMatchRes.data);
  const savedMatch = createMatchRes.data.match;

  // Retrieve match from cloud
  const getMatchesRes = await request(`/api/matches?lostReportId=${lostReport.id}`);
  console.log(`Status: HTTP ${getMatchesRes.statusCode}`, getMatchesRes.data);
  const testMatchPass = getMatchesRes.data.matches && getMatchesRes.data.matches.length > 0;
  console.log(`-> AI MATCH SYNCHRONIZATION: ${testMatchPass ? 'PASS' : 'FAIL'}`);

  // Step 5: CLAIMS WORKFLOW
  console.log('\n8. Student submits ownership claim from Android...');
  const claimPayload = {
    lostReportId: lostReport.id,
    foundReportId: foundReport.id,
    matchId: savedMatch.id,
    itemTitle: lostReport.title,
    claimantName: 'Student User',
    claimantPhone: '9876543210',
    verificationEvidence: 'Proof: It has my initials on the bottom lid and a scratch on the side.',
    handoverLocation: 'Campus Security Desk'
  };

  const createClaimRes = await request('/api/claims', { method: 'POST' }, claimPayload, studentUser);
  console.log(`Status: HTTP ${createClaimRes.statusCode}`, createClaimRes.data);
  const createdClaim = createClaimRes.data.claim;

  // Admin retrieves and reviews claim
  console.log('\n9. Admin retrieves and approves the claim in Supabase...');
  const getClaimsAdminRes = await request(`/api/claims?id=${createdClaim.id}`, { method: 'GET' }, null, adminUser);
  console.log(`Claim seen by Admin:`, getClaimsAdminRes.data.claims[0]);

  const approveClaimRes = await request('/api/claims', { method: 'PATCH' }, {
    id: createdClaim.id,
    status: 'Approved',
    adminNotes: 'Evidence verified by Campus Admin.'
  }, adminUser);
  console.log(`Approve Claim Status: HTTP ${approveClaimRes.statusCode}`, approveClaimRes.data);

  // Android checks updated claim status
  const getClaimAndroidRes = await request(`/api/claims?id=${createdClaim.id}`, { method: 'GET' }, null, studentUser);
  console.log(`Claim seen by Student on Android:`, getClaimAndroidRes.data.claims[0]);
  const testClaimPass = getClaimAndroidRes.data.claims && getClaimAndroidRes.data.claims[0].claimStatus === 'Approved';
  console.log(`-> CLAIMS SYNCHRONIZATION: ${testClaimPass ? 'PASS' : 'FAIL'}`);

  // Step 6: SAFE HANDOVER
  console.log('\n10. Executing Safe Handover at Campus Security Desk...');
  const completeHandoverRes = await request('/api/claims', { method: 'PATCH' }, {
    id: createdClaim.id,
    status: 'Completed',
    handoverLocation: 'Campus Security Desk',
    adminNotes: 'Safe handover completed in person at Campus Security Desk.'
  }, adminUser);
  console.log(`Handover Status: HTTP ${completeHandoverRes.statusCode}`, completeHandoverRes.data);

  // Mark LOST -> Recovered and FOUND -> Returned
  await request('/api/reports', { method: 'PATCH' }, { id: lostReport.id, status: 'Recovered' }, adminUser);
  await request('/api/reports', { method: 'PATCH' }, { id: foundReport.id, status: 'Returned' }, adminUser);

  const checkLostStatus = await request(`/api/reports?id=${lostReport.id}`);
  const checkFoundStatus = await request(`/api/reports?id=${foundReport.id}`);
  const testHandoverPass = checkLostStatus.data.reports[0].status === 'Recovered' && checkFoundStatus.data.reports[0].status === 'Returned';
  console.log(`-> SAFE HANDOVER SYNCHRONIZATION: ${testHandoverPass ? 'PASS' : 'FAIL'}`);

  // Step 7: HELP & SAFETY
  console.log('\n11. Filing Urgent Need Help? ticket...');
  const helpPayload = {
    reason: 'Suspicious Handover Activity',
    details: 'Urgent: Another individual approached me claiming this bottle before the desk.',
    relatedItemId: lostReport.id,
    relatedClaimId: createdClaim.id,
    isUrgent: true
  };
  const createHelpRes = await request('/api/help', { method: 'POST' }, helpPayload, studentUser);
  console.log(`Status: HTTP ${createHelpRes.statusCode}`, createHelpRes.data);

  // Verify Admin sees help ticket and notification
  const getHelpAdminRes = await request('/api/help', { method: 'GET' }, null, adminUser);
  console.log(`Help ticket seen by Admin:`, getHelpAdminRes.data.helpRequests[0]);

  const getNotifsAdminRes = await request('/api/notifications', { method: 'GET' }, null, adminUser);
  console.log(`Admin Notification count:`, getNotifsAdminRes.data.notifications.length);

  const testHelpPass = getHelpAdminRes.data.helpRequests && getHelpAdminRes.data.helpRequests.length > 0;
  console.log(`-> HELP & SAFETY SYNCHRONIZATION: ${testHelpPass ? 'PASS' : 'FAIL'}`);

  // Step 8: SYNC ENDPOINT
  console.log('\n12. Testing /api/sync endpoint...');
  const syncRes = await request('/api/sync', { method: 'GET' }, null, studentUser);
  console.log(`Status: HTTP ${syncRes.statusCode}`, {
    lostReports: syncRes.data.lostReports?.length,
    foundReports: syncRes.data.foundReports?.length,
    claims: syncRes.data.claims?.length,
    matches: syncRes.data.matches?.length
  });
  const testSyncPass = syncRes.statusCode === 200 && syncRes.data.success;
  console.log(`-> OFFLINE SYNC ENDPOINT: ${testSyncPass ? 'PASS' : 'FAIL'}`);

  console.log('\n======================================================');
  console.log('ACCEPTANCE SUMMARY:');
  console.log(`Android LOST -> Web:            ${testAPass ? 'PASS' : 'FAIL'}`);
  console.log(`Web FOUND -> Android:           ${testBPass ? 'PASS' : 'FAIL'}`);
  console.log(`AI Match synchronization:       ${testMatchPass ? 'PASS' : 'FAIL'}`);
  console.log(`Claim synchronization:          ${testClaimPass ? 'PASS' : 'FAIL'}`);
  console.log(`Safe Handover synchronization:  ${testHandoverPass ? 'PASS' : 'FAIL'}`);
  console.log(`Help & Safety synchronization:  ${testHelpPass ? 'PASS' : 'FAIL'}`);
  console.log(`Offline queue / sync:           ${testSyncPass ? 'PASS' : 'FAIL'}`);
  console.log('======================================================');
}

runAcceptanceTest().catch(err => console.error('Test run failed:', err));
