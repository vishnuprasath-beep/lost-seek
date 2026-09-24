const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
function getEnv(key) {
  const match = env.match(new RegExp(key + '\\s*=\\s*["\']?([^"\'\\r\\n]+)'));
  return match ? match[1].trim() : null;
}

const url = getEnv('SUPABASE_URL');
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!url || !key) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function verifyTables() {
  console.log('Testing connection to Supabase:', url);
  const tables = ['users', 'reports', 'claims', 'matches', 'help_requests', 'notifications'];
  const results = {};

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        results[table] = { ok: false, error: error.message };
      } else {
        results[table] = { ok: true, count: data.length };
      }
    } catch (e) {
      results[table] = { ok: false, error: e.message };
    }
  }

  console.log('Table Verification Results:');
  console.table(results);
}

verifyTables().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
