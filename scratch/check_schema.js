const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envLines = fs.readFileSync('.env.local', 'utf8').split('\n');
envLines.forEach(l => {
  const [k, ...v] = l.split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
});

async function checkSchema() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Try to fetch users and just check keys of the first user
  const { data: users, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  
  if (users && users.length > 0) {
    const user = users[0];
    console.log("Columns present in 'users' table:");
    console.log(Object.keys(user).join(', '));
    
    if (user.hasOwnProperty('password_hash')) {
      console.log("SUCCESS: password_hash column found!");
    } else {
      console.log("ERROR: password_hash column NOT found!");
    }
  } else {
    console.log("No users found to check schema.");
  }
}

checkSchema();
