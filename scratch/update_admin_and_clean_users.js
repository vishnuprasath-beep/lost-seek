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

if (!SUPABASE_KEY || !SUPABASE_URL) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

async function run() {
  console.log('Fetching users to clean up...');
  
  // Update admin name to "Naveen"
  const { data: adminUsers, error: adminErr } = await supabase
    .from('users')
    .select('id, username')
    .eq('role', 'admin');
    
  if (adminErr) {
    console.error('Error fetching admin:', adminErr);
  } else if (adminUsers && adminUsers.length > 0) {
    for (const admin of adminUsers) {
      console.log(`Updating admin ${admin.username} (${admin.id}) name to Naveen...`);
      await supabase.from('users').update({ name: 'Naveen' }).eq('id', admin.id);
    }
  } else {
    // If no explicit role=admin found, look for username='admin'
    console.log('Looking for username=admin...');
    await supabase.from('users').update({ name: 'Naveen' }).eq('username', 'admin');
  }

  // Find all users
  const { data: allUsers, error: allErr } = await supabase.from('users').select('id, username, name');
  if (allErr) {
    console.error('Error fetching all users:', allErr);
    return;
  }

  const idsToDelete = [];
  for (const u of allUsers) {
    const un = (u.username || '').toLowerCase();
    const nm = (u.name || '').toLowerCase();
    const id = (u.id || '').toLowerCase();
    
    const isTest = un.startsWith('teststudent_') || 
                   un.startsWith('auto.student') || 
                   un.includes('tester') ||
                   id === 'usr-vishnu-v' ||
                   id === 'usr-siva' ||
                   id === 'usr-boobathy' ||
                   id === 'usr-krish' ||
                   id === 'usr-girl1';
                   
    // Keep admin, keep the vishnuprasath email
    if (isTest && un !== 'admin' && u.role !== 'admin') {
      idsToDelete.push(u.id);
    }
  }

  if (idsToDelete.length > 0) {
    console.log(`Deleting ${idsToDelete.length} fake/test accounts...`, idsToDelete);
    const { error: delErr } = await supabase.from('users').delete().in('id', idsToDelete);
    if (delErr) {
      console.error('Error deleting users:', delErr);
    } else {
      console.log('Successfully deleted test accounts.');
    }
  } else {
    console.log('No test accounts found to delete.');
  }
}

run().then(() => console.log('Done.')).catch(console.error);
