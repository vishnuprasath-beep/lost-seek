const fs = require('fs');
const { execSync } = require('child_process');

const zipPath = 'C:\\Users\\prakash c\\AppData\\Local\\Android\\Sdk\\cmdline-tools.zip';
const targetDir = 'C:\\Users\\prakash c\\AppData\\Local\\Android\\Sdk\\cmdline-tools';

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

console.log('Extracting cmdline-tools with tar...');
execSync(`tar -xf "${zipPath}" -C "${targetDir}"`, { stdio: 'inherit' });
console.log('Extraction complete.');

const extracted = 'C:\\Users\\prakash c\\AppData\\Local\\Android\\Sdk\\cmdline-tools\\cmdline-tools';
const latest = 'C:\\Users\\prakash c\\AppData\\Local\\Android\\Sdk\\cmdline-tools\\latest';

if (fs.existsSync(extracted)) {
  if (fs.existsSync(latest)) fs.rmSync(latest, { recursive: true, force: true });
  fs.renameSync(extracted, latest);
  console.log('Successfully positioned at cmdline-tools/latest');
}
