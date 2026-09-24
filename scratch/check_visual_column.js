const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
function getEnv(key) {
  const match = env.match(new RegExp(key + '\\s*=\\s*["\']?([^"\'\\r\\n]+)'));
  return match ? match[1].trim() : null;
}

const url = getEnv('SUPABASE_URL');
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(url, key);

async function testRpc() {
  console.log('Testing column addition or RPC...');
  // Check if visual_attributes column exists or if we can query it
  const { data, error } = await supabase.from('reports').select('visual_attributes').limit(1);
  console.log('Select visual_attributes result:', { data, error: error ? error.message : null });
}

testRpc();
