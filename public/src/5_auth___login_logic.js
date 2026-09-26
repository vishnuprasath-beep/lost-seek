/* ==========================================================================
   AUTH & LOGIN LOGIC
   ========================================================================== */
function setLoginRole(role) {
  const roleInput = document.getElementById('login-role');
  const btnStudent = document.getElementById('role-btn-student');
  const btnAdmin = document.getElementById('role-btn-admin');
  const roleText = document.getElementById('login-role-text');
  const userLabel = document.getElementById('login-username-label');

  if (roleInput) roleInput.value = role;
  if (btnStudent && btnAdmin) {
    if (role === 'student') {
      btnStudent.classList.add('active');
      btnAdmin.classList.remove('active');
    } else {
      btnAdmin.classList.add('active');
      btnStudent.classList.remove('active');
    }
  }

  if (roleText) {
    roleText.textContent = role === 'admin' ? 'Admin' : 'Student';
  }
  if (userLabel) {
    userLabel.textContent = role === 'admin' ? 'Admin Email / Username' : 'Student Email / ID';
  }

  updateLoginAvatarPreview(role);
}

function toggleLoginPassword() {
  const passInput = document.getElementById('login-password');
  const icon = document.getElementById('password-toggle-icon');
  if (!passInput) return;

  const isPassword = passInput.getAttribute('type') === 'password';
  passInput.setAttribute('type', isPassword ? 'text' : 'password');

  if (icon) {
    icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
    if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
  }
}

