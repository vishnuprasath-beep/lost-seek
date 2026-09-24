const https = require('https');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
function getEnv(key) {
  const match = env.match(new RegExp(key + '\\s*=\\s*["\']?([^"\'\\r\\n]+)'));
  return match ? match[1].trim() : null;
}

const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');

const sql = 'ALTER TABLE reports ADD COLUMN IF NOT EXISTS visual_attributes JSONB; ALTER TABLE reports ADD COLUMN IF NOT EXISTS visual_analysis_status TEXT DEFAULT \'not_requested\';';

const payload = JSON.stringify({ query: sql });

const req = https.request({
  hostname: 'ajsbtuwtvfsrvfyozzro.supabase.co',
  path: '/pg/query',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': 'Bearer ' + key,
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (err) => console.error('Error:', err));
req.write(payload);
req.end();
