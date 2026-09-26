const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
let SUPABASE_URL = '';
let SUPABASE_SERVICE_ROLE_KEY = '';

env.split('\n').forEach(line => {
  if (line.startsWith('SUPABASE_URL=')) SUPABASE_URL = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) SUPABASE_SERVICE_ROLE_KEY = line.split('=')[1].trim();
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function probeTables() {
  const tables = [
    'users', 'reports', 'claims', 'matches', 'help_requests', 'notifications', 
    'community_alert', 'community_alerts', 'sightings', 'sighting', 'help_request', 'notification', 'claim', 'match', 'user', 'report'
  ];
  
  console.log('Probing tables...');
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('id').limit(1);
      if (error) {
        console.log(`Table '${table}' ERROR:`, error.message);
      } else {
        console.log(`Table '${table}' EXISTS!`);
      }
    } catch (e) {
      console.log(`Table '${table}' CATCH:`, e.message);
    }
  }
}

probeTables();
