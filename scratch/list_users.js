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
  
  const { data: users, error: errUsers } = await supabase.from('users').select('*');
  if (errUsers) console.error(errUsers);
  
  console.log('--- USERS ---');
  (users || []).forEach(u => {
    console.log(`- ${u.username}: ${u.name} (Role: ${u.role})`);
  });
  
  // Delete the test report I created earlier
  await supabase.from('reports').delete().eq('reporter_id', 'anonymous');
  
}

checkDb();
