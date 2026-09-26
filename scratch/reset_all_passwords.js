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

async function resetPasswords() {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: users, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    console.log(`Found ${users.length} users. Resetting passwords...`);
    
    for (const user of users) {
      const defaultPass = user.role === 'admin' ? 'admin123' : 'student123';
      const hashed = hashPassword(defaultPass);
      
      try {
        await db.updateUser(user.id, { passwordHash: hashed });
        console.log(`Reset ${user.username} successfully to ${defaultPass}.`);
      } catch (err) {
        console.error(`Failed to update ${user.username}:`, err.message);
      }
    }
    console.log('All passwords have been reset.');
  } catch(e) {
    console.error(e);
  }
}

resetPasswords();
