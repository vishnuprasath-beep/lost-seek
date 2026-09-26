/* ==========================================================================
   FIND ITEM DIRECTORY
   ========================================================================== */
function renderFindItem() {
  handleFindItemSearch();
}

function handleFindItemSearch() {
  const container = document.getElementById('find-item-results-grid');
  if (!container) return;

  const searchInput = document.getElementById('find-item-search-input');
  const typeFilter = document.getElementById('find-filter-type');
  const categoryFilter = document.getElementById('find-filter-category');
  const locationFilter = document.getElementById('find-filter-location');
  const statusFilter = document.getElementById('find-filter-status');

  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const selType = typeFilter ? typeFilter.value : '';
  const selCategory = categoryFilter ? categoryFilter.value : '';
  const selLocation = locationFilter ? locationFilter.value : '';
  const selStatus = statusFilter ? statusFilter.value : '';

  const allItems = [
    ...appState.lostReports.map(r => ({ ...r, itemType: 'Lost' })),
    ...appState.foundReports.map(r => ({ ...r, itemType: 'Found' }))
  ];

  const filtered = allItems.filter(item => {
    if (selType && item.itemType !== selType) return false;
    if (selCategory && item.category !== selCategory) return false;
    if (selLocation && !String(item.location || '').toLowerCase().includes(selLocation.toLowerCase())) return false;
    if (selStatus && !String(item.status || '').toLowerCase().includes(selStatus.toLowerCase())) return false;

    if (query) {
      const matchTitle = String(item.title || '').toLowerCase().includes(query);
      const matchDesc = String(item.description || '').toLowerCase().includes(query);
      const matchLoc = String(item.location || '').toLowerCase().includes(query);
      const matchBrand = String(item.brand || '').toLowerCase().includes(query);
      if (!matchTitle && !matchDesc && !matchLoc && !matchBrand) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px;">
        <i data-lucide="search-x" style="width: 48px; height: 48px; color: var(--text-muted); margin: 0 auto 12px;"></i>
        <h3 style="color: var(--text-primary); margin-bottom: 6px;">No items match your criteria</h3>
        <p style="color: var(--text-muted);">Try adjusting your search keywords or resetting filters.</p>
      </div>
    `;
    if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = filtered.map(item => {
    const cat = CATEGORY_MAP[item.category] || { icon: '📦', label: 'Item' };
    const isLost = item.itemType === 'Lost';
    const isFound = item.itemType === 'Found';

    return `
      <div class="glass-card" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between; border-radius: var(--radius-lg);">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 8px;">
            <span class="badge ${isLost ? 'badge-urgent' : 'badge-verified'}">${item.itemType}</span>
            ${getStatusBadgeHTML(item.status)}
          </div>

          ${item.photo ? `
            <div style="width: 100%; height: 140px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 12px; background: var(--bg-subtle); position: relative;">
              <img src="${item.photo}" alt="${escapeHTML(item.title)}" style="width: 100%; height: 100%; object-fit: cover;">
              ${item.imageSharedForMatch ? `
                <div class="match-verification-overlay" style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(15, 23, 42, 0.88); color: var(--teal-bright); font-size: 0.72rem; padding: 4px 8px; font-weight: 600; display: flex; align-items: center; gap: 4px; border-top: 1px solid rgba(20, 184, 166, 0.4);">
                  <span>🔍 Possible match — image shared for verification</span>
                </div>
              ` : ''}
            </div>
          ` : `
            <div style="width: 100%; height: 90px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 2.2rem; margin-bottom: 12px; background: var(--bg-subtle);">
              ${cat.icon}
            </div>
          `}

          <h3 style="font-size: 1.05rem; margin-bottom: 6px; color: var(--text-primary); font-weight: 600;">
            ${escapeHTML(item.title)}
          </h3>

          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${escapeHTML(item.description || 'No additional details.')}
          </p>

          <div style="font-size: 0.78rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px;">
            <div>📍 <strong>${escapeHTML(item.location || 'Campus')}</strong></div>
            <div>⏱️ ${getTimeAgo(item.createdAt || item.date)}</div>
          </div>
        </div>

        <div style="display: flex; gap: 8px; margin-top: auto;">
          ${isFound ? `
            <button class="btn btn-sm btn-primary" style="flex: 1;" onclick="openClaimModal('', '${item.id}', '${escapeHTML(item.title)}', '${item.category}')">
              Claim Item
            </button>
          ` : `
            <button class="btn btn-sm btn-accent-teal" style="flex: 1;" onclick="showPage('report-found-page')">
              I Found This
            </button>
          `}
          <button class="btn btn-sm btn-secondary" onclick="openQrModal('${item.id}')">
            QR Tag
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
}

function resetFindItemFilters() {
  const searchInput = document.getElementById('find-item-search-input');
  const typeFilter = document.getElementById('find-filter-type');
  const categoryFilter = document.getElementById('find-filter-category');
  const locationFilter = document.getElementById('find-filter-location');
  const statusFilter = document.getElementById('find-filter-status');

  if (searchInput) searchInput.value = '';
  if (typeFilter) typeFilter.value = '';
  if (categoryFilter) categoryFilter.value = '';
  if (locationFilter) locationFilter.value = '';
  if (statusFilter) statusFilter.value = '';

  handleFindItemSearch();
}
