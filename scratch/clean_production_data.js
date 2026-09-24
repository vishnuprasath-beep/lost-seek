// scratch/clean_production_data.js
// Safely resets all old demo/test records from Supabase:
// reports, matches, claims, help_requests, notifications
// Preserves users table and schemas completely.

const fs = require('fs');
const path = require('path');

// Load environment from .env.local
const envFile = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf8').split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)=(.*)$/);
    if (match) {
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[match[1]] = val;
    }
  }
}

const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ajsbtuwtvfsrvfyozzro.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

async function cleanData() {
  console.log('--- CLEANING OLD DEMO/TEST DATA FROM SUPABASE ---');

  // Order of deletion to respect foreign keys:
  // 1. matches
  const { error: matchErr, count: matchCount } = await supabase
    .from('matches')
    .delete()
    .neq('id', 'keep_none_placeholder');
  console.log('Deleted matches. Error:', matchErr ? matchErr.message : 'none');

  // 2. claims
  const { error: claimErr } = await supabase
    .from('claims')
    .delete()
    .neq('id', 'keep_none_placeholder');
  console.log('Deleted claims. Error:', claimErr ? claimErr.message : 'none');

  // 3. help_requests
  const { error: helpErr } = await supabase
    .from('help_requests')
    .delete()
    .neq('id', 'keep_none_placeholder');
  console.log('Deleted help_requests. Error:', helpErr ? helpErr.message : 'none');

  // 4. notifications
  const { error: notifErr } = await supabase
    .from('notifications')
    .delete()
    .neq('id', 'keep_none_placeholder');
  console.log('Deleted notifications. Error:', notifErr ? notifErr.message : 'none');

  // 5. reports
  const { error: repErr } = await supabase
    .from('reports')
    .delete()
    .neq('id', 'keep_none_placeholder');
  console.log('Deleted reports. Error:', repErr ? repErr.message : 'none');

  // Verify counts
  const tables = ['reports', 'matches', 'claims', 'help_requests', 'notifications'];
  console.log('\n--- VERIFYING CLEAN DATABASE STATE ---');
  let clean = true;
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(`Table ${t}: ${count} rows`);
    if (count !== 0) clean = false;
  }

  const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
  console.log(`Table users: ${userCount} rows (PRESERVED)`);

  if (clean && userCount > 0) {
    console.log('\nSUCCESS: Database is now completely clean and ready for real production use!');
  } else {
    console.error('\nWARNING: Some tables could not be fully cleaned.');
  }
}

cleanData().catch(e => {
  console.error('Cleanup script error:', e);
  process.exit(1);
});
