/* ==========================================================================
   INITIALIZATION & SEED DATA (PERFORMANCE OPTIMIZED & DEFERRED HYDRATION)
   ========================================================================== */
let appInitialized = false;

function ensureAppInitialized() {
  if (appInitialized) return;
  appInitialized = true;

  loadData();
  initLoginPageAvatars();

  // Populate default dates for report forms
  const nowStr = new Date().toISOString().slice(0, 16);
  const lostDateEl = document.getElementById('lost-date');
  const foundDateEl = document.getElementById('found-date');
  if (lostDateEl && !lostDateEl.value) lostDateEl.value = nowStr;
  if (foundDateEl && !foundDateEl.value) foundDateEl.value = nowStr;

  // Initialize wizard dynamic forms & drag-and-drop
  initWizardForms();

  // Set up login form submit listener
  const loginForm = document.getElementById('login-form');
  if (loginForm && !loginForm._listenerBound) {
    loginForm._listenerBound = true;
    loginForm.addEventListener('submit', handleLoginSubmit);
  }

  // Handle authenticated user or startup routing:
  if (checkPublicReportUrl()) {
    // Handled by public QR verification modal
  } else if (appState.user && appState.user.name) {
    setupAuthenticatedUser(appState.user);
    handleHashNavigation();
    syncWithCloud(false);
    // Immediate authoritative server profile check to prevent stale localStorage override
    const cleanUser = appState.user.username || appState.user.id;
    if (cleanUser) {
      fetch(API_BASE + `/api/auth?action=profile&username=${encodeURIComponent(cleanUser)}`, {
        headers: getAuthHeaders()
      })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && d.profile && d.profile.avatarUrl) {
          const av = d.profile.avatarUrl;
          appState.user.avatarUrl = av;
          appState.user.avatar = av;
          appState.user.avatar_url = av;
          appState.user.profilePicture = av;
          appState.user.profilePictureUrl = av;
          appState.user.photoUrl = av;
          saveData();
          setupAuthenticatedUser(appState.user);
          if (typeof renderProfile === 'function') renderProfile();
        }
      })
      .catch(() => {});
    }
  } else {
    handleHashNavigation();
  }

  if (window.lucide) window.lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  initTheme();

  // Quick non-blocking check for existing session in localStorage
  let hasSession = false;
  try {
    const raw = localStorage.getItem('lostseek_state');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.user && parsed.user.name) {
        hasSession = true;
      }
    }
  } catch (e) {}

  const isAndroid = typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.includes('LostSeekNativeAndroidApp');
  const rawHash = (window.location.hash || '').replace(/^#\/?/, '').trim().toLowerCase();
  const isAppHash = rawHash && !['home', 'landing', 'how-it-works', 'ai-matching', 'community', 'privacy'].includes(rawHash);

  // Check if current URL is a public verification request from scanned QR tag (/report/<ID>)
  const isPublicReport = checkPublicReportUrl();

  // Handle URL hash changes
  window.addEventListener('hashchange', () => {
    ensureAppInitialized();
    if (!checkPublicReportUrl()) {
      handleHashNavigation();
    }
  });

  // If Android APK, active session, QR report, or app hash requested -> immediate full initialization
  if (isAndroid || hasSession || isPublicReport || isAppHash) {
    ensureAppInitialized();
    return;
  }

  // Otherwise, lightweight landing page mode:
  // Render landing page immediately without parsing heavy data, avatars, or network sync
  if (window.lucide) window.lucide.createIcons();

  // Schedule background hydration during idle time (or after 2s delay)
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => ensureAppInitialized(), { timeout: 2000 });
  } else {
    setTimeout(ensureAppInitialized, 2000);
  }
}

/**
 * Seed 6 rich demo items (3 lost + 3 found) covering phone, backpack, ID card
 */
function getInitialSeedData() {
  return {
    user: null,
    lostReports: [],
    foundReports: [],
    claims: [],
    notifications: [],
    matches: [],
    adminHelpRequests: [],
    officialContacts: JSON.parse(JSON.stringify(DEFAULT_OFFICIAL_CONTACTS))
  };
}

