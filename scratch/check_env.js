const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const hasUrl = /SUPABASE_URL\s*=\s*['"]?(https:\/\/[^'"\s]+)/i.test(env);
const hasKey = /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"]?([^'"\s]+)/i.test(env);
const urlMatch = env.match(/SUPABASE_URL\s*=\s*['"]?(https:\/\/[^'"\s]+)/i);
console.log('HAS_URL:', hasUrl);
console.log('URL_REF:', urlMatch ? urlMatch[1] : 'NONE');
console.log('HAS_SERVICE_ROLE_KEY:', hasKey);
