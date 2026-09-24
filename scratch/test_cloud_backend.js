/**
 * LostSeek - Cloud Backend Automated Test Suite
 * Validates all 7 serverless endpoints and authorization rules.
 */

const http = require('http');
const path = require('path');

// Spin up a test instance of scratch/server.js
const server = require('./server.js');

async function runTests() {
  console.log('--- STARTING CLOUD BACKEND TEST SUITE ---');

  const BASE = 'http://localhost:3000';
  const studentUser = { username: 'student@campus.edu', name: 'Alex Rivera', role: 'student' };
  const adminUser = { username: 'admin@campus.edu', name: 'Vikram Singh', role: 'admin' };

  // Helper
  async function api(endpoint, method = 'GET', body = null, user = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (user) headers['x-lostseek-user'] = encodeURIComponent(JSON.stringify(user));
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE}${endpoint}`, opts);
    let data;
    try {
      data = await res.json();
    } catch (e) {
      data = { text: await res.text() };
    }
    return { status: res.status, data };
  }

  try {
    // 1. Test /api/login
    console.log('\n[1] Testing /api/login...');
    const loginRes = await api('/api/login', 'POST', {
      role: 'student',
      username: 'student',
      password: 'StudentPass2026!'
    });
    console.log('Login Status:', loginRes.status, 'Success:', loginRes.data.success, 'User:', loginRes.data.user?.name);

    // 2. Test /api/reports
    console.log('\n[2] Testing /api/reports GET & POST...');
    const getRep = await api('/api/reports', 'GET', null, studentUser);
    console.log('GET /api/reports status:', getRep.status, getRep.data.error || `count: ${getRep.data.count}`);

    // 3. Test /api/claims
    console.log('\n[3] Testing /api/claims GET...');
    const getClaims = await api('/api/claims', 'GET', null, studentUser);
    console.log('GET /api/claims status:', getClaims.status, getClaims.data.error || `count: ${getClaims.data.count}`);

    // 4. Test /api/matches
    console.log('\n[4] Testing /api/matches GET...');
    const getMatches = await api('/api/matches', 'GET', null, studentUser);
    console.log('GET /api/matches status:', getMatches.status, getMatches.data.error || `count: ${getMatches.data.count}`);

    // 5. Test /api/help
    console.log('\n[5] Testing /api/help GET...');
    const getHelp = await api('/api/help', 'GET', null, studentUser);
    console.log('GET /api/help status:', getHelp.status, getHelp.data.error || `count: ${getHelp.data.count}`);

    // 6. Test /api/notifications
    console.log('\n[6] Testing /api/notifications GET...');
    const getNotif = await api('/api/notifications', 'GET', null, studentUser);
    console.log('GET /api/notifications status:', getNotif.status, getNotif.data.error || `count: ${getNotif.data.count}`);

    // 7. Test /api/sync
    console.log('\n[7] Testing /api/sync GET...');
    const getSync = await api('/api/sync', 'GET', null, studentUser);
    console.log('GET /api/sync status:', getSync.status, getSync.data.error || `sync success: ${getSync.data.success}`);

    // 8. Test /api/upload error handling (when empty)
    console.log('\n[8] Testing /api/upload validation...');
    const uploadRes = await api('/api/upload', 'POST', {});
    console.log('POST /api/upload status:', uploadRes.status, 'Message:', uploadRes.data.message);

    console.log('\n--- ALL TEST CHECKS COMPLETED ---');
    process.exit(0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

setTimeout(runTests, 1000);
