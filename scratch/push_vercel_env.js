const fs = require('fs');
const { spawnSync } = require('child_process');

const env = fs.readFileSync('.env.local', 'utf8');
function getEnv(key) {
  const match = env.match(new RegExp(key + '\\s*=\\s*["\']?([^"\'\\r\\n]+)'));
  return match ? match[1].trim() : null;
}

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

function setVercelEnv(name, value) {
  console.log(`Configuring Vercel Environment Variable: ${name}...`);
  for (const envType of ['production', 'preview', 'development']) {
    const res = spawnSync('npx.cmd', ['vercel', 'env', 'add', name, envType, '--force'], {
      input: value,
      encoding: 'utf8',
      shell: true
    });
    console.log(`Added ${name} to ${envType}:`, res.status === 0 ? 'SUCCESS' : res.stderr || res.stdout);
  }
}

setVercelEnv('SUPABASE_URL', supabaseUrl);
setVercelEnv('SUPABASE_SERVICE_ROLE_KEY', supabaseKey);
console.log('All Supabase environment variables pushed to Vercel!');
