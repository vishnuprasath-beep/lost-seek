const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envFile = path.join(__dirname, '..', '.env.local');
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

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function run() {
  const idsToDelete = [
    'usr-1789834311933-378', 
    'usr-1789834064550-280', 
    'usr-1789835026954-727', 
    'usr-1789835575865-883', 
    'usr-alex', 
    'usr-vishnu-p'
  ];
  const { error } = await supabase.from('users').delete().in('id', idsToDelete);
  if (error) console.error(error);
  else console.log('Cleaned extra test accounts.');
}

run();
