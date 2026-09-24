const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

async function run() {
  const usersToRecover = [
    {
      id: 'usr-vishnu-p',
      username: 'vishnu.prasath',
      name: 'Vishnu Prasath',
      role: 'student',
      student_id: 'STU-2026-1011',
      phone: JSON.stringify({ phone: '', avatarUrl: '', passwordHash: 'scrypt:...' }),
      created_at: new Date().toISOString()
    },
    {
      id: 'usr-vishnu-v',
      username: 'vishnu.varthan',
      name: 'Vishnu Varthan',
      role: 'student',
      student_id: 'STU-2026-1012',
      phone: JSON.stringify({ phone: '', avatarUrl: '', passwordHash: 'scrypt:...' }),
      created_at: new Date().toISOString()
    },
    {
      id: 'usr-siva',
      username: 'sivavaiyapuri',
      name: 'Sivavaiyapuri',
      role: 'student',
      student_id: 'STU-2026-1013',
      phone: JSON.stringify({ phone: '', avatarUrl: '', passwordHash: 'scrypt:...' }),
      created_at: new Date().toISOString()
    },
    {
      id: 'usr-boobathy',
      username: 'boobathy',
      name: 'Boobathy',
      role: 'student',
      student_id: 'STU-2026-1014',
      phone: JSON.stringify({ phone: '', avatarUrl: '', passwordHash: 'scrypt:...' }),
      created_at: new Date().toISOString()
    },
    {
      id: 'usr-krish',
      username: 'krish',
      name: 'Krish',
      role: 'student',
      student_id: 'STU-2026-1015',
      phone: JSON.stringify({ phone: '', avatarUrl: '', passwordHash: 'scrypt:...' }),
      created_at: new Date().toISOString()
    },
    {
      id: 'usr-girl1',
      username: 'krishnaveni', // Renamed from girl1
      name: 'Krishnaveni',     // Renamed from Girl1
      role: 'student',
      student_id: 'STU-2026-1016',
      phone: JSON.stringify({ phone: '', avatarUrl: '', passwordHash: 'scrypt:...' }),
      created_at: new Date().toISOString()
    }
  ];

  for (const u of usersToRecover) {
    console.log(`Recovering ${u.name}...`);
    const { error } = await supabase.from('users').upsert(u);
    if (error) {
      console.error(`Error recovering ${u.name}:`, error);
    }
  }
  console.log('Recovery complete.');
}

run().catch(console.error);