// Client-side secure hash verification fallback (for static hosting environments where /api/login 404s)
// Uses one-way salted SHA-256 so NO plaintext passwords exist anywhere in frontend source code
async function computeLoginHash(username, password) {
  const salt = 'lostseek_secure_salt_2026_campus';
  const rawStr = salt + ':' + String(username).toLowerCase().trim() + ':' + String(password);
  if (window.crypto && crypto.subtle) {
    const data = new TextEncoder().encode(rawStr);
    const hashBuf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 0;
  for (let i = 0; i < rawStr.length; i++) {
    h = ((h << 5) - h) + rawStr.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

// Salted hashes for valid student and admin credentials
const AUTH_HASH_DIRECTORY = {
  // Existing: student@campus.edu & student
  'a275410a2d65fe18a42bbc6562aeee70d14f137355337d65405edc4bb5255f14': { role: 'student', name: 'Alex Rivera', studentId: 'STU-2026-8891' },
  '566ea4df42d23e7163dd70d73e0812ebbe02fc9fc969131c155589cf441b38c6': { role: 'student', name: 'Alex Rivera', studentId: 'STU-2026-8891' },
  // Existing: admin@campus.edu & admin
  'b46a5771ef81cc09d4b6298a1041faf3a78cdc8e0c08e3015e2d71f4000d3e0b': { role: 'admin', name: 'Vikram Singh', studentId: 'ADM-FAC-4402' },
  '3b9d0b782eeda1ace88abced9bb61f53387b0d2d0ed45be2b6d4e23516b60e20': { role: 'admin', name: 'Vikram Singh', studentId: 'ADM-FAC-4402' },
  // Student 1: Vishnu Prasath (vishnu.prasath & vishnu.prasath@campus.edu)
  'c740a156024c4f39591eb9147e2f7e7b4e19713acc1b709f35f40d94bcc8089d': { role: 'student', name: 'Vishnu Prasath', studentId: 'STU-2026-1011' },
  'e8093702ca84fa1e276fcd0a4e0339040097144620fd109515417f8803f512a2': { role: 'student', name: 'Vishnu Prasath', studentId: 'STU-2026-1011' },
  // Student 2: Vishnu Varthan (vishnu.varthan & vishnu.varthan@campus.edu)
  'dd609498d8fe2b35570add56caf33f78f4edd39c595ae6d392067cbe2010fd4c': { role: 'student', name: 'Vishnu Varthan', studentId: 'STU-2026-1012' },
  'f8bc037f4ed4ee6c6acf1db66eb6e5e4b08d9cbc9c8d43abfabb66f64f5e7a37': { role: 'student', name: 'Vishnu Varthan', studentId: 'STU-2026-1012' },
  // Student 3: Sivavaiyapuri (sivavaiyapuri & sivavaiyapuri@campus.edu)
  '8a0730907fd7f89deb482473ffecbd332623c97666bf7da170ca82f49669132b': { role: 'student', name: 'Sivavaiyapuri', studentId: 'STU-2026-1013' },
  '7bcad89e3781b94e3b06e0da89ee0f8c61901c87dcc6cb38bc575d7c564253e9': { role: 'student', name: 'Sivavaiyapuri', studentId: 'STU-2026-1013' },
  // Student 4: Boobathy (boobathy & boobathy@campus.edu)
  'f9ed20dfd52bd919130829fd2bc8f255fd8a9ce06a56e00ff27b3f39555015fb': { role: 'student', name: 'Boobathy', studentId: 'STU-2026-1014' },
  'd906d6d1ec45eead31a979a1a9c49106cb0df51acc96a6ba2db7d418181b6a6c': { role: 'student', name: 'Boobathy', studentId: 'STU-2026-1014' },
  // Student 5: Krish (krish & krish@campus.edu)
  'b7a58e00456e20ab980416811542ba861910df6875e4372c6166b140649c7d98': { role: 'student', name: 'Krish', studentId: 'STU-2026-1015' },
  '894f18a89039a9d652b65ee75efbc066b881b8f90a920b3395fbca94e82b1249': { role: 'student', name: 'Krish', studentId: 'STU-2026-1015' },
  // Student 6: Girl1 (girl1 & girl1@campus.edu)
  '579aa73241c325ee200b5799232a51fd1f6237a2e4439b1547428e059bb86822': { role: 'student', name: 'Girl1', studentId: 'STU-2026-1016' },
  'e83fedb3352450706823d3b084a1effae5519679faac4adf3dd569c44de15cab': { role: 'student', name: 'Girl1', studentId: 'STU-2026-1016' }
};

async function handleLoginSubmit(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  const roleInput = document.getElementById('login-role');

  const username = usernameInput ? usernameInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';
  const role = roleInput ? roleInput.value : 'student';

  if (!username || !password) {
    showToast('Please enter both your username and password.', 'warning');
    return;
  }

  let authenticatedUser = null;

  // 1. First attempt serverless backend authentication (Vercel / Node backend)
  try {
    const apiRes = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, username, password })
    });

    const contentType = apiRes.headers.get('content-type') || '';
    let data = null;
    if (contentType.includes('application/json')) {
      try { data = await apiRes.json(); } catch (e) {}
    } else {
      const textResp = await apiRes.text();
      data = { success: false, message: textResp || 'Unexpected server response.' };
    }

    if (apiRes.ok && data && data.success && data.user) {
      authenticatedUser = data.user;
    } else if (apiRes.status === 401 || apiRes.status === 403) {
      const errMessage = (data && data.message) ? data.message : ('Invalid credentials for ' + (role === 'admin' ? 'Admin' : 'Student') + ' portal.');
      showToast(errMessage, 'error');
      if (passwordInput) passwordInput.value = '';
      return;
    }
  } catch (apiErr) {
    console.warn('Backend login network notice:', apiErr);
  }

  // 2. If API was unreachable or static hosting (Surge 404), verify via salted SHA-256
  if (!authenticatedUser) {
    const hash = await computeLoginHash(username, password);
    const matchedProfile = AUTH_HASH_DIRECTORY[hash];

    if (matchedProfile && matchedProfile.role === role) {
      authenticatedUser = {
        role: matchedProfile.role,
        name: matchedProfile.name,
        studentId: matchedProfile.studentId,
        username: username
      };
    }
  }

  // 3. Clear password immediately from memory & form DOM
  if (passwordInput) passwordInput.value = '';

  if (!authenticatedUser) {
    showToast('Invalid credentials for ' + (role === 'admin' ? 'Admin' : 'Student') + ' portal.', 'error');
    return;
  }

  // 4. Establish safe session (NEVER store password in localStorage/sessionStorage)
  appState.user = authenticatedUser;
  
  // SAFE DEBUGGING TEST
  if (appState.user && appState.user.token) {
    console.log('[DEBUG] Safe Auth Check: Supabase access token obtained. Length:', appState.user.token.length);
  } else {
    console.warn('[DEBUG] Auth Warning: No Supabase token found in login response!');
  }

  saveData();

  setupAuthenticatedUser(appState.user);
  showToast(`Welcome back, ${authenticatedUser.name}! 👋`, 'success');
  showPage('dashboard-page');
}

