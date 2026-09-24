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

async function run() {
  const { data } = await supabase.from('users').select('*');
  for (const u of data) {
    console.log('\n--- User:', u.username, 'ID:', u.id, 'Role:', u.role);
    console.log('typeof phone:', typeof u.phone);
    if (typeof u.phone === 'object' && u.phone !== null) {
      console.log('Object keys in phone:', Object.keys(u.phone));
      console.log('Has passwordHash in phone object:', !!u.phone.passwordHash);
      if (u.phone.passwordHash) {
        const h = u.phone.passwordHash;
        const fmt = h.startsWith('scrypt:') ? 'scrypt' : h.length === 64 ? 'sha256' : `length_${h.length}`;
        console.log('Hash format:', fmt);
      }
    } else {
      console.log('Raw string phone:', u.phone);
    }
  }
}
run();