function _legacySeedData() {
  const daysAgo = (days) => new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
  const hoursAgo = (hrs) => new Date(Date.now() - hrs * 3600 * 1000).toISOString();

  // 12 Prompt Specified Items (6 Lost + 6 Found)
  const lost = [
    {
      id: 'lost-1',
      category: 'id-card',
      title: 'Student ID Card — Ravi Kumar, CSE Dept',
      description: 'University ID Card belonging to Ravi Kumar, Computer Science & Engineering department (3rd Year). Blue lanyard attached.',
      color: 'Blue & White',
      brand: 'Campus Security',
      location: 'Library',
      date: '2026-09-15T11:30:00.000Z',
      photo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
      status: 'Searching',
      createdAt: '2026-09-15T11:30:00.000Z',
      matchId: 'found-3'
    },
    {
      id: 'lost-2',
      category: 'electronics',
      title: 'Samsung Galaxy S23, black with blue case',
      description: 'Samsung Galaxy S23 256GB in Phantom Black with a navy blue silicone protective case. Lock screen shows mountain sunrise.',
      color: 'Black / Blue',
      brand: 'Samsung',
      location: 'Cafeteria',
      date: '2026-09-14T13:45:00.000Z',
      photo: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&auto=format&fit=crop&q=80',
      status: 'Matched',
      createdAt: '2026-09-14T13:45:00.000Z',
      matchId: 'found-1'
    },
    {
      id: 'lost-3',
      category: 'bags',
      title: 'Black Wildcraft backpack with red zipper',
      description: 'Wildcraft 35L water-resistant college backpack. Black with bold red zippers, contains laptop sleeve and physics lecture notes.',
      color: 'Black & Red',
      brand: 'Wildcraft',
      location: 'Lab Complex',
      date: '2026-09-13T16:20:00.000Z',
      photo: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&auto=format&fit=crop&q=80',
      status: 'Searching',
      createdAt: '2026-09-13T16:20:00.000Z',
      matchId: 'found-2'
    },
    {
      id: 'lost-4',
      category: 'keys',
      title: '3 keys with Doraemon keychain',
      description: 'Bunch of 3 metallic keys (room lock, bike key, locker key) connected to a cute blue Doraemon rubber keychain.',
      color: 'Silver / Blue',
      brand: 'Godrej / Honda',
      location: 'Parking Area',
      date: '2026-09-16T09:15:00.000Z',
      photo: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&auto=format&fit=crop&q=80',
      status: 'Searching',
      createdAt: '2026-09-16T09:15:00.000Z',
      matchId: 'found-4'
    },
    {
      id: 'lost-5',
      category: 'wallet',
      title: 'Brown leather wallet, had ~500 cash',
      description: 'Genuine brown leather bifold wallet. Contained approximately ₹500 cash, student gym membership card, and metro pass.',
      color: 'Brown',
      brand: 'Woodland',
      location: 'Main Building',
      date: '2026-09-15T17:00:00.000Z',
      photo: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&auto=format&fit=crop&q=80',
      status: 'Claimed',
      createdAt: '2026-09-15T17:00:00.000Z',
      matchId: null
    },
    {
      id: 'lost-6',
      category: 'documents',
      title: 'Engineering Mathematics by B.S. Grewal',
      description: 'Higher Engineering Mathematics 44th Edition textbook by B.S. Grewal. Has highlighter markings in chapters 7 and 9.',
      color: 'Yellow & Black',
      brand: 'Khanna Publishers',
      location: 'Library',
      date: '2026-09-12T10:00:00.000Z',
      photo: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
      status: 'Returned',
      createdAt: '2026-09-12T10:00:00.000Z',
      matchId: null
    }
  ];

  const found = [
    {
      id: 'found-1',
      category: 'electronics',
      title: 'Samsung phone, black, blue cover',
      description: 'Turned in near cafeteria tables. Samsung smartphone with navy blue case, camera lenses intact, battery at 40%.',
      color: 'Black / Blue',
      brand: 'Samsung',
      location: 'Cafeteria',
      date: '2026-09-14T14:10:00.000Z',
      photo: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&auto=format&fit=crop&q=80',
      status: 'Matched',
      createdAt: '2026-09-14T14:10:00.000Z',
      custody: 'Dropped at Security',
      finderName: 'Kavita Singh (Cafeteria Staff)'
    },
    {
      id: 'found-2',
      category: 'bags',
      title: 'Black backpack, red accents',
      description: 'Spotted on the bench at Lab Complex corridor. Black backpack with distinct red zip pulls and side mesh bottle pocket.',
      color: 'Black & Red',
      brand: 'Wildcraft',
      location: 'Lab Complex',
      date: '2026-09-13T17:30:00.000Z',
      photo: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&auto=format&fit=crop&q=80',
      status: 'Searching',
      createdAt: '2026-09-13T17:30:00.000Z',
      custody: 'With Me',
      finderName: 'Aman Verma'
    },
    {
      id: 'found-3',
      category: 'id-card',
      title: 'Student card, CSE department',
      description: 'Found right at the central library entrance turnstile. Student card of Ravi Kumar, Department of Computer Science.',
      color: 'Blue & White',
      brand: 'University ID',
      location: 'Library',
      date: '2026-09-15T12:00:00.000Z',
      photo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
      status: 'Matched',
      createdAt: '2026-09-15T12:00:00.000Z',
      custody: 'Dropped at Security',
      finderName: 'Librarian Desk'
    },
    {
      id: 'found-4',
      category: 'keys',
      title: 'Bunch of keys, cartoon keychain',
      description: 'Found on the spectator bench near Sports Ground cricket nets. 3 keys attached to a Doraemon anime figure.',
      color: 'Silver / Blue',
      brand: 'Keys',
      location: 'Sports Ground',
      date: '2026-09-16T11:00:00.000Z',
      photo: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&auto=format&fit=crop&q=80',
      status: 'Searching',
      createdAt: '2026-09-16T11:00:00.000Z',
      custody: 'With Me',
      finderName: 'Rohan Sharma'
    },
    {
      id: 'found-5',
      category: 'clothing',
      title: 'Blue denim jacket, size M',
      description: 'Left on chair row G in the main auditorium after the orientation seminar over 35 days ago. Unclaimed aging inventory.',
      color: 'Blue',
      brand: 'Levi\'s',
      location: 'Auditorium',
      date: daysAgo(35),
      photo: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400&auto=format&fit=crop&q=80',
      status: 'Searching',
      createdAt: daysAgo(35), // > 30 days for Expired tab!
      custody: 'Dropped at Security',
      finderName: 'Auditorium Custodian'
    },
    {
      id: 'found-6',
      category: 'documents',
      title: 'Red notebook, Physics notes',
      description: 'Classmate spiral notebook with red cover, containing detailed 1st year Engineering Physics handwritten formula notes.',
      color: 'Red',
      brand: 'Classmate',
      location: 'Main Building',
      date: '2026-09-11T15:10:00.000Z',
      photo: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&auto=format&fit=crop&q=80',
      status: 'Searching',
      createdAt: '2026-09-11T15:10:00.000Z',
      custody: 'With Me',
      finderName: 'Pooja Nair'
    }
  ];

  // 1 Pre-created Pending Claim for Hackathon Demo Flow
  const claims = [
    {
      id: 'claim-demo-1',
      lostReportId: 'lost-2',
      foundReportId: 'found-1',
      claimantName: 'Alex Rivera',
      matchScore: 87,
      status: 'Pending Admin Review',
      verificationAnswer: 'Samsung Galaxy S23 Phantom Black with navy blue silicone case. Lock screen wallpaper is a mountain sunrise with golden sky. Emergency contact displayed on screen is mom (ending in 8891). PIN ends in 24.',
      contact: 'alex.rivera@campus.edu • +1 (555) 019-2834',
      createdAt: '2026-09-14T15:30:00.000Z'
    }
  ];

  const notifications = [
    {
      id: 'notif-1',
      message: '🤖 AI Match Alert: 87% match between your Samsung S23 report and an item recovered at Cafeteria!',
      read: false,
      createdAt: hoursAgo(2)
    },
    {
      id: 'notif-2',
      message: '⏳ Claim #claim-demo-1 is currently pending security desk approval.',
      read: false,
      createdAt: hoursAgo(5)
    },
    {
      id: 'notif-3',
      message: '⚡ You earned +10 Karma points for registering campus lost and found belongings.',
      read: true,
      createdAt: daysAgo(1)
    }
  ];

  return {
    user: null,
    lostReports: lost,
    foundReports: found,
    claims: claims,
    notifications: notifications,
    adminHelpRequests: [],
    officialContacts: JSON.parse(JSON.stringify(DEFAULT_OFFICIAL_CONTACTS))
  };
}
