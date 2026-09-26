const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envLines = fs.readFileSync('.env.local', 'utf8').split('\n');
envLines.forEach(l => {
  const [k, ...v] = l.split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
});

async function migrate() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // 1. Fetch all users
  const { data: users, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('Failed to fetch users:', error);
    return;
  }
  
  console.log(`Found ${users.length} users. Migrating data...`);
  let requiresMigration = false;

  for (const user of users) {
    let phoneStr = user.phone;
    if (phoneStr && phoneStr.startsWith('{')) {
      requiresMigration = true;
      try {
        const parsed = JSON.parse(phoneStr);
        console.log(`Migrating user ${user.username}...`);
        
        // We will attempt to update the row with the new columns.
        // If the columns don't exist, this might fail, so we'll see the error.
        const { error: updateErr } = await supabase.from('users').update({
          phone: parsed.phone || '',
          password_hash: parsed.passwordHash || '',
          avatar_url: parsed.avatarUrl || ''
        }).eq('id', user.id);
        
        if (updateErr) {
          console.error(`Error updating ${user.username}:`, updateErr.message);
        } else {
          console.log(`Successfully migrated ${user.username}.`);
        }
      } catch(e) {
        console.error(`Failed to parse phone JSON for ${user.username}:`, e.message);
      }
    }
  }
  
  if (!requiresMigration) {
    console.log("No users found with JSON in the phone column.");
  }
}

migrate();
