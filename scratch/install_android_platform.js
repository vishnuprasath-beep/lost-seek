const { execSync, spawn } = require('child_process');
const path = require('path');

const sdkRoot = 'C:\\Users\\prakash c\\AppData\\Local\\Android\\Sdk';
const sdkManager = path.join(sdkRoot, 'cmdline-tools', 'latest', 'bin', 'sdkmanager.bat');

console.log('Accepting licenses and installing platforms;android-34 and build-tools;34.0.0...');

const cmd = `"${sdkManager}" "--sdk_root=${sdkRoot}" "platforms;android-34" "build-tools;34.0.0"`;
const child = spawn(cmd, [], { shell: true, stdio: ['pipe', 'inherit', 'inherit'] });

// Send 'y' repeatedly to accept licenses
const interval = setInterval(() => {
  try {
    child.stdin.write('y\n');
  } catch (e) {}
}, 500);

child.on('close', code => {
  clearInterval(interval);
  console.log(`sdkmanager finished with exit code: ${code}`);
});
