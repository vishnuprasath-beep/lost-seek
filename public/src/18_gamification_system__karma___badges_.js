/* ==========================================================================
   GAMIFICATION SYSTEM (Karma & Badges)
   ========================================================================== */
const BADGES_CONFIG = [
  {
    id: 'first_find',
    icon: '🤝',
    title: 'First Find',
    desc: 'Reported first found item on campus',
    check: (state) => state.foundReports.length >= 1
  },
  {
    id: 'good_samaritan',
    icon: '🌟',
    title: 'Good Samaritan',
    desc: 'Reported 3 or more found belongings',
    check: (state) => state.foundReports.length >= 3
  },
  {
    id: 'campus_hero',
    icon: '🏆',
    title: 'Campus Hero',
    desc: 'Helped successfully return 5+ items to owners',
    check: (state) => state.lostReports.filter(r => r.status === 'Returned').length + 
                      state.foundReports.filter(r => r.status === 'Returned').length >= 1
  },
  {
    id: 'sharp_eye',
    icon: '🔍',
    title: 'Sharp Eye',
    desc: 'Reported an item matched by AI within 24 hours',
    check: (state) => calculateMatchesList().length >= 1
  }
];

function addKarma(points, reason = '') {
  if (!appState.user) return;
  appState.user.karma = (appState.user.karma || 0) + points;
  saveData();
  updateKarmaDisplay();
  evaluateBadges();
  showToast(`⚡ +${points} Karma Points earned! ${reason}`, 'success');
}

function updateKarmaDisplay() {
  const karmaVal = appState.user ? (appState.user.karma || 0) : 0;
  const karmaHeader = document.getElementById('header-karma-count');
  if (karmaHeader) karmaHeader.textContent = karmaVal;

  const tierLabel = document.getElementById('karma-tier-label');
  if (tierLabel) {
    if (karmaVal >= 100) tierLabel.textContent = '🏆 Campus Hero';
    else if (karmaVal >= 50) tierLabel.textContent = '🛡️ Campus Guardian';
    else if (karmaVal >= 20) tierLabel.textContent = '🌟 Good Samaritan';
    else tierLabel.textContent = '🤝 Helpful Scout';
  }
}

function evaluateBadges() {
  if (!appState.user) return;
  if (!appState.user.badges) appState.user.badges = [];

  let newlyUnlocked = false;
  BADGES_CONFIG.forEach(badge => {
    if (!appState.user.badges.includes(badge.id) && badge.check(appState)) {
      appState.user.badges.push(badge.id);
      newlyUnlocked = true;
    }
  });

  if (newlyUnlocked) {
    saveData();
    renderBadges();
  }
}

function renderBadges() {
  const container = document.getElementById('dashboard-badges-container');
  if (!container) return;

  const userBadges = (appState.user && appState.user.badges) || [];

  container.innerHTML = BADGES_CONFIG.map(b => {
    const isUnlocked = userBadges.includes(b.id);
    return `
      <div class="badge-item-card ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="badge-card-icon">${b.icon}</div>
        <div class="badge-card-title">${escapeHTML(b.title)}</div>
        <div class="badge-card-desc">${escapeHTML(b.desc)}</div>
        <div class="badge-card-status">${isUnlocked ? '✓ Unlocked' : '🔒 In Progress'}</div>
      </div>
    `;
  }).join('');
}