function toggleRegisterView(showRegister) {
  const loginForm = document.getElementById('login-form');
  const regContainer = document.getElementById('register-container');
  const roleToggle = document.querySelector('.role-toggle-group');

  if (showRegister) {
    if (loginForm) loginForm.style.display = 'none';
    if (roleToggle) roleToggle.style.display = 'none';
    if (regContainer) {
      regContainer.style.display = 'block';
      regContainer.classList.add('fade-in');
    }
  } else {
    if (regContainer) regContainer.style.display = 'none';
    if (loginForm) {
      loginForm.style.display = 'block';
      loginForm.classList.add('fade-in');
    }
    if (roleToggle) roleToggle.style.display = 'block';
  }
  if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
}

function triggerRegPhotoPick(mode) {
  const input = (mode === 'camera') 
    ? document.getElementById('reg-camera-input') 
    : document.getElementById('reg-gallery-input');
  if (input) input.click();
}

function handleRegPhotoSelected(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  // Downscale and compress client-side via canvas to prevent Vercel 4.5MB payload overflow
  const reader = new FileReader();
  reader.onload = function(evt) {
    const rawDataUrl = evt.target.result;
    const img = new Image();
    img.onload = async function() {
      try {
        const canvas = document.createElement('canvas');
        const maxDim = 600;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);

        const hidden = document.getElementById('reg-photo-url');
        const wrap = document.getElementById('reg-photo-preview-wrap');
        const preview = document.getElementById('reg-photo-preview');
        if (hidden) hidden.value = compressedDataUrl;
        if (preview) preview.src = compressedDataUrl;
        if (wrap) wrap.style.display = 'flex';

        // Pre-upload to Vercel Blob to obtain permanent CDN URL early
        try {
          const cloudUrl = await uploadImageToCloud(compressedDataUrl, 'student-avatar.jpg');
          if (cloudUrl && cloudUrl.startsWith('http') && hidden) {
            hidden.value = cloudUrl;
          }
        } catch (upErr) {
          console.warn('Avatar pre-upload notice:', upErr);
        }
      } catch (procErr) {
        console.warn('Image compression fallback:', procErr);
      }
    };
    img.src = rawDataUrl;
  };
  reader.readAsDataURL(file);
}

function clearRegPhoto() {
  const hidden = document.getElementById('reg-photo-url');
  const wrap = document.getElementById('reg-photo-preview-wrap');
  const preview = document.getElementById('reg-photo-preview');
  if (hidden) hidden.value = '';
  if (preview) preview.src = '';
  if (wrap) wrap.style.display = 'none';
}

