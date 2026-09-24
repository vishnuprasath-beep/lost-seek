const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

async function verifyLiveApk() {
  const url = 'https://smart-campus-pro.vercel.app/LostSeek.apk';
  console.log('====================================================');
  console.log('VERIFYING PRODUCTION APK DOWNLOAD:');
  console.log(url);
  console.log('====================================================\n');

  const localPath = 'LostSeek.apk';
  if (!fs.existsSync(localPath)) {
    console.error('Local LostSeek.apk does not exist!');
    process.exit(1);
  }
  const localBuf = fs.readFileSync(localPath);
  const localSize = localBuf.length;
  const localHash = crypto.createHash('sha256').update(localBuf).digest('hex').toUpperCase();

  console.log(`Local APK Path:      ${localPath}`);
  console.log(`Local File Size:     ${localSize} bytes`);
  console.log(`Local SHA-256:       ${localHash}\n`);

  console.log(`Sending GET request to ${url}...`);
  const response = await fetch(url, { redirect: 'follow' });

  console.log(`Response Status:     ${response.status} ${response.statusText}`);
  console.log(`Content-Type:        ${response.headers.get('content-type')}`);
  console.log(`Content-Length:      ${response.headers.get('content-length')}`);
  console.log(`Content-Disposition: ${response.headers.get('content-disposition')}`);
  console.log(`Cache-Control:       ${response.headers.get('cache-control')}`);

  if (response.status !== 200) {
    console.error(`\nFAILED: Expected HTTP 200 but received ${response.status}`);
    process.exit(1);
  }

  const arrayBuffer = await response.arrayBuffer();
  const downloadedBuf = Buffer.from(arrayBuffer);
  const downloadedSize = downloadedBuf.length;
  const downloadedHash = crypto.createHash('sha256').update(downloadedBuf).digest('hex').toUpperCase();

  console.log(`\nDownloaded Size:     ${downloadedSize} bytes`);
  console.log(`Downloaded SHA-256:  ${downloadedHash}`);

  const sizeMatches = (localSize === downloadedSize);
  const hashMatches = (localHash === downloadedHash);

  console.log(`\nSize Verification:   ${sizeMatches ? 'MATCH [PASS]' : 'MISMATCH [FAIL]'}`);
  console.log(`Hash Verification:   ${hashMatches ? 'MATCH [PASS]' : 'MISMATCH [FAIL]'}`);

  if (sizeMatches && hashMatches) {
    console.log('\n====================================================');
    console.log('ALL CHECKS PASSED: APK IS FULLY DOWNLOADABLE & VERIFIED!');
    console.log('====================================================');
    process.exit(0);
  } else {
    console.error('\nCHECKS FAILED: Downloaded APK does not match local build.');
    process.exit(1);
  }
}

verifyLiveApk().catch(err => {
  console.error('Error during APK download verification:', err);
  process.exit(1);
});
