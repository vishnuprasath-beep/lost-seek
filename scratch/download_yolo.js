const fs = require('fs');
const https = require('https');
const path = require('path');

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading from ${url} to ${dest}...`);
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
      }
      const total = parseInt(response.headers['content-length'] || '0', 10);
      let downloaded = 0;
      response.on('data', chunk => {
        downloaded += chunk.length;
        if (total) {
          const pct = ((downloaded / total) * 100).toFixed(1);
          process.stdout.write(`\rProgress: ${pct}% (${(downloaded / (1024*1024)).toFixed(1)} MB)`);
        }
      });
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          console.log('\nDownload complete!');
          resolve();
        });
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  const modelUrl = 'https://huggingface.co/Xenova/yolov8n/resolve/main/onnx/model.onnx';
  const targetPath = path.join(__dirname, '..', 'models', 'yolov8n.onnx');
  
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 1000000) {
    console.log('Model already exists at:', targetPath);
    return;
  }
  await downloadFile(modelUrl, targetPath);
  console.log('Model saved. File size:', fs.statSync(targetPath).size, 'bytes');
}

run().catch(err => {
  console.error('Error downloading YOLO model:', err);
  process.exit(1);
});
