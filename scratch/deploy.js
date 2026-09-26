const fs = require('fs');
const { execSync } = require('child_process');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const match = envLocal.match(/^VERCEL_OIDC_TOKEN="([^"]+)"/m);
if (match) {
  const token = match[1];
  try {
    console.log("Deploying to Vercel...");
    execSync(`vercel --prod --token "${token}" --yes`, { stdio: 'inherit' });
    console.log("Deployment successful!");
  } catch (err) {
    console.error("Deploy failed:", err.message);
  }
} else {
  console.error("Token not found");
}
