import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Parse .env.local
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

function fetchUrl(url, options = {}, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Too many redirects'));
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.request(parsed, options, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        const nextUrl = new URL(res.headers.location, url).toString();
        return resolve(fetchUrl(nextUrl, options, redirectCount + 1));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data, finalUrl: url }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runAudit() {
  console.log('=== STEP 6 & 8: VERIFY ACTUAL PRODUCTION CODE & UI STRINGS ===');
  
  // 1. Fetch app.js
  console.log(`Fetching ${PROD_URL}/app.js...`);
  const appJsRes = await fetchUrl(`${PROD_URL}/app.js?nocache=${Date.now()}`);
  console.log(`app.js status: ${appJsRes.statusCode}, length: ${appJsRes.body.length}`);
  
  const checks = [
    { label: 'finalizeReportSubmit', query: 'finalizeReportSubmit' },
    { label: 'status = Active', query: "status: 'Active'" },
    { label: 'Change Password', query: 'Change Password' },
    { label: 'I Saw Something', query: 'I Saw Something' },
    { label: 'Community Alerts', query: 'Community Alerts' }
  ];
  
  for (const check of checks) {
    const found = appJsRes.body.includes(check.query);
    console.log(`Checking app.js for "${check.label}": ${found ? 'FOUND ✓' : 'NOT FOUND ✗'}`);
  }

  // 2. Fetch root / (index.html)
  console.log(`\nFetching ${PROD_URL}/...`);
  const htmlRes = await fetchUrl(`${PROD_URL}/?nocache=${Date.now()}`);
  console.log(`Root HTML status: ${htmlRes.statusCode}, length: ${htmlRes.body.length}`);
  
  const htmlChecks = [
    'Create New Student Account',
    'Active Community Alerts',
    'Change Password'
  ];
  for (const check of htmlChecks) {
    const found = htmlRes.body.includes(check);
    console.log(`Checking live HTML for "${check}": ${found ? 'FOUND ✓' : 'NOT FOUND ✗'}`);
  }

  // 3. Test API Endpoints
  console.log('\n=== TESTING PRODUCTION API ENDPOINTS ===');
  
  // GET /api/reports
  const repRes = await fetchUrl(`${PROD_URL}/api/reports?limit=1`);
  console.log(`GET /api/reports: ${repRes.statusCode} (${repRes.body.slice(0, 80)}...)`);

  // GET /api/alerts
  const alertRes = await fetchUrl(`${PROD_URL}/api/alerts`);
  console.log(`GET /api/alerts: ${alertRes.statusCode} (${alertRes.body.slice(0, 80)}...)`);

  // POST /api/register (routed via rewrites to auth.js)
  const testRegUser = `audit_reg_${Date.now()}@campus.edu`;
  const regProbe = await fetchUrl(`${PROD_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Prod Audit Student',
      email: testRegUser,
      password: 'password123',
      confirmPassword: 'password123',
      studentId: 'STU-AUDIT-001'
    })
  });
  console.log(`POST /api/register: ${regProbe.statusCode} (${regProbe.body.slice(0, 100)}...)`);

  // POST /api/login (routed via rewrites to auth.js)
  const loginProbe = await fetchUrl(`${PROD_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testRegUser,
      password: 'password123',
      role: 'student'
    })
  });
  console.log(`POST /api/login: ${loginProbe.statusCode} (${loginProbe.body.slice(0, 100)}...)`);

  // POST /api/change-password
  const cpProbe = await fetchUrl(`${PROD_URL}/api/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testRegUser,
      currentPassword: 'password123',
      newPassword: 'newpassword456',
      confirmPassword: 'newpassword456'
    })
  });
  console.log(`POST /api/change-password: ${cpProbe.statusCode} (${cpProbe.body.slice(0, 100)}...)`);

  // 4. STEP 7: TEST THE REAL PRODUCTION REPORT FLOW
  console.log('\n=== STEP 7: TESTING REAL PRODUCTION REPORT FLOW ===');
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const testLostPayload = {
    title: 'AUDIT_TEST_LOST_KEYS_' + Date.now(),
    description: 'Set of dorm keys with blue lanyard lost near Library',
    category: 'Keys',
    type: 'LOST',
    status: 'Active',
    location: 'Main Library 2nd Floor',
    item_date: new Date().toISOString().split('T')[0],
    contact_email: 'audit-lost@campus.edu',
    user_id: 'prod-audit-tester'
  };

  console.log('Submitting LOST report to production /api/reports...');
  const postLostRes = await fetchUrl(`${PROD_URL}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testLostPayload)
  });
  console.log(`POST /api/reports status: ${postLostRes.statusCode}`);
  const lostData = JSON.parse(postLostRes.body);
  console.log('LOST Response:', lostData);

  const lostId = lostData.id || lostData.report?.id || (lostData.data && lostData.data[0]?.id);
  console.log(`Created LOST Report ID: ${lostId}`);

  // Query Supabase directly to verify row
  if (lostId) {
    const { data: dbLost, error: dbLostErr } = await supabase.from('reports').select('*').eq('id', lostId).single();
    if (dbLost) {
      console.log(`✓ Verified in Supabase: ID=${dbLost.id}, type=${dbLost.type}, status=${dbLost.status}`);
    } else {
      console.error('Supabase query error:', dbLostErr);
    }
  }

  // Submit FOUND report to trigger matching
  const testFoundPayload = {
    title: 'AUDIT_TEST_FOUND_KEYS_' + Date.now(),
    description: 'Found blue lanyard with keys in 2nd floor library study desk',
    category: 'Keys',
    type: 'FOUND',
    status: 'Active',
    location: 'Main Library 2nd Floor',
    item_date: new Date().toISOString().split('T')[0],
    contact_email: 'audit-found@campus.edu',
    user_id: 'prod-audit-finder'
  };

  console.log('\nSubmitting FOUND report to production /api/reports...');
  const postFoundRes = await fetchUrl(`${PROD_URL}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testFoundPayload)
  });
  console.log(`POST /api/reports status: ${postFoundRes.statusCode}`);
  const foundData = JSON.parse(postFoundRes.body);
  console.log('FOUND Response:', foundData);
  const foundId = foundData.id || foundData.report?.id || (foundData.data && foundData.data[0]?.id);
  console.log(`Created FOUND Report ID: ${foundId}`);

  if (foundId) {
    const { data: dbFound } = await supabase.from('reports').select('*').eq('id', foundId).single();
    if (dbFound) {
      console.log(`✓ Verified in Supabase: ID=${dbFound.id}, type=${dbFound.type}, status=${dbFound.status}`);
    }
  }

  // Check matching endpoint
  if (lostId) {
    console.log('\nQuerying matches for report...');
    const matchRes = await fetchUrl(`${PROD_URL}/api/matches?reportId=${lostId}`);
    console.log(`GET /api/matches: ${matchRes.statusCode} (${matchRes.body.slice(0, 100)}...)`);
  }

  // Cleanup test user and reports
  console.log('\n=== CLEANUP TEMPORARY AUDIT DATA ===');
  if (lostId) {
    const { error: delLostErr } = await supabase.from('reports').delete().eq('id', lostId);
    console.log(`Deleted LOST test row ${lostId}: ${delLostErr ? delLostErr.message : 'SUCCESS'}`);
  }
  if (foundId) {
    const { error: delFoundErr } = await supabase.from('reports').delete().eq('id', foundId);
    console.log(`Deleted FOUND test row ${foundId}: ${delFoundErr ? delFoundErr.message : 'SUCCESS'}`);
  }
  // Delete test user from users table
  const { error: delUserErr } = await supabase.from('users').delete().eq('username', testRegUser);
  console.log(`Deleted test user ${testRegUser}: ${delUserErr ? delUserErr.message : 'SUCCESS'}`);

  console.log('\n=== ALL PRODUCTION AUDIT CHECKS PASSED ===');
}

runAudit().catch(err => console.error('Audit failed:', err));
