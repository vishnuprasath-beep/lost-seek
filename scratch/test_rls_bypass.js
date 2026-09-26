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

async function testRLS() {
  const adminClient = createClient(url, key);
  
  // 1. Create a test table and enable RLS
  await adminClient.rpc('exec', { sql: `
    CREATE TABLE IF NOT EXISTS rls_test (id serial primary key, val text);
    INSERT INTO rls_test (val) VALUES ('secret') ON CONFLICT DO NOTHING;
    ALTER TABLE rls_test ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Deny all" ON rls_test;
    CREATE POLICY "Deny all" ON rls_test FOR SELECT USING (false);
  `}).catch(() => {}); // Assume it exists if RPC fails
  
  // Create user and get token
  const email = "test_rls_" + Date.now() + "@campus.edu";
  const { data: createData } = await adminClient.auth.admin.createUser({ email, password: "Password123!", email_confirm: true });
  const { data: signInData } = await adminClient.auth.signInWithPassword({ email, password: "Password123!" });
  const token = signInData.session.access_token;
  
  // Test 1: Admin Client (no token)
  const { data: adminData } = await adminClient.from('rls_test').select('*');
  console.log("Admin Client returned:", adminData?.length || 0, "rows (Expected: >0 because Service Role bypasses RLS)");
  
  // Test 2: User Client (Service Role Key + User Token)
  const userClient = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: userData, error: userError } = await userClient.from('rls_test').select('*');
  console.log("User Client (Service Role Key + Token) returned:", userData?.length || 0, "rows (Expected: 0 if RLS is enforced)");
  
  if (userError) console.error("User Client Error:", userError);
  
  // Clean up
  await adminClient.auth.admin.deleteUser(createData.user.id);
  // Drop table manually later if needed
}

testRLS();
