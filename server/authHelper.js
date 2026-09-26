const db = require('./db.js');

/**
 * Extracts and verifies the user from the Authorization header using Supabase Auth JWT.
 */
async function getAuthenticatedUser(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  
  try {
    const supabase = db.getSupabase();
    
    // SAFE DEBUGGING TEST
    console.log(`[DEBUG] Backend Auth: Verifying token of length ${token.length}`);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.warn(`[DEBUG] Backend Auth: JWT verification failed:`, error ? error.message : 'No user returned');
      return null;
    }
    
    console.log(`[DEBUG] Backend Auth: JWT successfully verified for ${user.email}`);
    
    // Extract metadata
    const role = (user.app_metadata && user.app_metadata.role) || 'student';
    const legacyId = user.app_metadata && user.app_metadata.legacy_id;
    const name = user.user_metadata && user.user_metadata.name;
    
    return {
      id: legacyId || user.id, // Fallback to auth.users UUID if no legacy ID
      auth_id: user.id,
      email: user.email,
      username: user.email,
      role: role.toLowerCase(),
      name: name || user.email.split('@')[0]
    };
  } catch (err) {
    if (err.message && !err.message.includes('expired') && !err.message.includes('Auth session missing')) {
      console.warn('Unexpected JWT Verification Error:', err.message);
    }
    return null;
  }
}

function requireAuth(user) {
  if (!user) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    throw error;
  }
  return true;
}

function requireRole(user, allowedRoles) {
  requireAuth(user);
  if (!allowedRoles.includes(user.role)) {
    const error = new Error('Forbidden: Insufficient permissions');
    error.statusCode = 403;
    throw error;
  }
  return true;
}

function isStudent(user) { return user && user.role === 'student'; }
function isAdmin(user) { return user && user.role === 'admin'; }
function isSupervisor(user) { return user && user.role === 'supervisor'; }
function isDirector(user) { return user && user.role === 'director'; }
function isStaff(user) { return user && ['admin', 'supervisor', 'director'].includes(user.role); }

module.exports = {
  getAuthenticatedUser,
  requireAuth,
  requireRole,
  isStudent,
  isAdmin,
  isSupervisor,
  isDirector,
  isStaff
};
