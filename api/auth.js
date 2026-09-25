/**
 * LostSeek - Unified Authentication & User Management API Route (/api/auth)
 */

const crypto = require('crypto');
const db = require('../server/db.js');

const AUTH_SALT = process.env.LOSTSEEK_AUTH_SALT || 'LostSeek_KSRCE_SecureSalt_2026';
const CLIENT_SALT = 'lostseek_secure_salt_2026_campus';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AUTHORIZED_SEEDS = [
  { u: 'student@campus.edu', passwords: ['StudentPass2026!', 'student123'], role: 'student', name: 'Alex Rivera', id: 'usr-alex', studentId: 'STU-2026-8891' },
  { u: 'student', passwords: ['StudentPass2026!', 'student123'], role: 'student', name: 'Alex Rivera', id: 'usr-alex', studentId: 'STU-2026-8891' },
  { u: 'admin@campus.edu', passwords: ['AdminPass2026!', 'admin123'], role: 'admin', name: 'Vikram Singh', id: 'usr-admin', studentId: 'ADM-FAC-4402' },
  { u: 'admin', passwords: ['AdminPass2026!', 'admin123'], role: 'admin', name: 'Vikram Singh', id: 'usr-admin', studentId: 'ADM-FAC-4402' },
  { u: 'vishnu.prasath', passwords: ['VP73#Kmp9s', 'student123'], role: 'student', name: 'Vishnu Prasath', id: 'usr-vishnu-p', studentId: 'STU-2026-1011' },
  { u: 'vishnu.prasath@campus.edu', passwords: ['VP73#Kmp9s', 'student123'], role: 'student', name: 'Vishnu Prasath', id: 'usr-vishnu-p', studentId: 'STU-2026-1011' },
  { u: 'vishnu.varthan', passwords: ['VV28$Sky4m', 'student123'], role: 'student', name: 'Vishnu Varthan', id: 'usr-vishnu-v', studentId: 'STU-2026-1012' },
  { u: 'vishnu.varthan@campus.edu', passwords: ['VV28$Sky4m', 'student123'], role: 'student', name: 'Vishnu Varthan', id: 'usr-vishnu-v', studentId: 'STU-2026-1012' },
  { u: 'sivavaiyapuri', passwords: ['SV84@Qst6r', 'student123'], role: 'student', name: 'Sivavaiyapuri', id: 'usr-siva', studentId: 'STU-2026-1013' },
  { u: 'sivavaiyapuri@campus.edu', passwords: ['SV84@Qst6r', 'student123'], role: 'student', name: 'Sivavaiyapuri', id: 'usr-siva', studentId: 'STU-2026-1013' },
  { u: 'boobathy', passwords: ['BB59*Lnk2v', 'student123'], role: 'student', name: 'Boobathy', id: 'usr-boobathy', studentId: 'STU-2026-1014' },
  { u: 'boobathy@campus.edu', passwords: ['BB59*Lnk2v', 'student123'], role: 'student', name: 'Boobathy', id: 'usr-boobathy', studentId: 'STU-2026-1014' },
  { u: 'krish', passwords: ['KR91!Trk7p', 'student123'], role: 'student', name: 'Krish', id: 'usr-krish', studentId: 'STU-2026-1015' },
  { u: 'krish@campus.edu', passwords: ['KR91!Trk7p', 'student123'], role: 'student', name: 'Krish', id: 'usr-krish', studentId: 'STU-2026-1015' },
  { u: 'girl1', passwords: ['GL36#Hvn8x', 'student123'], role: 'student', name: 'Girl1', id: 'usr-girl1', studentId: 'STU-2026-1016' },
  { u: 'girl1@campus.edu', passwords: ['GL36#Hvn8x', 'student123'], role: 'student', name: 'Girl1', id: 'usr-girl1', studentId: 'STU-2026-1016' }
];

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
  const legacyServerHash = crypto.createHash('sha256').update(AUTH_SALT + String(pass)).digest('hex');
  if (legacyServerHash === storedHash) return { valid: true, needsUpgrade: true };
  if (username) {
    const cleanU = String(username).toLowerCase().trim();
    const legacyClientHash = crypto.createHash('sha256').update(CLIENT_SALT + ':' + cleanU + ':' + String(pass)).digest('hex');
    if (legacyClientHash === storedHash) return { valid: true, needsUpgrade: true };
  }
  return { valid: false, needsUpgrade: false };
}

