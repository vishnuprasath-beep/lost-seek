/* ==========================================================================
   NAVIGATION & ROUTING (SPA)
   ========================================================================== */
function showPage(pageId) {
  // Session check: if not logged in, redirect to login page
  if (!appState.user && pageId !== 'login-page') {
    showLoginPage();
    return;
  }

  // Admin role check guard for all staff/admin pages
  const adminPages = [
    'admin-page', 'admin-lost-page', 'admin-found-page', 'admin-all-page',
    'admin-claims-page', 'admin-matches-page', 'admin-photo-search-page',
    'admin-students-page', 'admin-help-page'
  ];
  if (adminPages.includes(pageId)) {
    const isAdmin = appState.user && appState.user.role && appState.user.role.toLowerCase() === 'admin';
    if (!isAdmin) {
      showToast('Staff / Admin privileges required to access Staff Console 🛡️', 'warning');
      showPage('dashboard-page');
      return;
    }
  }

  // Authoritative visibility state: hide landing and login, show app-layout
  const landingEl = document.getElementById('landing-page');
  if (landingEl) landingEl.style.display = 'none';
  const loginEl = document.getElementById('login-page');
  if (loginEl) {
    loginEl.style.display = 'none';
    loginEl.classList.remove('active');
  }
  const appLayout = document.getElementById('app-layout');
  if (appLayout) appLayout.style.display = 'flex';

  // Hide all sections inside app-layout
  const sections = document.querySelectorAll('.page-section');
  sections.forEach(sec => {
    if (sec.id !== 'login-page') {
      sec.classList.remove('active');
      sec.style.display = 'none';
    }
  });

  // Show target
  const target = document.getElementById(pageId);
  if (target) {
    target.style.display = 'block';
    target.classList.add('active', 'fade-in');
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Update nav active link
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    if (link.getAttribute('data-page') === pageId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Update breadcrumb
  const crumb = document.getElementById('breadcrumb-current');
  if (crumb) {
    const titleMap = {
      'dashboard-page': (appState.user?.role?.toLowerCase() === 'admin' ? 'Dashboard' : 'Home'),
      'find-item-page': 'Find Item',
      'i-found-page': 'I Found an Item',
      'report-lost-page': 'Report Lost',
      'report-found-page': 'Report Found',
      'matches-page': 'Possible Matches',
      'my-reports-page': 'My Reports',
      'admin-page': 'Admin Desk',
      'admin-photo-search-page': 'Find by Photo',
      'admin-students-page': 'Students',
      'analytics-page': 'Reports & Stats',
      'alerts-page': 'Alerts',
      'profile-page': 'Profile',
      'settings-page': 'Settings',
      'help-safety-page': 'Help & Safety',
      'admin-help-page': 'Help & Complaints',
      'admin-lost-page': 'Lost Items',
      'admin-found-page': 'Found Items',
      'admin-all-page': 'All Reports',
      'admin-claims-page': 'Claims',
      'admin-matches-page': 'Match Center'
    };
    crumb.textContent = titleMap[pageId] || 'LostSeek';
  }

  // Sync hash
  const hashMap = {
    'dashboard-page': 'dashboard',
    'find-item-page': 'find-item',
    'i-found-page': 'i-found',
    'report-lost-page': 'report-lost',
    'report-found-page': 'report-found',
    'matches-page': 'matches',
    'my-reports-page': 'my-reports',
    'admin-page': 'admin',
    'admin-photo-search-page': 'admin-find-photo',
    'admin-students-page': 'admin-students',
    'analytics-page': 'analytics',
    'alerts-page': 'alerts',
    'profile-page': 'profile',
    'settings-page': 'settings',
    'help-safety-page': 'help-safety',
    'admin-help-page': 'admin-help',
    'admin-lost-page': 'admin-lost',
    'admin-found-page': 'admin-found',
    'admin-all-page': 'admin-all',
    'admin-claims-page': 'admin-claims',
    'admin-matches-page': 'admin-matches'
  };
  const targetHash = hashMap[pageId] || 'dashboard';
  if (window.location.hash !== `#${targetHash}`) {
    window.location.hash = targetHash;
  }

  // Close mobile sidebar if open
  closeMobileSidebar();
  syncMobileBottomNav(pageId);

  // Trigger animations or renders specific to page
  if (pageId === 'dashboard-page') {
    const isStudent = appState.user && appState.user.role && appState.user.role.toLowerCase() === 'student';
    if (isStudent) {
      renderStudentHomeFeeds();
    } else {
      animateStatCounters();
      renderDashboardActivity();
      renderBadges();
    }
    updateKarmaDisplay();
  } else if (pageId === 'find-item-page') {
    renderFindItem();
  } else if (pageId === 'i-found-page') {
    initIFoundPage();
  } else if (pageId === 'matches-page') {
    renderAIMatches();
  } else if (pageId === 'my-reports-page') {
    renderMyReports(currentMyReportsTab);
  } else if (pageId === 'admin-page') {
    renderAdminDesk();
  } else if (pageId === 'admin-photo-search-page') {
    initAdminPhotoSearch();
  } else if (pageId === 'admin-students-page') {
    renderAdminStudents();
  } else if (pageId === 'analytics-page') {
    renderAnalyticsPage();
  } else if (pageId === 'alerts-page') {
    renderAlertsPage();
  } else if (pageId === 'profile-page') {
    renderProfile();
  } else if (pageId === 'settings-page') {
    renderSettings();
  } else if (pageId === 'help-safety-page') {
    renderHelpSafetyPage();
  } else if (pageId === 'admin-help-page') {
    renderAdminHelpDesk('all');
  } else if (pageId === 'admin-lost-page') {
    renderAdminLostPage();
  } else if (pageId === 'admin-found-page') {
    renderAdminFoundPage();
  } else if (pageId === 'admin-all-page' || pageId === 'admin-page') {
    renderAdminAllReportsPage();
  } else if (pageId === 'admin-claims-page') {
    renderAdminClaimsPage('all');
  } else if (pageId === 'admin-matches-page') {
    renderAdminMatchCenterPage();
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function handleHashNavigation() {
  // If public verification QR/modal handled it, return
  if (checkPublicReportUrl()) return;

  const rawHash = window.location.hash || '';
  const hash = rawHash.replace(/^#\/?/, '').trim().toLowerCase();
  const isAndroid = typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.includes('LostSeekNativeAndroidApp');

  const appRouteMap = {
    'dashboard': 'dashboard-page',
    'find-item': 'find-item-page',
    'i-found': 'i-found-page',
    'report-lost': 'report-lost-page',
    'report-found': 'report-found-page',
    'matches': 'matches-page',
    'my-reports': 'my-reports-page',
    'admin': 'admin-all-page',
    'admin-lost': 'admin-lost-page',
    'admin-found': 'admin-found-page',
    'admin-all': 'admin-all-page',
    'admin-claims': 'admin-claims-page',
    'admin-matches': 'admin-matches-page',
    'admin-find-photo': 'admin-photo-search-page',
    'admin-students': 'admin-students-page',
    'analytics': 'analytics-page',
    'alerts': 'alerts-page',
    'profile': 'profile-page',
    'settings': 'settings-page',
    'help-safety': 'help-safety-page',
    'admin-help': 'admin-help-page'
  };

  // NATIVE ANDROID ROUTING LOGIC:
  // For native Android startup, session restoration takes priority over the #login startup hash:
  // IF native Android AND valid session exists -> restore the user's normal dashboard
  // IF native Android AND no valid session    -> show #login
  // Never show the public landing page in the APK.
  if (isAndroid) {
    if (appState.user && appState.user.name) {
      if (hash === 'home' || hash === 'landing' || hash === 'login' || !hash) {
        showPage('dashboard-page');
        return;
      }
      const targetPage = appRouteMap[hash] || 'dashboard-page';
      showPage(targetPage);
      return;
    } else {
      // Unauthenticated in APK: always open login/application entry
      showLoginPage();
      return;
    }
  }

  // NORMAL WEB BROWSER ROUTING LOGIC:
  // If valid authenticated session exists:
  if (appState.user && appState.user.name) {
    if (hash === 'home' || hash === 'landing') {
      showLandingPage();
      return;
    }
    const targetPage = appRouteMap[hash] || 'dashboard-page';
    showPage(targetPage);
    return;
  }

  // Web Browser Unauthenticated visitor logic:
  if (hash === 'login') {
    showLoginPage();
    return;
  }
  if (hash === 'register') {
    showLoginPage();
    toggleRegisterView(true);
    return;
  }
  if (hash === 'report-lost') {
    showLoginPage();
    showToast('Please sign in to report a lost item 📝', 'info');
    return;
  }
  if (hash === 'report-found') {
    showLoginPage();
    showToast('Please sign in to report a found item 🎒', 'info');
    return;
  }
  if (appRouteMap[hash]) {
    // Explicit app route requested without session -> prompt login
    showLoginPage();
    showToast('Please sign in to access LostSeek', 'info');
    return;
  }
  if (['how-it-works', 'ai-matching', 'community', 'privacy'].includes(hash)) {
    showLandingPage();
    const targetEl = document.getElementById(hash);
    if (targetEl) {
      setTimeout(() => {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
    return;
  }

  // Fresh unauthenticated visitor / root URL / #home / #landing -> SHOW LANDING PAGE
  showLandingPage();
}

