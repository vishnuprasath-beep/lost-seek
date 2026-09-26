/* ==========================================================================
   ADMIN "STUDENTS" DIRECTORY
   ========================================================================== */
function renderAdminStudents() {
  const tbody = document.getElementById('students-directory-tbody');
  if (!tbody) return;

  const search = (document.getElementById('students-search-input')?.value || '').trim().toLowerCase();

  // Aggregate student data from reports and seed students
  const studentMap = new Map();

  // 1. Incorporate authoritative users fetched from database
  if (Array.isArray(appState.users)) {
    appState.users.forEach(u => {
      const isStudentRole = !u.role || u.role.toLowerCase() === 'student';
      if (isStudentRole && u.name) {
        studentMap.set(u.name, {
          name: u.name,
          id: u.studentId || u.username || 'STU-2026',
          
          status: 'Active',
          avatarUrl: u.avatarUrl || null,
          lostCount: 0,
          foundCount: 0,
          claimsCount: 0
        });
      }
    });
  }

  // 2. Default seed students (REMOVED - We now rely entirely on database users)
  const defaultStudents = [];

  defaultStudents.forEach(s => {
    if (!studentMap.has(s.name)) {
      studentMap.set(s.name, { ...s, lostCount: 0, foundCount: 0, claimsCount: 0, avatarUrl: null });
    }
  });

  // Count reports & attach any report-embedded avatar metadata
  appState.lostReports.forEach(r => {
    const name = r.reporterName || 'Alex Rivera';
    if (studentMap.has(name)) {
      studentMap.get(name).lostCount++;
      if ((r.reporterAvatar || r.reporter_avatar) && !studentMap.get(name).avatarUrl) {
        studentMap.get(name).avatarUrl = r.reporterAvatar || r.reporter_avatar;
      }
    }
  });

  appState.foundReports.forEach(r => {
    const name = r.finderName || 'Aman Verma';
    if (studentMap.has(name)) studentMap.get(name).foundCount++;
  });

  appState.claims.forEach(c => {
    const name = c.claimantName || 'Alex Rivera';
    if (studentMap.has(name)) studentMap.get(name).claimsCount++;
  });

  // Fetch updated student directory in background if staff user
  const now = Date.now();
  if (!window.__fetchingAdminUsers && (!window.__lastAdminUserFetch || now - window.__lastAdminUserFetch > 5000) && appState.user && ['admin', 'supervisor', 'director'].includes(String(appState.user.role || '').toLowerCase())) {
    window.__fetchingAdminUsers = true;
    fetch(API_BASE + '/api/auth?action=users', { headers: getAuthHeaders() })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        window.__fetchingAdminUsers = false;
        window.__lastAdminUserFetch = Date.now();
        if (data && data.success && Array.isArray(data.users)) {
          const oldLen = appState.users ? appState.users.length : 0;
          appState.users = data.users;
          if (oldLen !== data.users.length) {
            renderAdminStudents();
          }
        }
      })
      .catch(() => { 
        window.__fetchingAdminUsers = false;
      });
  }

  const studentsList = Array.from(studentMap.values()).filter(s => {
    if (!search) return true;
    return s.name.toLowerCase().includes(search) || s.id.toLowerCase().includes(search);
  });

  if (studentsList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);">No students found matching your search.</td></tr>';
    return;
  }

  tbody.innerHTML = studentsList.map(s => `
    <tr>
      <td data-label="Student">
        <div style="display:flex;align-items:center;gap:8px;">
          ${getAvatarSVG('student', 28, s.avatarUrl)}
          <strong>${escapeHTML(s.name)}</strong>
        </div>
      </td>
      <td data-label="Student ID"><code>${escapeHTML(s.id)}</code></td>
      <td data-label="Lost Reports">${s.lostCount}</td>
      <td data-label="Found Reports">${s.foundCount}</td>
      <td data-label="Claims">${s.claimsCount}</td>
      
      <td data-label="Status"><span class="badge badge-verified">${s.status}</span></td>
    </tr>
  `).join('');
}
