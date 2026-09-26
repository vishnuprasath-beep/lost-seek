const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envLines = fs.readFileSync('.env.local', 'utf8').split('\n');
const env = {};
envLines.forEach(l => {
  const [k, ...v] = l.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
});

async function checkDb() {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase.from('reports').select('*');
  if (error) {
    console.error('Error fetching reports:', error);
    return;
  }
  
  console.log(`Total reports: ${data.length}`);
  data.forEach(r => {
    console.log(`- ${r.id}: ${r.title} (Reporter: ${r.reporter_name}, ID: ${r.reporter_id})`);
  });
}

checkDb();
