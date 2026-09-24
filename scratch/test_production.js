// Test live deployed endpoints on https://smart-campus-pro.vercel.app
const https = require('https');

const BASE_URL = 'https://smart-campus-pro.vercel.app';

function request(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = https.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
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

async function runTests() {
  console.log(`Starting Production Tests against ${BASE_URL}...\n`);

  // 1. GET /
  const home = await request('/');
  console.log(`1. GET /: HTTP ${home.statusCode} - Page length: ${typeof home.data === 'string' ? home.data.length : 'N/A'}`);

  // 2. POST /api/login
  const loginStudent = await request('/api/login', { method: 'POST' }, { username: 'student', password: 'password123' });
  console.log(`2. POST /api/login (student): HTTP ${loginStudent.statusCode}`, loginStudent.data);

  // 3. GET /api/reports
  const getReports = await request('/api/reports');
  console.log(`3. GET /api/reports: HTTP ${getReports.statusCode}`, typeof getReports.data === 'object' ? { error: getReports.data.error, message: getReports.data.message, count: getReports.data.reports?.length } : getReports.data);

  // 4. POST /api/reports
  const postReport = await request('/api/reports', { method: 'POST' }, {
    report_type: 'LOST',
    title: 'Milton Blue Water Bottle',
    description: 'Lost in Library 2nd floor with football sticker',
    category: 'Bottle',
    color: 'Blue',
    brand: 'Milton',
    distinguishing_tokens: 'football sticker',
    location: 'Central Library',
    reporter_name: 'Prakash (Student)',
    phone: '9876543210',
    allow_phone_share: false
  });
  console.log(`4. POST /api/reports: HTTP ${postReport.statusCode}`, postReport.data);

  // 5. PATCH /api/reports
  const patchReport = await request('/api/reports', { method: 'PATCH' }, {
    id: 'test-report-id',
    status: 'RECOVERED'
  });
  console.log(`5. PATCH /api/reports: HTTP ${patchReport.statusCode}`, patchReport.data);

  // 6. GET /api/claims
  const getClaims = await request('/api/claims');
  console.log(`6. GET /api/claims: HTTP ${getClaims.statusCode}`, typeof getClaims.data === 'object' ? { error: getClaims.data.error, message: getClaims.data.message, count: getClaims.data.claims?.length } : getClaims.data);

  // 7. POST /api/claims
  const postClaim = await request('/api/claims', { method: 'POST' }, {
    report_id: 'sample-report',
    claimant_name: 'Test Student',
    claimant_phone: '9876543210',
    verification_evidence: 'Small scratch on lid'
  });
  console.log(`7. POST /api/claims: HTTP ${postClaim.statusCode}`, postClaim.data);

  // 8. PATCH /api/claims
  const patchClaim = await request('/api/claims', { method: 'PATCH' }, {
    id: 'sample-claim-id',
    status: 'APPROVED',
    notes: 'Approved by admin'
  });
  console.log(`8. PATCH /api/claims: HTTP ${patchClaim.statusCode}`, patchClaim.data);

  // 9. GET /api/matches
  const getMatches = await request('/api/matches');
  console.log(`9. GET /api/matches: HTTP ${getMatches.statusCode}`, typeof getMatches.data === 'object' ? { error: getMatches.data.error, message: getMatches.data.message } : getMatches.data);

  // 10. POST /api/matches
  const postMatch = await request('/api/matches', { method: 'POST' }, {
    lost_report_id: 'lost-1',
    found_report_id: 'found-1',
    confidence_score: 92,
    match_signals: { category: true, brand: true, color: true, tokens: true },
    explainable_reasons: ['Brand matches: Milton', 'Color matches: Blue', 'Distinguishing feature: Football sticker']
  });
  console.log(`10. POST /api/matches: HTTP ${postMatch.statusCode}`, postMatch.data);

  // 11. GET /api/help
  const getHelp = await request('/api/help');
  console.log(`11. GET /api/help: HTTP ${getHelp.statusCode}`, typeof getHelp.data === 'object' ? { error: getHelp.data.error, message: getHelp.data.message } : getHelp.data);

  // 12. POST /api/help
  const postHelp = await request('/api/help', { method: 'POST' }, {
    student_name: 'Test Student',
    student_contact: '9876543210',
    category: 'Handover Safety Dispute',
    description: 'Someone claimed my Milton bottle falsely',
    flagged_report_id: 'lost-1',
    freeze_handover: true
  });
  console.log(`12. POST /api/help: HTTP ${postHelp.statusCode}`, postHelp.data);

  // 13. PATCH /api/help
  const patchHelp = await request('/api/help', { method: 'PATCH' }, {
    id: 'ticket-1',
    status: 'RESOLVED',
    resolution_notes: 'Verified ownership in person'
  });
  console.log(`13. PATCH /api/help: HTTP ${patchHelp.statusCode}`, patchHelp.data);

  // 14. GET /api/notifications
  const getNotifs = await request('/api/notifications');
  console.log(`14. GET /api/notifications: HTTP ${getNotifs.statusCode}`, typeof getNotifs.data === 'object' ? { error: getNotifs.data.error, message: getNotifs.data.message } : getNotifs.data);

  // 15. POST /api/notifications
  const postNotif = await request('/api/notifications', { method: 'POST' }, {
    user_id: 'student-1',
    title: 'Match Found',
    body: 'A potential match for your Milton Bottle was found.',
    type: 'MATCH_ALERT'
  });
  console.log(`15. POST /api/notifications: HTTP ${postNotif.statusCode}`, postNotif.data);

  // 16. POST /api/upload (without body to check validation)
  const postUpload = await request('/api/upload', { method: 'POST' }, {
    filename: 'test.jpg'
  });
  console.log(`16. POST /api/upload (empty data test): HTTP ${postUpload.statusCode}`, postUpload.data);

  // 17. GET /api/sync
  const getSync = await request('/api/sync');
  console.log(`17. GET /api/sync: HTTP ${getSync.statusCode}`, typeof getSync.data === 'object' ? { error: getSync.data.error, message: getSync.data.message } : getSync.data);

  // 18. POST /api/sync
  const postSync = await request('/api/sync', { method: 'POST' }, {
    pendingReports: [],
    pendingClaims: []
  });
  console.log(`18. POST /api/sync: HTTP ${postSync.statusCode}`, typeof postSync.data === 'object' ? { error: postSync.data.error, message: postSync.data.message } : postSync.data);

  console.log('\n--- Production Verification Complete ---');
}

runTests().catch(err => console.error(err));
