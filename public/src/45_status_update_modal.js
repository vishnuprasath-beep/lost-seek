/* ==========================================================================
   STATUS UPDATE MODAL
   ========================================================================== */
let activeStatusReportId = null;

async function openStatusUpdateModal(reportId) {
  activeStatusReportId = reportId;
  const report = (appState.lostReports || []).find(r => r.id === reportId) ||
                 (appState.foundReports || []).find(r => r.id === reportId);
  if (!report) return;

  const validStatuses = ['Active', 'Pending', 'Under Verification', 'Claim Approved', 'Verified', 'Returned', 'Recovered', 'Closed', 'Expired'];
  const currentStatus = report.status || 'Active';
  const input = prompt(`Update status for "${report.title}" (Current: ${currentStatus}):\n\nValid Statuses: Active, Under Verification, Claim Approved, Recovered, Returned, Closed`, currentStatus);

  if (!input || !input.trim() || input.trim() === currentStatus) return;

  let normalizedStatus = input.trim();
  // Map common user or legacy UI inputs to valid database constraint values
  if (normalizedStatus.toLowerCase() === 'looking' || normalizedStatus.toLowerCase() === 'possible match') {
    normalizedStatus = 'Active';
  } else if (normalizedStatus.toLowerCase() === 'claim submitted') {
    normalizedStatus = 'Under Verification';
  } else if (normalizedStatus.toLowerCase() === 'archived') {
    normalizedStatus = 'Closed';
  }

  // Ensure case matches valid status
  const matched = validStatuses.find(s => s.toLowerCase() === normalizedStatus.toLowerCase());
  if (!matched) {
    showToast(`Invalid status. Choose from: ${validStatuses.join(', ')}`, 'error');
    return;
  }

  report.status = matched;
  if (!report.history) report.history = [];
  report.history.push({
    action: `Status Changed to ${matched}`,
    timestamp: new Date().toISOString(),
    author: appState.user?.name || 'Administrator',
    note: `Manual administrative status update.`
  });

  saveData();
  renderAllAdminPages();

  // Async push to production cloud backend
  try {
    const user = appState.user;
    const headers = { 'Content-Type': 'application/json' };
    if (user) headers['x-lostseek-user'] = encodeURIComponent(JSON.stringify(user));
    await fetch(API_BASE + `/api/reports?id=${reportId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: matched })
    });
  } catch (err) {
    console.warn('Could not sync status change to cloud backend:', err.message);
  }

  showToast(`Status updated to ${matched}!`, 'success');
}

function renderAllAdminPages() {
  renderAdminLostPage();
  renderAdminFoundPage();
  renderAdminAllReportsPage();
  renderAdminClaimsPage();
  renderAdminMatchCenterPage();
  updateAdminMetricsAndBadges();
}


window.renderAdminLostPage = renderAdminLostPage;
window.renderAdminFoundPage = renderAdminFoundPage;
window.renderAdminAllReportsPage = renderAdminAllReportsPage;
window.renderAdminClaimsPage = renderAdminClaimsPage;
window.renderAdminMatchCenterPage = renderAdminMatchCenterPage;
window.handleAdminLostFilterChange = handleAdminLostFilterChange;
window.handleAdminFoundFilterChange = handleAdminFoundFilterChange;
window.handleAdminAllFilterChange = handleAdminAllFilterChange;
window.handleAdminClaimsFilterChange = handleAdminClaimsFilterChange;
window.handleAdminMatchFilterChange = handleAdminMatchFilterChange;
window.filterAdminClaimsTab = filterAdminClaimsTab;
window.openCreateClaimModal = openCreateClaimModal;
window.closeCreateClaimModal = closeCreateClaimModal;
window.submitCreateClaimFromModal = submitCreateClaimFromModal;
window.openClaimReviewModal = openClaimReviewModal;
window.closeClaimReviewModal = closeClaimReviewModal;
window.updateClaimStatus = updateClaimStatus;
window.openReportHistoryModal = openReportHistoryModal;
window.closeReportHistoryModal = closeReportHistoryModal;
window.openStatusUpdateModal = openStatusUpdateModal;
window.viewMatchesForReport = viewMatchesForReport;
window.updateAdminMetricsAndBadges = updateAdminMetricsAndBadges;
window.toggleRegisterView = toggleRegisterView;
window.handleRegistrationSubmit = handleRegistrationSubmit;
window.triggerPhotoPick = triggerPhotoPick;
window.triggerProfilePhotoUpload = triggerProfilePhotoUpload;
window.handleProfilePhotoSelected = handleProfilePhotoSelected;
window.handleProfilePasswordChange = handleProfilePasswordChange;
window.clearWizardPhoto = clearWizardPhoto;

/* =========================================================================
   MANGA VIEWER LOGIC
   ========================================================================= */

let currentMangaPage = 1;
const totalMangaPages = 9;

function renderMangaPagination() {
  const paginationContainer = document.getElementById('manga-pagination');
  if (!paginationContainer) return;
  
  paginationContainer.innerHTML = '';
  for (let i = 1; i <= totalMangaPages; i++) {
    const dot = document.createElement('div');
    dot.className = 'manga-dot' + (i === currentMangaPage ? ' active' : '');
    dot.onclick = () => goToMangaPage(i);
    paginationContainer.appendChild(dot);
  }
}

function updateMangaView() {
  const slides = document.querySelectorAll('.manga-slide');
  if (!slides.length) return;

  slides.forEach(slide => {
    const pageNum = parseInt(slide.getAttribute('data-page'));
    slide.classList.remove('active', 'prev-slide');
    
    if (pageNum === currentMangaPage) {
      slide.classList.add('active');
    } else if (pageNum < currentMangaPage) {
      slide.classList.add('prev-slide');
    }
  });

  const prevBtn = document.getElementById('manga-prev');
  const nextBtn = document.getElementById('manga-next');
  
  if (prevBtn) prevBtn.disabled = currentMangaPage === 1;
  if (nextBtn) nextBtn.disabled = currentMangaPage === totalMangaPages;
  
  renderMangaPagination();
}

let lastMangaTurn = 0;
window.nextMangaPage = function() {
  const now = Date.now();
  if (now - lastMangaTurn < 250) {
    console.log('Debounced nextMangaPage');
    return;
  }
  lastMangaTurn = now;
  console.log('nextMangaPage called. Current is:', currentMangaPage);

  if (currentMangaPage < totalMangaPages) {
    currentMangaPage++;
    console.log('Incremented to:', currentMangaPage);
    updateMangaView();
  }
};

window.prevMangaPage = function() {
  const now = Date.now();
  if (now - lastMangaTurn < 250) return;
  lastMangaTurn = now;

  if (currentMangaPage > 1) {
    currentMangaPage--;
    updateMangaView();
  }
};

window.goToMangaPage = function(page) {
  if (page >= 1 && page <= totalMangaPages) {
    currentMangaPage = page;
    updateMangaView();
  }
};

// Touch / Swipe Support
let touchStartX = 0;
let touchEndX = 0;

function handleMangaSwipe() {
  if (touchEndX < touchStartX - 50) {
    window.nextMangaPage(); // Swipe Left -> Next
  }
  if (touchEndX > touchStartX + 50) {
    window.prevMangaPage(); // Swipe Right -> Prev
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.getElementById('manga-slides-wrapper');
  const prevBtn = document.getElementById('manga-prev');
  const nextBtn = document.getElementById('manga-next');
  // Click events are handled by inline onclick attributes in index.html to prevent double firing

  if (wrapper) {
    wrapper.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});

    wrapper.addEventListener('touchend', e => {
      touchEndX = e.changedTouches[0].screenX;
      handleMangaSwipe();
    }, {passive: true});
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    // Only navigate if we are on the landing page
    const mangaContainer = document.getElementById('manga-slides-wrapper');
    if (mangaContainer && window.getComputedStyle(mangaContainer).display !== 'none') {
      if (e.key === 'ArrowRight') window.nextMangaPage();
      if (e.key === 'ArrowLeft') window.prevMangaPage();
    }
  });

  updateMangaView();
});
