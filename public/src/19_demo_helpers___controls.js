/* ==========================================================================
   DEMO HELPERS & CONTROLS
   ========================================================================== */
function resetHackathonDemoData() {
  localStorage.removeItem(STORAGE_KEY);
  appState = getInitialSeedData();
  saveData();
  setupAuthenticatedUser(appState.user);
  renderAllViews();
  showToast('Dataset reset cleanly: Ready for genuine campus records! 🔄', 'info');
}

function toggleRoleDemo() {
  if (!appState.user) return;
  const current = appState.user.role || 'Student';
  const newRole = current.toLowerCase() === 'admin' ? 'Student' : 'Admin';
  appState.user.role = newRole;
  saveData();
  setupAuthenticatedUser(appState.user);
  showToast(`Switched role to: ${newRole.toUpperCase()} 🛡️`, 'info');
}
