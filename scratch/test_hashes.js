import crypto from 'crypto';

const salt = 'lostseek_secure_salt_2026_campus';

function computeLoginHash(username, password) {
  const rawStr = salt + ':' + String(username).toLowerCase().trim() + ':' + String(password);
  return crypto.createHash('sha256').update(rawStr).digest('hex');
}

// Salted hashes for valid student and admin credentials from app.js:
const targetHashes = {
  'student@campus.edu': 'a275410a2d65fe18a42bbc6562aeee70d14f137355337d65405edc4bb5255f14',
  'student': '566ea4df42d23e7163dd70d73e0812ebbe02fc9fc969131c155589cf441b38c6',
  'admin@campus.edu': 'b46a5771ef81cc09d4b6298a1041faf3a78cdc8e0c08e3015e2d71f4000d3e0b',
  'admin': '3b9d0b782eeda1ace88abced9bb61f53387b0d2d0ed45be2b6d4e23516b60e20',
  'vishnu.prasath': 'c740a156024c4f39591eb9147e2f7e7b4e19713acc1b709f35f40d94bcc8089d',
  'vishnu.prasath@campus.edu': 'e8093702ca84fa1e276fcd0a4e0339040097144620fd109515417f8803f512a2',
  'vishnu.varthan': 'dd609498d8fe2b35570add56caf33f78f4edd39c595ae6d392067cbe2010fd4c',
  'vishnu.varthan@campus.edu': 'f8bc037f4ed4ee6c6acf1db66eb6e5e4b08d9cbc9c8d43abfabb66f64f5e7a37',
  'sivavaiyapuri': '8a0730907fd7f89deb482473ffecbd332623c97666bf7da170ca82f49669132b',
  'sivavaiyapuri@campus.edu': '7bcad89e3781b94e3b06e0da89ee0f8c61901c87dcc6cb38bc575d7c564253e9',
  'boobathy': 'f9ed20dfd52bd919130829fd2bc8f255fd8a9ce06a56e00ff27b3f39555015fb',
  'boobathy@campus.edu': 'd906d6d1ec45eead31a979a1a9c49106cb0df51acc96a6ba2db7d418181b6a6c',
  'krish': 'b7a58e00456e20ab980416811542ba861910df6875e4372c6166b140649c7d98',
  'krish@campus.edu': '894f18a89039a9d652b65ee75efbc066b881b8f90a920b3395fbca94e82b1249',
  'girl1': '579aa73241c325ee200b5799232a51fd1f6237a2e4439b1547428e059bb86822',
  'girl1@campus.edu': 'e83fedb3352450706823d3b084a1effae5519679faac4adf3dd569c44de15cab'
};

for (const [u, target] of Object.entries(targetHashes)) {
  const p = u.startsWith('admin') ? 'admin123' : 'student123';
  const computed = computeLoginHash(u, p);
  const match = computed === target;
  console.log(`${u} (pass: ${p}): match = ${match}`);
}
