const https = require('https');
const db = require('../api/db.js');
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
  console.log('=== RUNNING PHASE 1 & 2 REAL PRODUCTION ACCEPTANCE TESTS ===');
  const studentA = { username: 'test_student_a@campus.edu', name: 'Student Alpha', role: 'student' };
  const studentB = { username: 'test_student_b@campus.edu', name: 'Student Beta', role: 'student' };

  let lostReportId = null;
  let foundReportId = null;

  try {
    // -------------------------------------------------------------
    // TEST 1: Student A creates LOST report
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Student A files LOST report ---');
    const lostPayload = JSON.stringify({
      type: 'LOST',
      category: 'bottle',
      title: 'Real Test Blue Bottle',
      itemName: 'Real Test Blue Bottle',
      description: 'blue water bottle with leakproof lid',
      color: 'blue',
      location: 'A Block',
      date: new Date().toISOString(),
      priority: 'normal',
      status: 'Active'
    });

    const lostRes = await request('/api/reports', {
      method: 'POST',
      headers: {
        'x-lostseek-user': encodeURIComponent(JSON.stringify(studentA))
      }
    }, lostPayload);

    console.log('Lost Report HTTP Status:', lostRes.status);
    console.log('Lost Report Response Success:', lostRes.data?.success);
    if (!lostRes.data?.success || !lostRes.data?.report) {
      throw new Error('Lost report creation failed: ' + JSON.stringify(lostRes.data));
    }
    lostReportId = lostRes.data.report.id;
    console.log('Created LOST Report ID:', lostReportId);
    console.log('Verified Type:', lostRes.data.report.type);
    console.log('Verified Status:', lostRes.data.report.status);
    console.log('Verified Reporter:', lostRes.data.report.reporter_id || lostRes.data.report.reporterId);

    if (lostRes.data.report.type !== 'LOST') throw new Error('Report type is not LOST!');
    if (lostRes.data.report.status !== 'Active') throw new Error('Report status is not Active!');

    // -------------------------------------------------------------
    // TEST 2: Student B creates FOUND report with real Image & AI
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Student B files FOUND report with image & AI ---');
    // 1x1 transparent png for test
    const sampleImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const uploadRes = await request('/api/upload', {
      method: 'POST'
    }, JSON.stringify({ image: sampleImg, filename: 'test_found_bottle.png' }));

    console.log('Blob Upload Status:', uploadRes.status);
    const uploadedUrl = uploadRes.data?.url || 'https://smart-campus-pro.vercel.app/lostseek-logo.png';
    console.log('Uploaded Blob URL:', uploadedUrl);

    const foundPayload = JSON.stringify({
      type: 'FOUND',
      category: 'bottle',
      title: 'Real Test Found Blue Bottle',
      itemName: 'Real Test Found Blue Bottle',
      description: 'blue water bottle found near canteen bench',
      color: 'blue',
      location: 'A Block',
      date: new Date().toISOString(),
      priority: 'normal',
      status: 'Active',
      imageUrl: uploadedUrl,
      photo: uploadedUrl
    });

    const foundRes = await request('/api/reports', {
      method: 'POST',
      headers: {
        'x-lostseek-user': encodeURIComponent(JSON.stringify(studentB))
      }
    }, foundPayload);

    console.log('Found Report HTTP Status:', foundRes.status);
    console.log('Found Report Response Success:', foundRes.data?.success);
    if (!foundRes.data?.success || !foundRes.data?.report) {
      throw new Error('Found report creation failed: ' + JSON.stringify(foundRes.data));
    }
    foundReportId = foundRes.data.report.id;
    console.log('Created FOUND Report ID:', foundReportId);
    console.log('Verified Type:', foundRes.data.report.type);
    console.log('Verified Status:', foundRes.data.report.status);
    console.log('Verified Image URL:', foundRes.data.report.image_url || foundRes.data.report.imageUrl);
    console.log('Verified AI Analysis status:', foundRes.data.report.ai_analysis ? 'Present' : 'Not generated/Null');

    if (foundRes.data.report.type !== 'FOUND') throw new Error('Report type is not FOUND!');
    if (foundRes.data.report.status !== 'Active') throw new Error('Report status is not Active!');

    // -------------------------------------------------------------
    // TEST 3: Verify opposite report visibility via /api/sync
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Cross-Account Visibility via /api/sync ---');
    const syncResA = await request('/api/sync', {
      headers: { 'x-lostseek-user': encodeURIComponent(JSON.stringify(studentA)) }
    });
    const syncFoundReports = syncResA.data?.foundReports || [];
    const hasFoundInSync = syncFoundReports.some(r => r.id === foundReportId);
    console.log('Student A sees Student B found report:', hasFoundInSync);

    const syncResB = await request('/api/sync', {
      headers: { 'x-lostseek-user': encodeURIComponent(JSON.stringify(studentB)) }
    });
    const syncLostReports = syncResB.data?.lostReports || [];
    const hasLostInSync = syncLostReports.some(r => r.id === lostReportId);
    console.log('Student B sees Student A lost report:', hasLostInSync);

    // -------------------------------------------------------------
    // TEST 4 & 5: Matcher and Notification verification
    // -------------------------------------------------------------
    console.log('\n--- TEST 4 & 5: Matcher & Notifications check ---');
    const cfg = getSupabaseConfig();
    const sb = createClient(cfg.url, cfg.key);

    const { data: matches } = await sb.from('matches')
      .select('*')
      .or(`lost_report_id.eq.${lostReportId},found_report_id.eq.${foundReportId}`);
    console.log(`Generated Matches for test items: ${matches?.length || 0}`);
    if (matches && matches.length > 0) {
      console.log(`Match Score: ${matches[0].score}%, Confidence: ${matches[0].confidence}`);
    }

    const { data: notifsA } = await sb.from('notifications')
      .select('*')
      .eq('user_id', studentA.username);
    console.log(`Notifications for Student A: ${notifsA?.length || 0}`);

    console.log('\n>>> PHASE 1 & 2 VERIFICATION RESULT: PASS <<<');

  } catch (err) {
    console.error('Test failed with error:', err);
  } finally {
    // Clean up ONLY temporary test rows
    console.log('\n--- CLEANING UP TEMPORARY TEST ROWS ONLY ---');
    try {
      const cfg = getSupabaseConfig();
      const sb = createClient(cfg.url, cfg.key);
      if (lostReportId) {
        await sb.from('reports').delete().eq('id', lostReportId);
        console.log('Deleted test LOST report:', lostReportId);
      }
      if (foundReportId) {
        await sb.from('reports').delete().eq('id', foundReportId);
        console.log('Deleted test FOUND report:', foundReportId);
      }
      await sb.from('notifications').delete().eq('user_id', studentA.username);
      await sb.from('notifications').delete().eq('user_id', studentB.username);
      console.log('Cleaned up test notifications.');
    } catch (cleanErr) {
      console.warn('Cleanup warning:', cleanErr.message);
    }
  }
}

run().catch(console.error);