async function handleRegistrationSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name')?.value.trim();
  const email = document.getElementById('reg-email')?.value.trim() || document.getElementById('reg-username')?.value.trim();
  const studentId = document.getElementById('reg-studentid')?.value.trim();
  const phone = document.getElementById('reg-phone')?.value.trim();
  const password = document.getElementById('reg-password')?.value;
  const confirmPassword = document.getElementById('reg-confirm-password')?.value;
  let photo = document.getElementById('reg-photo-url')?.value || '';
  const btn = document.getElementById('btn-submit-register');

  if (!name || !email || !password) {
    showToast('Name, email, and password are required.', 'warning');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email.includes('@') && !emailRegex.test(email)) {
    showToast('Please enter a valid email address.', 'warning');
    return;
  }

  if (password.length < 6) {
    showToast('Password must be at least 6 characters long.', 'warning');
    return;
  }

  if (password !== confirmPassword) {
    showToast('Passwords do not match.', 'error');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Creating student account...';
    if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
  }

  try {
    if (photo && photo.startsWith('data:')) {
      try {
        const uploaded = await uploadImageToCloud(photo, 'student-avatar.jpg');
        if (uploaded && uploaded.startsWith('http')) {
          photo = uploaded;
        } else {
          // If direct upload fails, omit oversized data URL to prevent 413 error
          photo = null;
        }
      } catch (err) {
        console.warn('Avatar upload warning:', err);
        photo = null;
      }
    }

    const res = await fetch(API_BASE + '/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        username: email,
        studentId,
        phone,
        password,
        confirmPassword,
        avatarUrl: photo,
        role: 'student' // Server strictly enforces role='student'
      })
    });

    const contentType = res.headers.get('content-type') || '';
    let data = null;
    if (contentType.includes('application/json')) {
      try { data = await res.json(); } catch (e) {}
    } else {
      const textResp = await res.text();
      data = { success: false, message: textResp || `Server returned status ${res.status}` };
    }

    if (res.ok && data && data.success && data.user) {
      showToast('Student account created successfully! Welcome to LostSeek 🎓', 'success');
      // Populate login username field and switch to login view for clean login verification
      const loginUserInput = document.getElementById('login-username');
      if (loginUserInput) loginUserInput.value = data.user.username;
      setLoginRole('student');
      toggleRegisterView(false);

      // Also set state for immediate access
      appState.user = data.user;
      saveData();
      setupAuthenticatedUser(data.user);
      showPage('dashboard-page');
    } else {
      showToast((data && data.message) ? data.message : 'Registration failed.', 'error');
    }
  } catch (err) {
    showToast('Network error during registration: ' + err.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="check-circle"></i> Create Student Account';
      if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
    }
  }
}

function setupAuthenticatedUser(user) {
  if (!user) user = appState.user;
  if (!user) return;

  const canonicalAvatar = user.avatarUrl || user.avatar || user.avatar_url || user.profilePicture || user.profilePictureUrl || user.photoUrl || null;
  user.avatarUrl = canonicalAvatar;
  user.avatar = canonicalAvatar;
  user.avatar_url = canonicalAvatar;
  user.profilePicture = canonicalAvatar;
  user.profilePictureUrl = canonicalAvatar;
  user.photoUrl = canonicalAvatar;

  // Update UI user profile in header, sidebar & dashboard with user avatar
  const avatarEl = document.getElementById('user-avatar-initials');
  if (avatarEl) avatarEl.innerHTML = getAvatarSVG(user.role, 36, user.avatarUrl);

  const headerAvatarEl = document.getElementById('header-user-avatar');
  if (headerAvatarEl) headerAvatarEl.innerHTML = getAvatarSVG(user.role, 36, user.avatarUrl);

  const dashAvatarEl = document.getElementById('dashboard-user-avatar');
  if (dashAvatarEl) dashAvatarEl.innerHTML = getAvatarSVG(user.role, 48, user.avatarUrl);

  const deskAvatarEl = document.getElementById('admin-desk-avatar');
  if (deskAvatarEl) deskAvatarEl.innerHTML = getAvatarSVG('admin', 48, user.avatarUrl);

  const nameEl = document.getElementById('user-name-display');
  if (nameEl) nameEl.textContent = user.name;

  const roleEl = document.getElementById('user-role-display');
  if (roleEl) roleEl.textContent = user.role;

  const isAdmin = user.role && user.role.toLowerCase() === 'admin';

  const headerBadge = document.getElementById('header-role-badge');
  if (headerBadge) {
    headerBadge.textContent = user.role.toUpperCase();
    headerBadge.className = `badge ${isAdmin ? 'badge-urgent' : 'badge-verified'}`;
  }

  // Toggle Student vs Admin Navigation accordions
  const isStudent = !isAdmin;
  const studentNav = document.getElementById('student-nav-sections');
  const adminNavSections = document.getElementById('admin-nav-sections');
  if (studentNav) studentNav.style.display = isStudent ? 'block' : 'none';
  if (adminNavSections) adminNavSections.style.display = isAdmin ? 'block' : 'none';

  // Toggle Student vs Admin Dashboard views
  const studentView = document.getElementById('student-dashboard-view');
  const adminView = document.getElementById('admin-dashboard-view');
  if (studentView) studentView.style.display = isStudent ? 'block' : 'none';
  if (adminView) adminView.style.display = isAdmin ? 'block' : 'none';

  const studentWelcome = document.getElementById('student-welcome-heading');
  if (studentWelcome) {
    const firstName = user.name.split(' ')[0];
    studentWelcome.textContent = `Hello, ${firstName}`;
  }

  const welcomeMsg = document.getElementById('welcome-message');
  if (welcomeMsg) {
    const firstName = user.name.split(' ')[0];
    welcomeMsg.textContent = `Welcome back, ${firstName}! 👋`;
  }

  // Render responsive mobile bottom navigation
  renderMobileBottomNav(user.role);

  // Hide or show landing vs login vs main layout
  const landingEl = document.getElementById('landing-page');
  if (landingEl) landingEl.style.display = 'none';
  const loginEl = document.getElementById('login-page');
  if (loginEl) {
    loginEl.style.display = 'none';
    loginEl.classList.remove('active');
  }
  document.getElementById('app-layout').style.display = 'flex';

  renderAllViews();
  if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
  syncWithCloud(false);
}

