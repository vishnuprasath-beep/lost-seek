const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const envPath = path.join(__dirname, '..', '.env.local');
const lines = fs.readFileSync(envPath, 'utf8').split('\n');
const envs = {};

for (const line of lines) {
  const match = line.match(/^\s*([A-Za-z0-9_]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envs[match[1]] = val;
  }
}

const supabaseUrl = envs['SUPABASE_URL'];
const supabaseKey = envs['SUPABASE_SERVICE_ROLE_KEY'];

if (supabaseUrl && supabaseKey) {
  try {
    console.log('Adding SUPABASE_URL...');
    execSync(`npx vercel env add SUPABASE_URL production,preview,development`, {
      input: supabaseUrl,
      stdio: ['pipe', 'inherit', 'inherit']
    });
    console.log('Successfully added SUPABASE_URL');

    console.log('Adding SUPABASE_SERVICE_ROLE_KEY...');
    execSync(`npx vercel env add SUPABASE_SERVICE_ROLE_KEY production,preview,development`, {
      input: supabaseKey,
      stdio: ['pipe', 'inherit', 'inherit']
    });
    console.log('Successfully added SUPABASE_SERVICE_ROLE_KEY');

    console.log('Triggering redeploy...');
    execSync(`npx vercel --prod`, { stdio: 'inherit' });
    console.log('Redeploy complete!');
  } catch (err) {
    console.error('Error executing Vercel CLI:', err.message);
  }
} else {
  console.error('Could not find Supabase env vars in .env.local');
}
