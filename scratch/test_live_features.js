const https = require('https');

function checkURL(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, length: data.length, body: data });
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Testing live deployment at https://smart-campus-pro.vercel.app ...');
  
  const main = await checkURL('https://smart-campus-pro.vercel.app');
  console.log(`Main Page Status: ${main.statusCode}, Length: ${main.length}`);

  const hasHelpSafety = main.body.includes('id="help-safety-page"');
  const hasAdminHelp = main.body.includes('id="admin-help-page"');
  const hasItemHelpModal = main.body.includes('id="item-help-modal"');
  const hasAblock = main.body.includes('value="A Block"');
  const hasSaffron = main.body.includes('value="Saffron Canteen"');
  const hasTiruchengode = main.body.includes('Tiruchengode Police Station');

  console.log('Live Checks:');
  console.log('- help-safety-page present:', hasHelpSafety);
  console.log('- admin-help-page present:', hasAdminHelp);
  console.log('- item-help-modal present:', hasItemHelpModal);
  console.log('- A Block in options:', hasAblock);
  console.log('- Saffron Canteen in options:', hasSaffron);
  console.log('- Tiruchengode in contacts:', hasTiruchengode);

  if (hasHelpSafety && hasAdminHelp && hasItemHelpModal && hasAblock && hasSaffron && hasTiruchengode) {
    console.log('✓ ALL LIVE HTML CHECKS PASSED ON PRODUCTION VERCEL DEPLOYMENT!');
  } else {
    console.error('✗ Some checks failed!');
    process.exit(1);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
