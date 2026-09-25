/* ==========================================================================
   GLOBAL SEARCH & UTILITIES
   ========================================================================== */
function handleGlobalSearch(query) {
  const q = query.trim().toLowerCase();
  if (!q) {
    renderDashboardActivity();
    renderMyReports(currentMyReportsTab);
    return;
  }

  // Filter in My Reports view
  const matched = [
    ...appState.lostReports.map(i => ({ ...i, itemType: 'Lost' })),
    ...appState.foundReports.map(i => ({ ...i, itemType: 'Found' }))
  ].filter(i => 
    i.title.toLowerCase().includes(q) ||
    i.location.toLowerCase().includes(q) ||
    (i.description && i.description.toLowerCase().includes(q))
  );

  const container = document.getElementById('my-reports-container');
  if (container) {
    if (matched.length === 0) {
      container.innerHTML = `
        <div class="glass-card empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🔍</div>
          <p>No results found for "${escapeHTML(query)}".</p>
        </div>
      `;
    } else {
      container.innerHTML = matched.map(item => {
        const cat = CATEGORY_MAP[item.category] || { label: 'Item', icon: '📦' };
        return `
          <div class="glass-card report-item-card">
            <div class="report-item-top">
              <div class="item-category-avatar">${cat.icon}</div>
              <span class="badge ${getStatusBadgeClass(item.status)}">${item.status}</span>
            </div>
            <div class="report-item-body">
              <h4>${escapeHTML(item.title)}</h4>
              <p>${escapeHTML(item.description || '')}</p>
            </div>
            <div class="report-details-list">
              <span>📍 ${escapeHTML(item.location)}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

