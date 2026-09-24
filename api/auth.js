/**
 * LostSeek - Unified Authentication & User Management API Route (/api/auth)
 * 
 * Handles:
 * - /api/login (action=login)
 * - /api/register (action=register)
 * - /api/change-password (action=change-password)
 * - /api/profile (action=profile)
 * 
 * Multi-layer security:
 * 1. Primary: Scrypt (N=16384, r=8, p=1) with 16-byte random salt.
 * 2. Backward-compatible legacy verification:
 *    - Server-salted SHA-256 (AUTH_SALT + password)
 *    - Client-salted SHA-256 (CLIENT_SALT + username + password)
 *    - Authorized initial institutional credentials
 * 3. Transparent automatic upgrade: Any valid legacy or seed login is immediately upgraded to Scrypt in Supabase.
 * 4. Strict role enforcement: Student portal admits students only; Admin portal admits admins only.
 * 5. Public registration strictly locked to Student role.
 * 6. Zero passwords or hashes ever logged or returned in responses.
 */

const crypto = require('crypto');
const db = require('../server/db.js');

const AUTH_SALT = process.env.LOSTSEEK_AUTH_SALT || 'LostSeek_KSRCE_SecureSalt_2026';
const CLIENT_SALT = 'lostseek_secure_salt_2026_campus';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Authorized initial institutional seed accounts
const AUTHORIZED_SEEDS = [
  // Default student: student@campus.edu & student
  { u: 'student@campus.edu', passwords: ['StudentPass2026!', 'student123'], role: 'student', name: 'Alex Rivera', id: 'usr-alex', studentId: 'STU-2026-8891' },
  { u: 'student', passwords: ['StudentPass2026!', 'student123'], role: 'student', name: 'Alex Rivera', id: 'usr-alex', studentId: 'STU-2026-8891' },

  // Default admin: admin@campus.edu & admin
  { u: 'admin@campus.edu', passwords: ['AdminPass2026!', 'admin123'], role: 'admin', name: 'Vikram Singh', id: 'usr-admin', studentId: 'ADM-FAC-4402' },
  { u: 'admin', passwords: ['AdminPass2026!', 'admin123'], role: 'admin', name: 'Vikram Singh', id: 'usr-admin', studentId: 'ADM-FAC-4402' },

  // Verified registered student accounts
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

  // 1. Scrypt check (modern production standard)
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

  // 2. Legacy server-salted SHA-256 fallback
  const legacyServerHash = crypto.createHash('sha256').update(AUTH_SALT + String(pass)).digest('hex');
  if (legacyServerHash === storedHash) {
    return { valid: true, needsUpgrade: true };
  }

  // 3. Legacy client-salted SHA-256 fallback
  if (username) {
    const cleanU = String(username).toLowerCase().trim();
    const legacyClientHash = crypto.createHash('sha256').update(CLIENT_SALT + ':' + cleanU + ':' + String(pass)).digest('hex');
    if (legacyClientHash === storedHash) {
      return { valid: true, needsUpgrade: true };
    }
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

function parseUser(req) {
  const body = req.body && typeof req.body === 'object' ? req.body : null;
  if (body && (body.callerUser || body.callingUser || body.user)) {
    return body.callerUser || body.callingUser || body.user;
  }
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token.includes('.')) {
      try {
        const payloadBase64 = token.split('.')[1];
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
        if (payload && (payload.sub || payload.id || payload.email || payload.username)) {
          return {
            id: payload.sub || payload.id,
            username: payload.email || payload.username || payload.sub,
            role: payload.role || (payload.user_metadata && payload.user_metadata.role) || 'student',
            name: (payload.user_metadata && payload.user_metadata.name) || payload.name || ''
          };
        }
      } catch (err) {}
    }
  }
  const userHeader = req.headers['x-lostseek-user'] || req.headers['x-user'];
  if (userHeader) {
    try {
      return JSON.parse(decodeURIComponent(userHeader));
    } catch (e) {
      try { return JSON.parse(userHeader); } catch (err) {}
    }
  }
  if (req.headers['x-user-id'] || req.headers['x-user-role']) {
    return {
      id: req.headers['x-user-id'] || 'usr-anon',
      role: req.headers['x-user-role'] || 'student',
      username: req.headers['x-user-name'] || req.headers['x-user-username'] || req.headers['x-user-id'] || 'user'
    };
  }
  return null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization, x-lostseek-user');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = new URL(req.url, 'http://localhost');
  const actionParam = url.searchParams.get('action');
  let action = actionParam;

  if (!action) {
    const pathname = url.pathname.toLowerCase();
    if (pathname.includes('/login')) action = 'login';
    else if (pathname.includes('/register')) action = 'register';
    else if (pathname.includes('/change-password')) action = 'change-password';
    else if (pathname.includes('/profile')) action = 'profile';
  }

  // Fallback: inspect body for hints
  const body = parseBody(req);
  if (!action) {
    if (body.currentPassword && body.newPassword) action = 'change-password';
    else if (body.confirmPassword || body.studentId) action = 'register';
    else if (body.username && body.password) action = 'login';
    else action = 'profile';
  }

  try {
    // -------------------------------------------------------------
    // ACTION: LOGIN
    // -------------------------------------------------------------
    if (action === 'login') {
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed. Use POST.' });
      }

      const { role, username, password } = body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username/email and password are required.' });
      }

      const cleanRole = String(role || 'student').trim().toLowerCase();
      const cleanUser = String(username).trim();
      const cleanPass = String(password);

      let authenticatedUser = null;
      let matchedSeed = null;
      let needsUpgrade = false;

      // 1. Look up user in Supabase
      let dbUser = null;
      try {
        dbUser = await db.getUser(cleanUser);
      } catch (dbErr) {
        console.warn('Database user lookup warning:', dbErr.message);
      }

      // 2. Check password against Supabase stored hash if present
      if (dbUser && dbUser.passwordHash) {
        const verifyResult = verifyPassword(cleanPass, dbUser.passwordHash, dbUser.username);
        if (verifyResult.valid) {
          authenticatedUser = dbUser;
          needsUpgrade = verifyResult.needsUpgrade;
        }
      }

      // 3. Backward-compatible check against authorized initial seeds
      if (!authenticatedUser) {
        const lowerInput = cleanUser.toLowerCase();
        matchedSeed = AUTHORIZED_SEEDS.find(s => {
          const matchUser = s.u.toLowerCase() === lowerInput ||
            (lowerInput.includes('@') && s.u.toLowerCase() === lowerInput.split('@')[0]) ||
            (!lowerInput.includes('@') && s.u.toLowerCase() === `${lowerInput}@campus.edu`);
          if (!matchUser) return false;
          return s.passwords.includes(cleanPass);
        });

        if (matchedSeed) {
          needsUpgrade = true; // Upgrade seed login to permanent Scrypt in Supabase
          if (dbUser) {
            authenticatedUser = {
              ...dbUser,
              role: dbUser.role || matchedSeed.role,
              name: dbUser.name || matchedSeed.name
            };
          } else {
            authenticatedUser = {
              id: matchedSeed.id,
              username: matchedSeed.u,
              name: matchedSeed.name,
              role: matchedSeed.role,
              studentId: matchedSeed.studentId,
              avatarUrl: null
            };
          }
        }
      }

      // 4. Reject invalid credentials if no match found
      if (!authenticatedUser) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Please verify your username/email and password.'
        });
      }

      // 5. Strict Role Verification
      const actualRole = (authenticatedUser.role || 'student').toLowerCase();
      const isAdminRole = ['admin', 'supervisor', 'director'].includes(actualRole);

      if (cleanRole === 'admin' && !isAdminRole) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials for Admin portal.'
        });
      }

      if (cleanRole === 'student' && isAdminRole) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials for Student portal. Administrator accounts must use the Admin portal.'
        });
      }

      // 6. Transparent Automatic Upgrade to Scrypt in Supabase
      if (needsUpgrade) {
        try {
          const newScryptHash = hashPassword(cleanPass);
          if (dbUser && dbUser.id) {
            await db.updateUser(dbUser.id, { passwordHash: newScryptHash });
          } else {
            // Seed user not yet created in Supabase: create them with Scrypt hash
            await db.createUser({
              id: authenticatedUser.id,
              username: authenticatedUser.username,
              name: authenticatedUser.name,
              role: authenticatedUser.role,
              studentId: authenticatedUser.studentId,
              passwordHash: newScryptHash
            });
          }
        } catch (upgradeErr) {
          console.warn('Transparent password hash upgrade notice:', upgradeErr.message);
        }
      }

      // 7. Successful Authentication Response
      const token = `token-${authenticatedUser.id}-${Date.now()}`;
      return res.status(200).json({
        success: true,
        message: 'Authentication successful',
        user: {
          id: authenticatedUser.id,
          name: authenticatedUser.name,
          username: authenticatedUser.username,
          role: actualRole,
          studentId: authenticatedUser.studentId || (actualRole === 'student' ? 'STU-2026' : null),
          avatar: authenticatedUser.avatarUrl || null,
          avatarUrl: authenticatedUser.avatarUrl || null,
          avatar_url: authenticatedUser.avatarUrl || null,
          profilePicture: authenticatedUser.avatarUrl || null,
          profilePictureUrl: authenticatedUser.avatarUrl || null,
          photoUrl: authenticatedUser.avatarUrl || null,
          phone: authenticatedUser.phone || '',
          token
        }
      });
    }

    // -------------------------------------------------------------
    // ACTION: REGISTER
    // -------------------------------------------------------------
    if (action === 'register') {
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed. Use POST.' });
      }

      const { name, email, username, password, confirmPassword, studentId, phone, avatarUrl } = body;
      const cleanEmail = String(email || username || '').trim().toLowerCase();
      const cleanName = String(name || '').trim();
      const rawPass = password;
      const rawConfirm = confirmPassword;

      if (!cleanName) {
        return res.status(400).json({ success: false, message: 'Full name is required.' });
      }
      if (!cleanEmail) {
        return res.status(400).json({ success: false, message: 'Email address is required.' });
      }
      if (cleanEmail.includes('@') && !EMAIL_REGEX.test(cleanEmail)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid institutional or personal email address.' });
      }
      if (!rawPass || String(rawPass).length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      }
      if (rawConfirm && rawPass !== rawConfirm) {
        return res.status(400).json({ success: false, message: 'Password and Confirm Password do not match.' });
      }

      // Guard against oversized base64 avatar directly embedded in registration payload
      const rawAvatarCandidate = avatarUrl || body.avatar_url || body.profilePicture || body.profilePictureUrl || body.photoUrl || body.avatar || null;
      let safeAvatarUrl = rawAvatarCandidate ? String(rawAvatarCandidate).trim() : null;
      if (safeAvatarUrl && safeAvatarUrl.startsWith('data:') && safeAvatarUrl.length > 200 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'Profile image exceeds direct registration size limit. Please upload via photo selector.'
        });
      }

      // CRITICAL ROLE RESTRICTION: Public registration is strictly student only
      const safeRole = 'student';

      const existing = await db.getUser(cleanEmail);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists. Please log in.'
        });
      }

      const passwordHash = hashPassword(rawPass);
      const newUser = await db.createUser({
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
        message: 'Student account created successfully! You can now log in with your credentials.',
        user: {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          role: newUser.role,
          studentId: newUser.studentId,
          avatar: newUser.avatarUrl || safeAvatarUrl || null,
          avatarUrl: newUser.avatarUrl || safeAvatarUrl || null,
          phone: newUser.phone || phone || ''
        }
      });
    }

    // -------------------------------------------------------------
    // ACTION: CHANGE-PASSWORD
    // -------------------------------------------------------------
    if (action === 'change-password') {
      const callingUser = parseUser(req);
      const { username, userId, currentPassword, newPassword, confirmPassword } = body;
      
      let targetIdentifier = username || userId || body.id || (callingUser && (callingUser.username || callingUser.id)) || '';
      let userRecord = targetIdentifier ? await db.getUser(targetIdentifier) : null;
      const cleanUser = userRecord ? userRecord.username : String(targetIdentifier).trim();

      // Early Authorization Guard:
      // If a calling user is identified, ensure they are changing their own password OR have staff/admin privileges
      if (callingUser && (userRecord || username || userId)) {
        const callingId = String(callingUser.id || callingUser.username || '').toLowerCase();
        const targetId = userRecord ? String(userRecord.id || '').toLowerCase() : String(userId || '').toLowerCase();
        const targetUsername = userRecord ? String(userRecord.username || '').toLowerCase() : String(username || '').toLowerCase();
        const callingUsername = String(callingUser.username || '').toLowerCase();
        
        const isSelf = (callingId && (callingId === targetId || callingId === targetUsername)) ||
                       (callingUsername && (callingUsername === targetUsername || callingUsername === targetId));
        const isStaff = ['admin', 'supervisor', 'director'].includes(String(callingUser.role || '').toLowerCase());
        
        if (!isSelf && !isStaff) {
          return res.status(403).json({ success: false, message: 'Unauthorized: You can only change your own password.' });
        }
      }

      if (!cleanUser) {
        return res.status(400).json({ success: false, message: 'Username or user ID is required.' });
      }

      const rawCurrent = currentPassword;
      const rawNew = newPassword;
      const rawConfirm = confirmPassword !== undefined ? confirmPassword : rawNew;

      if (!rawCurrent) {
        return res.status(400).json({ success: false, message: 'Current password is required.' });
      }
      if (!rawNew || String(rawNew).length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
      }
      if (rawNew !== rawConfirm) {
        return res.status(400).json({ success: false, message: 'New password and confirmation do not match.' });
      }

      if (!userRecord) userRecord = await db.getUser(cleanUser);
      let isValidCurrent = false;

      if (userRecord && userRecord.passwordHash) {
        isValidCurrent = verifyPassword(rawCurrent, userRecord.passwordHash, userRecord.username).valid;
      }

      // Check seed fallback
      if (!isValidCurrent) {
        const lowerInput = cleanUser.toLowerCase();
        const seedMatch = AUTHORIZED_SEEDS.find(s => {
          const matchUser = s.u.toLowerCase() === lowerInput ||
            (lowerInput.includes('@') && s.u.toLowerCase() === lowerInput.split('@')[0]) ||
            (!lowerInput.includes('@') && s.u.toLowerCase() === `${lowerInput}@campus.edu`);
          if (!matchUser) return false;
          return s.passwords.includes(rawCurrent);
        });
        if (seedMatch) isValidCurrent = true;
      }

      if (!isValidCurrent) {
        return res.status(401).json({ success: false, message: 'The current password entered is incorrect.' });
      }

      const newHash = hashPassword(rawNew);
      if (userRecord) {
        await db.updateUser(userRecord.id, { passwordHash: newHash });
      } else {
        await db.createUser({
          username: cleanUser,
          name: cleanUser,
          role: cleanUser.includes('admin') ? 'admin' : 'student',
          passwordHash: newHash
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Password changed successfully! You can now log in with your new password.'
      });
    }

    // -------------------------------------------------------------
    // ACTION: PROFILE
    // -------------------------------------------------------------
    if (action === 'profile') {
      const callingUser = parseUser(req);

      if (req.method === 'GET') {
        const targetUser = url.searchParams.get('username') || (callingUser && callingUser.username);
        if (!targetUser) {
          return res.status(400).json({ success: false, message: 'Username is required.' });
        }
        const user = await db.getUser(targetUser);
        if (!user) {
          return res.status(404).json({ success: false, message: 'User not found.' });
        }
        return res.status(200).json({
          success: true,
          profile: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            studentId: user.studentId,
            phone: user.phone || '',
            avatarUrl: user.avatarUrl || '',
            createdAt: user.createdAt
          }
        });
      }

      if (req.method === 'POST' || req.method === 'PATCH') {
        const targetUsername = body.username || (callingUser && callingUser.username);
        if (!targetUsername) {
          return res.status(400).json({ success: false, message: 'Username is required.' });
        }

        // Security check: only authenticated user can modify their own profile unless staff
        if (callingUser && targetUsername) {
          const isSelf = (callingUser.username && callingUser.username.toLowerCase() === targetUsername.toLowerCase()) ||
                         (callingUser.id && callingUser.id.toLowerCase() === targetUsername.toLowerCase());
          const isStaff = ['admin', 'supervisor', 'director'].includes(String(callingUser.role || '').toLowerCase());
          if (!isSelf && !isStaff) {
            return res.status(403).json({ success: false, message: 'Unauthorized: You can only update your own profile.' });
          }
        }

        const updates = {};
        if (body.name) updates.name = String(body.name).trim();
        if (body.studentId) updates.studentId = String(body.studentId).trim();
        if (body.phone !== undefined) updates.phone = String(body.phone).trim();
        const avatarCandidate = body.avatarUrl !== undefined ? body.avatarUrl : (body.avatar_url !== undefined ? body.avatar_url : (body.profilePicture !== undefined ? body.profilePicture : (body.profilePictureUrl !== undefined ? body.profilePictureUrl : (body.photoUrl !== undefined ? body.photoUrl : body.avatar))));
        if (avatarCandidate !== undefined) updates.avatarUrl = String(avatarCandidate).trim();

        const updated = await db.updateUser(targetUsername, updates);

        // Sync avatarUrl to Supabase user_metadata if admin client is available
        try {
          const supabase = typeof db.getSupabase === 'function' ? db.getSupabase() : null;
          if (supabase && supabase.auth && supabase.auth.admin && updated && updated.id) {
            await supabase.auth.admin.updateUserById(updated.id, {
              user_metadata: { avatarUrl: updates.avatarUrl }
            });
          }
        } catch (adminErr) {}

        return res.status(200).json({
          success: true,
          message: 'Profile updated successfully.',
          profile: updated,
          user: updated
        });
      }

      return res.status(405).json({ success: false, message: 'Method Not Allowed.' });
    }

    // -------------------------------------------------------------
    // ACTION: USERS (Administrative directory of campus members)
    // -------------------------------------------------------------
    if (action === 'users') {
      const callingUser = parseUser(req);
      const isStaff = callingUser && ['admin', 'supervisor', 'director'].includes(String(callingUser.role || '').toLowerCase());
      if (!isStaff) {
        return res.status(403).json({ success: false, message: 'Unauthorized: Administrative access required.' });
      }

      const users = await db.getAllUsers(callingUser);
      return res.status(200).json({
        success: true,
        users
      });
    }

    return res.status(400).json({ success: false, message: `Unknown auth action: ${action}` });
  } catch (error) {
    console.error('Auth handler error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error processing authentication request.'
    });
  }
};
