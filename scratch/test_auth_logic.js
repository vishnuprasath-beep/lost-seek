import crypto from 'crypto';

const AUTH_SALT = 'LostSeek_KSRCE_SecureSalt_2026';
const CLIENT_SALT = 'lostseek_secure_salt_2026_campus';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

function verifyPassword(pass, storedHash, username) {
  if (!storedHash) return { valid: false, needsUpgrade: false };
  if (storedHash.startsWith('scrypt:')) {
    try {
      const parts = storedHash.split(':');
      if (parts.length === 3) {
        const salt = parts[1];
        const expectedHash = Buffer.from(parts[2], 'hex');
        const derivedKey = crypto.scryptSync(pass, salt, 64, { N: 16384, r: 8, p: 1 });
        const valid = crypto.timingSafeEqual(expectedHash, derivedKey);
        return { valid, needsUpgrade: false };
      }
    } catch (e) {
      return { valid: false, needsUpgrade: false };
    }
  }

  // Legacy format 1: Server salted SHA-256
  const legacyServerHash = crypto.createHash('sha256').update(AUTH_SALT + String(pass)).digest('hex');
  if (legacyServerHash === storedHash) {
    return { valid: true, needsUpgrade: true };
  }

  // Legacy format 2: Client salted SHA-256
  if (username) {
    const legacyClientHash = crypto.createHash('sha256').update(CLIENT_SALT + ':' + String(username).toLowerCase().trim() + ':' + String(pass)).digest('hex');
    if (legacyClientHash === storedHash) {
      return { valid: true, needsUpgrade: true };
    }
  }

  return { valid: false, needsUpgrade: false };
}

console.log('Testing hash generation and verification...');
const scryptHash = hashPassword('TestPass2026!');
console.log('Scrypt test verification:', verifyPassword('TestPass2026!', scryptHash).valid);
console.log('Scrypt wrong pass verification:', verifyPassword('WrongPass', scryptHash).valid);

const legacyHash = crypto.createHash('sha256').update(AUTH_SALT + 'LegacyPass123').digest('hex');
console.log('Legacy verification:', verifyPassword('LegacyPass123', legacyHash).valid);
console.log('Needs upgrade:', verifyPassword('LegacyPass123', legacyHash).needsUpgrade);
