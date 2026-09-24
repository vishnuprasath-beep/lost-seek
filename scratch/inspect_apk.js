const fs = require('fs');
const path = require('path');

// Read zip central directory to list all entries
function listZipEntries(zipPath) {
  const buf = fs.readFileSync(zipPath);
  // Find End of Central Directory Record (EOCD)
  let eocdOffset = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) {
    console.log('EOCD not found');
    return [];
  }

  const cdEntriesCount = buf.readUInt16LE(eocdOffset + 10);
  const cdOffset = buf.readUInt32LE(eocdOffset + 16);

  const entries = [];
  let pos = cdOffset;
  for (let i = 0; i < cdEntriesCount; i++) {
    if (buf.readUInt32LE(pos) !== 0x02014b50) break;
    const compSize = buf.readUInt32LE(pos + 20);
    const uncompSize = buf.readUInt32LE(pos + 24);
    const nameLen = buf.readUInt16LE(pos + 28);
    const extraLen = buf.readUInt16LE(pos + 30);
    const commentLen = buf.readUInt16LE(pos + 32);
    const name = buf.toString('utf8', pos + 46, pos + 46 + nameLen);

    entries.push({ name, compSize, uncompSize });
    pos += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

const entries = listZipEntries('LostSeek.apk');
console.log(`Total entries in LostSeek.apk: ${entries.length}`);
console.log('\nTop-level summary of entries:');
const groups = {};
entries.forEach(e => {
  const top = e.name.split('/')[0];
  groups[top] = (groups[top] || 0) + 1;
});
console.log(groups);

console.log('\nNon-res / Root files in APK:');
entries.filter(e => !e.name.startsWith('res/')).forEach(e => {
  console.log(`- ${e.name} (${e.uncompSize} bytes)`);
});

