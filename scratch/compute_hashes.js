const crypto = require('crypto');
const salt = 'lostseek_secure_salt_2026_campus';

function hash(u, p) {
  const raw = salt + ':' + u.toLowerCase().trim() + ':' + p;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

const students = [
  { name: 'Vishnu Prasath', id: 'STU-2026-1011', user: 'vishnu.prasath', pass: 'VP73#Kmp9s' },
  { name: 'Vishnu Varthan', id: 'STU-2026-1012', user: 'vishnu.varthan', pass: 'VV28$Sky4m' },
  { name: 'Sivavaiyapuri', id: 'STU-2026-1013', user: 'sivavaiyapuri', pass: 'SV84@Qst6r' },
  { name: 'Boobathy', id: 'STU-2026-1014', user: 'boobathy', pass: 'BB59*Lnk2v' },
  { name: 'Krish', id: 'STU-2026-1015', user: 'krish', pass: 'KR91!Trk7p' },
  { name: 'Girl1', id: 'STU-2026-1016', user: 'girl1', pass: 'GL36#Hvn8x' }
];

students.forEach(s => {
  const h1 = hash(s.user, s.pass);
  const h2 = hash(s.user + '@campus.edu', s.pass);
  console.log(`  // ${s.name} (${s.user} & ${s.user}@campus.edu)`);
  console.log(`  '${h1}': { role: 'student', name: '${s.name}', studentId: '${s.id}' },`);
  console.log(`  '${h2}': { role: 'student', name: '${s.name}', studentId: '${s.id}' },`);
});