function logout() {
  appState.user = null;
  appState.notifications = []; // Wipe notifications so next user never inherits them
  saveData();
  showToast('Logged out of LostSeek', 'info');
  const isAndroid = typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.includes('LostSeekNativeAndroidApp');
  if (isAndroid) {
    showLoginPage();
    window.location.hash = '#login';
  } else {
    showLandingPage();
  }
}

function showLandingPage() {
  const appLayout = document.getElementById('app-layout');
  if (appLayout) appLayout.style.display = 'none';
  const loginEl = document.getElementById('login-page');
  if (loginEl) {
    loginEl.style.display = 'none';
    loginEl.classList.remove('active');
  }
  const landingEl = document.getElementById('landing-page');
  if (landingEl) {
    landingEl.style.display = 'block';
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
}

function showLoginPage() {
  const landingEl = document.getElementById('landing-page');
  if (landingEl) landingEl.style.display = 'none';
  document.getElementById('app-layout').style.display = 'none';
  const loginEl = document.getElementById('login-page');
  if (loginEl) {
    loginEl.style.display = 'flex';
    loginEl.classList.add('active');
  }

  // Strictly clear username and password inputs on login page load
  const userInput = document.getElementById('login-username');
  const passInput = document.getElementById('login-password');
  const passIcon = document.getElementById('password-toggle-icon');
  if (userInput) userInput.value = '';
  if (passInput) {
    passInput.value = '';
    passInput.setAttribute('type', 'password');
  }
  if (passIcon) {
    passIcon.setAttribute('data-lucide', 'eye');
  }

  initLoginPageAvatars();
  if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
}

function goToAppLogin() {
  ensureAppInitialized();
  if (appState.user && appState.user.name) {
    setupAuthenticatedUser(appState.user);
    showPage('dashboard-page');
  } else {
    showLoginPage();
    window.location.hash = '#login';
  }
}

function goToReportLost() {
  ensureAppInitialized();
  if (appState.user && appState.user.name) {
    setupAuthenticatedUser(appState.user);
    showPage('report-lost-page');
  } else {
    showLoginPage();
    window.location.hash = '#login';
    showToast('Please sign in to report a lost item 📝', 'info');
  }
}

function goToReportFound() {
  ensureAppInitialized();
  if (appState.user && appState.user.name) {
    setupAuthenticatedUser(appState.user);
    showPage('report-found-page');
  } else {
    showLoginPage();
    window.location.hash = '#login';
    showToast('Please sign in to report a found item 🎒', 'info');
  }
}

function handleLandingNav(e, sectionId) {
  if (e && e.preventDefault) e.preventDefault();
  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const links = document.querySelectorAll('.lp-nav-link');
    links.forEach(l => l.classList.remove('active'));
    const targetLink = document.querySelector(`.lp-nav-link[href="#${sectionId}"]`);
    if (targetLink) targetLink.classList.add('active');
  }
}

window.goToAppLogin = goToAppLogin;
window.goToReportLost = goToReportLost;
window.goToReportFound = goToReportFound;
window.handleLandingNav = handleLandingNav;
window.setLoginRole = setLoginRole;
window.toggleLoginPassword = toggleLoginPassword;
window.handleLoginSubmit = handleLoginSubmit;
window.showLoginPage = showLoginPage;