function parseBody(req) {
  if (typeof req.body === 'object' && req.body !== null) return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return {};
}

const authHelper = require('../server/authHelper.js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization, x-lostseek-user');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, 'http://localhost');
  let action = url.searchParams.get('action');
  if (!action) {
    const pathname = url.pathname.toLowerCase();
    if (pathname.includes('/login')) action = 'login';
    else if (pathname.includes('/register')) action = 'register';
    else if (pathname.includes('/change-password')) action = 'change-password';
    else if (pathname.includes('/profile')) action = 'profile';
  }
  const body = parseBody(req);
  if (!action) {
    if (body.currentPassword && body.newPassword) action = 'change-password';
    else if (body.confirmPassword || body.studentId) action = 'register';
    else if (body.username && body.password) action = 'login';
    else action = 'profile';
  }

  const supabase = db.getSupabase();

  try {
    if (action === 'login') {
      if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method Not Allowed.' });

      const { role, username, password } = body;
      if (!username || !password) return res.status(400).json({ success: false, message: 'Username/email and password required.' });

      const cleanRole = String(role || 'student').trim().toLowerCase();
      const cleanUser = String(username).trim();
      const cleanPass = String(password);
      const email = cleanUser.includes('@') ? cleanUser : cleanUser + '@campus.edu';

      let authenticatedUser = null;
      let actualRole = 'student';
      let jwtToken = null;

      // 1. Try Supabase Auth direct sign-in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password: cleanPass });
      
      if (!signInError && signInData.session) {
        // User exists in Supabase Auth and password is correct
        jwtToken = signInData.session.access_token;
        const supaUser = signInData.user;
        actualRole = (supaUser.app_metadata && supaUser.app_metadata.role) || 'student';
        
        let dbUser = await db.getUser(cleanUser);
        if (!dbUser) dbUser = await db.getUser(email);
        
        authenticatedUser = {
          id: (supaUser.app_metadata && supaUser.app_metadata.legacy_id) || supaUser.id,
          username: cleanUser,
          name: (supaUser.user_metadata && supaUser.user_metadata.name) || cleanUser,
          role: actualRole,
          studentId: dbUser ? dbUser.studentId : null,
          avatarUrl: dbUser ? dbUser.avatarUrl : null
        };
      } else {
        // 2. Fallback: check legacy custom hashes/seeds
        let dbUser = await db.getUser(cleanUser);
        let isValidLegacy = false;
        
        if (dbUser && dbUser.passwordHash) {
          const verifyResult = verifyPassword(cleanPass, dbUser.passwordHash, dbUser.username);
          if (verifyResult.valid) {
            isValidLegacy = true;
            authenticatedUser = dbUser;
            actualRole = dbUser.role || 'student';
          }
        }
        
        if (!isValidLegacy) {
          const lowerInput = cleanUser.toLowerCase();
          const matchedSeed = AUTHORIZED_SEEDS.find(s => {
            const matchUser = s.u.toLowerCase() === lowerInput ||
              (lowerInput.includes('@') && s.u.toLowerCase() === lowerInput.split('@')[0]) ||
              (!lowerInput.includes('@') && s.u.toLowerCase() === `${lowerInput}@campus.edu`);
            if (!matchUser) return false;
            return s.passwords.includes(cleanPass);
          });
          
          if (matchedSeed) {
            isValidLegacy = true;
            actualRole = dbUser ? (dbUser.role || matchedSeed.role) : matchedSeed.role;
            authenticatedUser = dbUser ? { ...dbUser, role: actualRole, name: dbUser.name || matchedSeed.name } : {
              id: matchedSeed.id,
              username: matchedSeed.u,
              name: matchedSeed.name,
              role: actualRole,
              studentId: matchedSeed.studentId,
              avatarUrl: null
            };
          }
        }

        if (!isValidLegacy) {
          return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your username/email and password.' });
        }

        // 3. Transparent Migration: Create the user in Supabase Auth
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
          email,
          password: cleanPass,
          email_confirm: true,
          user_metadata: { name: authenticatedUser.name }
        });
        
        if (createData && createData.user) {
          await supabase.auth.admin.updateUserById(createData.user.id, {
            app_metadata: { role: actualRole, legacy_id: authenticatedUser.id }
          });
        }
        
        // 4. Sign in again to get the JWT
        const { data: secondSignIn } = await supabase.auth.signInWithPassword({ email, password: cleanPass });
        if (secondSignIn && secondSignIn.session) {
          jwtToken = secondSignIn.session.access_token;
        } else {
          // Fallback if signIn fails after create (shouldn't happen)
          jwtToken = `legacy-token-${authenticatedUser.id}-${Date.now()}`;
        }
      }

      // Check portal roles
      const isAdminRole = ['admin', 'supervisor', 'director'].includes(actualRole);
      if (cleanRole === 'admin' && !isAdminRole) {
        return res.status(401).json({ success: false, message: 'Invalid credentials for Admin portal.' });
      }
      if (cleanRole === 'student' && isAdminRole) {
        return res.status(401).json({ success: false, message: 'Invalid credentials for Student portal. Administrator accounts must use the Admin portal.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Authentication successful',
        user: {
          id: authenticatedUser.id,
          name: authenticatedUser.name,
          username: authenticatedUser.username,
          role: actualRole,
          studentId: authenticatedUser.studentId,
          avatarUrl: authenticatedUser.avatarUrl || null,
          photoUrl: authenticatedUser.avatarUrl || null,
          token: jwtToken
        }
      });
    }

    if (action === 'register') {
      if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method Not Allowed.' });

      const { name, email, username, password, confirmPassword, studentId, phone, avatarUrl } = body;
      const cleanEmail = String(email || username || '').trim().toLowerCase();
      const cleanName = String(name || '').trim();
      const rawPass = password;

      if (!cleanName) return res.status(400).json({ success: false, message: 'Full name is required.' });
      if (!cleanEmail) return res.status(400).json({ success: false, message: 'Email address is required.' });
      if (cleanEmail.includes('@') && !EMAIL_REGEX.test(cleanEmail)) return res.status(400).json({ success: false, message: 'Valid email required.' });
      if (!rawPass || String(rawPass).length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
      if (rawPass !== confirmPassword) return res.status(400).json({ success: false, message: 'Passwords do not match.' });

      const storageHelper = require('../server/storageHelper.js');
      let safeAvatarUrl = avatarUrl ? String(avatarUrl).trim() : null;
      if (safeAvatarUrl) {
        try {
          safeAvatarUrl = await storageHelper.uploadIfBase64(safeAvatarUrl, 'avatar');
        } catch (e) {
          return res.status(400).json({ success: false, message: 'Failed to process avatar image.' });
        }
      }

      const safeRole = 'student'; // Hardcoded public registration role

      const existing = await db.getUser(cleanEmail);
      if (existing) return res.status(409).json({ success: false, message: 'Account exists.' });

      const finalEmail = cleanEmail.includes('@') ? cleanEmail : cleanEmail + '@campus.edu';
      const legacyId = 'usr-' + Date.now();

      // Create in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: finalEmail,
        password: rawPass,
        email_confirm: true,
        user_metadata: { name: cleanName }
      });
      
      if (authData && authData.user) {
        await supabase.auth.admin.updateUserById(authData.user.id, {
          app_metadata: { role: safeRole, legacy_id: legacyId }
        });
      }

      if (authError && authError.message.includes('already exists')) {
         return res.status(409).json({ success: false, message: 'Account exists in auth system.' });
      }

      // Create in custom users table for relation consistency
      const passwordHash = hashPassword(rawPass);
      const newUser = await db.createUser({
        id: legacyId,
        username: cleanEmail,
        name: cleanName,
        role: safeRole,
        studentId: studentId || null,
        phone: phone || null,
        avatarUrl: safeAvatarUrl,
        passwordHash
      });

      return res.status(201).json({
        success: true,
        message: 'Student account created successfully!',
        user: { ...newUser, token: null }
      });
    }

    if (action === 'change-password') {
      const callingUser = await authHelper.getAuthenticatedUser(req);
      authHelper.requireAuth(callingUser); // MUST be authenticated

      const { currentPassword, newPassword } = body;
      const cleanUser = callingUser.email || callingUser.username;
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: cleanUser, password: currentPassword });
      
      let validCurrent = false;
      if (!signInError && signInData.user) {
        validCurrent = true;
      } else {
        const dbUser = await db.getUser(cleanUser);
        if (dbUser && dbUser.passwordHash) {
           validCurrent = verifyPassword(currentPassword, dbUser.passwordHash, dbUser.username).valid;
        }
      }

      if (!validCurrent) return res.status(401).json({ success: false, message: 'Current password incorrect.' });
      if (!newPassword || newPassword.length < 6) return res.status(400).json({ success: false, message: 'New password too short.' });

      await supabase.auth.admin.updateUserById(callingUser.auth_id, { password: newPassword });
      
      const userRecord = await db.getUser(cleanUser);
      if (userRecord) {
        await db.updateUser(userRecord.id, { passwordHash: hashPassword(newPassword) });
      }

      return res.status(200).json({ success: true, message: 'Password changed successfully!' });
    }

    if (action === 'profile') {
      const callingUser = await authHelper.getAuthenticatedUser(req);

      if (req.method === 'GET') {
        const targetUser = url.searchParams.get('username') || (callingUser && callingUser.username);
        if (!targetUser) return res.status(400).json({ success: false, message: 'Username required.' });
        const user = await db.getUser(targetUser);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        return res.status(200).json({ success: true, profile: user });
      }

      if (req.method === 'POST' || req.method === 'PATCH') {
        authHelper.requireAuth(callingUser);
        const targetUsername = body.username || callingUser.username;
        const isSelf = callingUser.username === targetUsername || callingUser.email === targetUsername || callingUser.id === targetUsername;
        const isStaff = authHelper.isStaff(callingUser);
        
        if (!isSelf && !isStaff) return res.status(403).json({ success: false, message: 'Unauthorized' });

        const updates = {};
        if (body.name) updates.name = String(body.name).trim();
        if (body.studentId) updates.studentId = String(body.studentId).trim();
        if (body.phone !== undefined) updates.phone = String(body.phone).trim();
        let avatar = body.avatarUrl || body.avatar_url || body.profilePicture || body.photoUrl;
        if (avatar !== undefined) {
          const storageHelper = require('../server/storageHelper.js');
          try {
            avatar = await storageHelper.uploadIfBase64(String(avatar).trim(), 'avatar');
            updates.avatarUrl = avatar;
          } catch (e) {
            return res.status(400).json({ success: false, message: 'Failed to process profile picture.' });
          }
        }

        const updated = await db.updateUser(targetUsername, updates);
        return res.status(200).json({ success: true, profile: updated, user: updated });
      }
    }

    if (action === 'users') {
      const callingUser = await authHelper.getAuthenticatedUser(req);
      authHelper.requireRole(callingUser, ['admin', 'supervisor', 'director']);
      const users = await db.getAllUsers(callingUser); // Keep compatibility
      return res.status(200).json({ success: true, users });
    }

    return res.status(400).json({ success: false, message: `Unknown auth action: ${action}` });
  } catch (error) {
    console.error('Auth handler error:', error);
    const code = error.statusCode || 500;
    return res.status(code).json({ success: false, message: error.message || 'Internal error' });
  }
};
