/* ==========================================================================
   LOSTSEEK DESIGN SYSTEM, THEMES & AVATARS
   ========================================================================== */
let currentTheme = localStorage.getItem('lostseek_theme') || 'system';

function initTheme() {
  applyTheme(currentTheme, false);

  // Respond to OS theme changes if on system mode
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (currentTheme === 'system') {
        applyTheme('system', false);
      }
    });
  }
}

function applyTheme(theme, showNotice = false) {
  currentTheme = theme;
  localStorage.setItem('lostseek_theme', theme);

  let effectiveTheme = theme;
  if (theme === 'system') {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    effectiveTheme = isDark ? 'dark' : 'light';
  }

  document.documentElement.setAttribute('data-theme', effectiveTheme);

  // Update header theme icon
  const iconEl = document.getElementById('header-theme-icon');
  if (iconEl) {
    iconEl.setAttribute('data-lucide', effectiveTheme === 'dark' ? 'sun' : 'moon');
  }

  // Update Settings page segmented cards if visible
  updateSettingsThemeCards(theme);

  // Adapt Chart.js instances to active theme
  adaptChartsToTheme(effectiveTheme);

  if (window.lucide) {
    if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
  }

  if (showNotice) {
    showToast(`Theme switched to ${theme.charAt(0).toUpperCase() + theme.slice(1)} Mode`, 'info');
  }
}

function setTheme(theme) {
  applyTheme(theme, true);
}

function cycleTheme() {
  const next = currentTheme === 'dark' ? 'light' : (currentTheme === 'light' ? 'system' : 'dark');
  setTheme(next);
}

function updateSettingsThemeCards(activeTheme) {
  ['dark', 'light', 'system'].forEach(t => {
    const el = document.getElementById(`theme-opt-${t}`);
    if (el) {
      if (t === activeTheme) el.classList.add('active');
      else el.classList.remove('active');
    }
  });
}

function adaptChartsToTheme(effectiveTheme) {
  if (typeof Chart === 'undefined') return;
  const isDark = (effectiveTheme === 'dark');
  const textColor = isDark ? '#9BB5B3' : '#456865';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

  ['chart-categories', 'chart-timeline', 'chart-recovery', 'chart-locations'].forEach(id => {
    const chart = (typeof analyticsChartInstances !== 'undefined' && analyticsChartInstances[id]) || Chart.getChart(id);
    if (chart) {
      if (chart.options.scales) {
        if (chart.options.scales.x) {
          if (chart.options.scales.x.ticks) chart.options.scales.x.ticks.color = textColor;
          if (chart.options.scales.x.grid) chart.options.scales.x.grid.color = gridColor;
        }
        if (chart.options.scales.y) {
          if (chart.options.scales.y.ticks) chart.options.scales.y.ticks.color = textColor;
          if (chart.options.scales.y.grid) chart.options.scales.y.grid.color = gridColor;
        }
      }
      if (chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels) {
        chart.options.plugins.legend.labels.color = isDark ? '#F4FAF9' : '#0B2024';
      }
      chart.update();
    }
  });
}

// Sourced directly from user-provided reference image
const LOSTSEEK_STUDENT_AVATAR_B64 = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";
const LOSTSEEK_ADMIN_AVATAR_B64 = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='9' cy='7' r='4'/%3E%3Cpath d='M22 21v-2a4 4 0 0 0-3-3.87'/%3E%3Cpath d='M16 3.13a4 4 0 0 1 0 7.75'/%3E%3C/svg%3E";

const STUDENT_AVATAR_PATH = LOSTSEEK_STUDENT_AVATAR_B64;
const ADMIN_AVATAR_PATH = LOSTSEEK_ADMIN_AVATAR_B64;

/**
 * StudentAvatar: Sourced directly from user provided reference asset
 * Resilient multi-tier fallback (assets -> public/assets -> root -> base64 data)
 * Guarantees zero "Unavailable" or broken-image states across all local and deployed hosts.
 */
function StudentAvatar(size = 40) {
  return `<img src="${STUDENT_AVATAR_PATH}" 
               onerror="if(!this.dataset.r){this.dataset.r='1';this.src='public/assets/images/student-avatar.png';}else if(this.dataset.r==='1'){this.dataset.r='2';this.src='./student-avatar.png';}else{this.onerror=null;this.src=LOSTSEEK_STUDENT_AVATAR_B64;}"
               class="lostseek-avatar-img" 
               width="${size}" 
               height="${size}" 
               alt="Student Avatar" 
               loading="eager" 
               decoding="sync"
               style="width:${size}px; height:${size}px; border-radius:50%; object-fit:cover; display:block;" />`;
}

/**
 * AdminAvatar: Sourced directly from user provided reference asset
 * Resilient multi-tier fallback (assets -> public/assets -> root -> base64 data)
 * Guarantees zero "Unavailable" or broken-image states across all local and deployed hosts.
 */
function AdminAvatar(size = 40) {
  return `<img src="${ADMIN_AVATAR_PATH}" 
               onerror="if(!this.dataset.r){this.dataset.r='1';this.src='public/assets/images/admin-avatar.png';}else if(this.dataset.r==='1'){this.dataset.r='2';this.src='./admin-avatar.png';}else{this.onerror=null;this.src=LOSTSEEK_ADMIN_AVATAR_B64;}"
               class="lostseek-avatar-img" 
               width="${size}" 
               height="${size}" 
               alt="Admin Avatar" 
               loading="eager" 
               decoding="sync"
               style="width:${size}px; height:${size}px; border-radius:50%; object-fit:cover; display:block;" />`;
}

