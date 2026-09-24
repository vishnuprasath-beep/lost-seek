import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectUsersTable() {
  console.log('Inspecting Supabase users table...');
  const { data, error } = await supabase.from('users').select('*').limit(10);
  if (error) {
    console.error('Error selecting users:', error);
    return;
  }
  console.log('Number of users found:', data.length);
  if (data.length > 0) {
    console.log('Available columns in users table:');
    const cols = Object.keys(data[0]);
    console.log(cols);
    
    // Inspect each user record (WITHOUT exposing password/hash)
    data.forEach((u, i) => {
      console.log(`\nUser [${i}]:`);
      console.log(`  id: ${u.id}`);
      console.log(`  username: ${u.username}`);
      console.log(`  name: ${u.name}`);
      console.log(`  role: ${u.role}`);
      console.log(`  student_id: ${u.student_id}`);
      console.log(`  phone type/sample: ${typeof u.phone} (isJSON: ${String(u.phone).startsWith('{')})`);
      
      // Check which column has password/hash data
      cols.forEach(col => {
        if (col.toLowerCase().includes('pass') || col.toLowerCase().includes('hash') || col.toLowerCase().includes('auth')) {
          const val = u[col];
          const hasVal = !!val;
          const format = !val ? 'empty' : 
            val.startsWith('scrypt:') ? 'scrypt' :
            val.startsWith('$2') ? 'bcrypt' :
            val.length === 64 ? 'sha256' :
            val.length === 32 ? 'md5' :
            `length_${val.length}`;
          console.log(`  column [${col}]: hasValue=${hasVal}, detected_format=${format}`);
        }
      });
      
      // Check phone column if it contains JSON with passwordHash
      if (String(u.phone).startsWith('{')) {
        try {
          const p = JSON.parse(u.phone);
          const pVal = p.passwordHash;
          const format = !pVal ? 'empty' : 
            pVal.startsWith('scrypt:') ? 'scrypt' :
            pVal.startsWith('$2') ? 'bcrypt' :
            pVal.length === 64 ? 'sha256' :
            `length_${pVal.length}`;
          console.log(`  inside phone JSON: hasPasswordHash=${!!pVal}, format=${format}`);
        } catch(e) {}
      }
    });
  }
}

inspectUsersTable().catch(console.error);
