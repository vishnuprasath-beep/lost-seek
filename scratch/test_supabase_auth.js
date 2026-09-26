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
if (!url || !key) {
  console.error("Missing credentials");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });
async function testAuth() {
  console.log("Testing Supabase Auth...");
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Error listing users:", error.message);
  } else {
    console.log("Success! Found", data.users.length, "users in auth.users.");
  }
}
testAuth();
