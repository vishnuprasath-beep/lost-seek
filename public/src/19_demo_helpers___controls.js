/* ==========================================================================
   DEMO HELPERS & CONTROLS
   ========================================================================== */


function toggleRoleDemo() {
  if (!appState.user) return;
  const current = appState.user.role || 'Student';
  const newRole = current.toLowerCase() === 'admin' ? 'Student' : 'Admin';
  appState.user.role = newRole;
  saveData();
  setupAuthenticatedUser(appState.user);
  showToast(`Switched role to: ${newRole.toUpperCase()} 🛡️`, 'info');
}
