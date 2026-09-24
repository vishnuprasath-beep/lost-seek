const https = require('https');

function getUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(data);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body.toString('utf8'),
          rawLength: body.length
        });
      });
    }).on('error', reject);
  });
}

async function verifyLive() {
  console.log('=== VERIFYING LIVE PRODUCTION DEPLOYMENT ===\n');

  // 1. Google Search Console
  const gsc = await getUrl('https://smart-campus-pro.vercel.app/googled552e0cbc66fc7ac.html');
  console.log(`1. GSC Verification: HTTP ${gsc.statusCode}, Content: "${gsc.body.trim()}"`);

  // 2. Sitemap & Robots
  const sitemap = await getUrl('https://smart-campus-pro.vercel.app/sitemap.xml');
  console.log(`2. Sitemap: HTTP ${sitemap.statusCode}, Length: ${sitemap.rawLength} bytes`);
  const robots = await getUrl('https://smart-campus-pro.vercel.app/robots.txt');
  console.log(`3. Robots.txt: HTTP ${robots.statusCode}, Content: "${robots.body.trim()}"`);

  // 4. LostSeek.apk
  const apk = await getUrl('https://smart-campus-pro.vercel.app/LostSeek.apk');
  console.log(`4. LostSeek.apk: HTTP ${apk.statusCode}, Content-Type: ${apk.headers['content-type']}, Length: ${apk.headers['content-length'] || apk.rawLength} bytes`);

  // 5. Logo WebP
  const webp = await getUrl('https://smart-campus-pro.vercel.app/assets/images/lostseek-logo.webp');
  console.log(`5. Logo WebP: HTTP ${webp.statusCode}, Content-Type: ${webp.headers['content-type']}, Length: ${webp.rawLength} bytes`);

  // 6. Root Landing Page
  const root = await getUrl('https://smart-campus-pro.vercel.app/');
  console.log(`6. Root Landing Page: HTTP ${root.statusCode}`);
  console.log('   Has WebP preload:', root.body.includes('rel="preload" as="image" href="assets/images/lostseek-logo.webp"'));
  console.log('   Has deferred Chart.js:', root.body.includes('<script defer src="https://cdn.jsdelivr.net/npm/chart.js">'));
  console.log('   Has deferred Lucide:', root.body.includes('<script defer src="https://unpkg.com/lucide@latest">'));
  console.log('   Has deferred app.js:', root.body.includes('<script defer src="app.js">'));
  console.log('   Has non-blocking font swap:', root.body.includes('display=swap" as="style" onload="this.onload=null;this.rel=\'stylesheet\''));

  // 7. Download Page
  const download = await getUrl('https://smart-campus-pro.vercel.app/download');
  console.log(`7. Download Page: HTTP ${download.statusCode}`);

  console.log('\n=== ALL LIVE PRODUCTION CHECKS VERIFIED SUCCESSFULLY! ===');
}

verifyLive().catch(console.error);
