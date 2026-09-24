import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('users').select('password_hash').limit(1);
  console.log('Select password_hash result:', error ? error.message : 'EXISTS! ' + JSON.stringify(data));

  const { data: pData, error: pError } = await supabase.from('users').select('password').limit(1);
  console.log('Select password result:', pError ? pError.message : 'EXISTS! ' + JSON.stringify(pData));

  // Check what phone column accepts
  const { data: u0 } = await supabase.from('users').select('*').eq('id', 'usr-admin').single();
  console.log('usr-admin row:', u0);
}

check();
