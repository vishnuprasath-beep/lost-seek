const fs = require('fs');
const crypto = require('crypto');

const envLines = fs.readFileSync('.env.local', 'utf8').split('\n');
envLines.forEach(l => {
  const [k, ...v] = l.split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
});

const db = require('../server/db.js');
const { createClient } = require('@supabase/supabase-js');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

async function revertPassword() {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Fetch the specific user
    const { data: users, error } = await supabase.from('users').select('*').eq('username', 'sivavaiyapuri');
    if (error || !users || users.length === 0) {
      console.error('Error fetching user');
      return;
    }
    
    const user = users[0];
    const hashed = hashPassword('student123');
    
    await db.updateUser(user.id, { passwordHash: hashed });
    console.log(`Reverted ${user.username} back to student123 successfully.`);
  } catch(e) {
    console.error(e);
  }
}

revertPassword();