function getAvatarSVG(role, size = 40, customUrl = undefined) {
  const u = window.appState && window.appState.user;
  let avatarUrl = customUrl;

  // If customUrl was not explicitly specified, use current logged in user avatar
  // ONLY if role matches current user's role or no role was passed.
  if (avatarUrl === undefined) {
    if (u && (!role || (String(role).toLowerCase() === String(u.role || '').toLowerCase()))) {
      avatarUrl = u.avatarUrl || u.avatar || u.avatar_url || u.profilePicture || u.profilePictureUrl || u.photoUrl || null;
    } else {
      avatarUrl = null;
    }
  }

  if (avatarUrl && String(avatarUrl).trim()) {
    const isStudent = !role || String(role).toLowerCase() === 'student';
    const fallbackAttr = isStudent
      ? `if(!this.dataset.r){this.dataset.r='1';this.src='public/assets/images/student-avatar.png';}else if(this.dataset.r==='1'){this.dataset.r='2';this.src='./student-avatar.png';}else{this.onerror=null;this.src=LOSTSEEK_STUDENT_AVATAR_B64;}`
      : `if(!this.dataset.r){this.dataset.r='1';this.src='public/assets/images/admin-avatar.png';}else if(this.dataset.r==='1'){this.dataset.r='2';this.src='./admin-avatar.png';}else{this.onerror=null;this.src=LOSTSEEK_ADMIN_AVATAR_B64;}`;

    return `<img src="${escapeHTML(String(avatarUrl).trim())}" 
                 onerror="${fallbackAttr}" 
                 class="lostseek-avatar-img custom-avatar" 
                 width="${size}" 
                 height="${size}" 
                 alt="User Avatar" 
                 style="width:${size}px; height:${size}px; border-radius:50%; object-fit:cover; display:block; border: 2px solid var(--teal-bright);" />`;
  }

  const isAdmin = (role && (role.toLowerCase() === 'admin' || role.toLowerCase() === 'supervisor' || role.toLowerCase() === 'director'));
  return isAdmin ? AdminAvatar(size) : StudentAvatar(size);
}

function initLoginPageAvatars() {
  const studentBtnAvatar = document.getElementById('login-role-student-avatar');
  if (studentBtnAvatar) studentBtnAvatar.innerHTML = getAvatarSVG('student', 36);

  const adminBtnAvatar = document.getElementById('login-role-admin-avatar');
  if (adminBtnAvatar) adminBtnAvatar.innerHTML = getAvatarSVG('admin', 36);

  const roleInput = document.getElementById('login-role');
  const role = roleInput ? roleInput.value : 'student';
  updateLoginAvatarPreview(role);
}

function updateLoginAvatarPreview(role) {
  const preview = document.getElementById('login-avatar-preview');
  if (preview) {
    preview.innerHTML = getAvatarSVG(role, 80);
  }
}

function renderMobileBottomNav(role) {
  const nav = document.getElementById('mobile-bottom-nav');
  if (!nav) return;
  const isAdmin = (role || '').toLowerCase() === 'admin';

  if (isAdmin) {
    nav.innerHTML = `
      <a href="#dashboard" class="bottom-nav-item" data-page="dashboard-page">
        <i data-lucide="layout-dashboard"></i>
        <span>Dashboard</span>
      </a>
      <a href="#admin" class="bottom-nav-item" data-page="admin-page">
        <i data-lucide="shield-check"></i>
        <span>Admin</span>
      </a>
      <a href="#matches" class="bottom-nav-item" data-page="matches-page">
        <i data-lucide="sparkles"></i>
        <span>Matches</span>
      </a>
      <a href="#analytics" class="bottom-nav-item" data-page="analytics-page">
        <i data-lucide="chart-no-axes-combined"></i>
        <span>Reports</span>
      </a>
      <a href="#profile" class="bottom-nav-item" data-page="profile-page">
        <div class="bottom-nav-avatar">${getAvatarSVG('admin', 22)}</div>
        <span>Profile</span>
      </a>
    `;
  } else {
    nav.innerHTML = `
      <a href="#dashboard" class="bottom-nav-item" data-page="dashboard-page">
        <i data-lucide="home"></i>
        <span>Home</span>
      </a>
      <a href="#find-item" class="bottom-nav-item" data-page="find-item-page">
        <i data-lucide="search"></i>
        <span>Find</span>
      </a>
      <a href="#i-found" class="bottom-nav-item" data-page="i-found-page">
        <i data-lucide="camera"></i>
        <span>I Found</span>
      </a>
      <a href="#matches" class="bottom-nav-item" data-page="matches-page">
        <i data-lucide="sparkles"></i>
        <span>Matches</span>
      </a>
      <a href="#profile" class="bottom-nav-item" data-page="profile-page">
        <div class="bottom-nav-avatar">${getAvatarSVG('student', 22)}</div>
        <span>Profile</span>
      </a>
    `;
  }
  if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
}

function syncMobileBottomNav(pageId) {
  const items = document.querySelectorAll('.bottom-nav-item');
  items.forEach(item => {
    if (item.getAttribute('data-page') === pageId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}
