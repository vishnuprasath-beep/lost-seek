const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = '.env.local';
let url, key;
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  const urlMatch = env.match(/SUPABASE_URL="([^"]+)"/);
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY="([^"]+)"/);
  if (urlMatch) url = urlMatch[1];
  if (keyMatch) key = keyMatch[1];
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function testMigration() {
  const email = "test_migrate_" + Date.now() + "@campus.edu";
  const password = "TestPassword123!";
  
  console.log("Creating user:", email);
  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'student', name: 'Test User' }
  });
  
  if (createError) {
    console.error("Create Error:", createError);
    return;
  }
  console.log("Created successfully, UID:", createData.user.id);
  
  console.log("Signing in...");
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (signInError) {
    console.error("Sign In Error:", signInError);
    return;
  }
  
  console.log("Sign In Success! Access Token length:", signInData.session.access_token.length);
  
  // Clean up
  await supabase.auth.admin.deleteUser(createData.user.id);
  console.log("Cleaned up user.");
}

testMigration();
