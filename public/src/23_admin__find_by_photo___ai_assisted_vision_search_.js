/* ==========================================================================
   ADMIN "FIND BY PHOTO" (AI-Assisted Vision Search)
   ========================================================================== */
let adminUploadedPhoto = '';

function initAdminPhotoSearch() {
  adminUploadedPhoto = '';
  const input = document.getElementById('admin-photo-input');
  if (input) input.value = '';
  const preview = document.getElementById('admin-photo-preview');
  if (preview) preview.style.display = 'none';
  const results = document.getElementById('admin-photo-search-results');
  if (results) results.innerHTML = '';
}

function handleAdminPhotoSelected(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    adminUploadedPhoto = evt.target.result;
    const preview = document.getElementById('admin-photo-preview');
    const img = document.getElementById('admin-photo-preview-img');
    if (img) img.src = adminUploadedPhoto;
    if (preview) preview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function runAdminPhotoSearch() {
  const category = document.getElementById('admin-photo-category')?.value || '';
  const location = document.getElementById('admin-photo-location')?.value || '';
  const resultsContainer = document.getElementById('admin-photo-search-results');
  if (!resultsContainer) return;

  const candidate = {
    id: 'admin-query',
    title: category || 'Found Property',
    category: category || 'misc',
    location: location || 'Campus',
    photo: adminUploadedPhoto,
    date: new Date().toISOString()
  };

  const matches = findMatches(candidate, 'found');

  if (matches.length === 0) {
    resultsContainer.innerHTML = `
      <div class="glass-card empty-state" style="text-align:center;padding:24px;">
        <i data-lucide="search-x" style="width:36px;height:36px;color:var(--text-muted);margin:0 auto 10px;"></i>
        <p>No high-probability matches found among active lost reports.</p>
      </div>
    `;
  } else {
    resultsContainer.innerHTML = `
      <div class="glass-card" style="padding:20px;">
        <h3 style="margin-bottom:14px;color:var(--teal-bright);display:flex;align-items:center;gap:8px;">
          <i data-lucide="sparkles"></i>
          <span>Correlated Lost Reports (${matches.length})</span>
        </h3>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${matches.map(m => {
            const lost = m.lost;
            return `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg-subtle);border-radius:8px;border:1px solid var(--border-subtle);flex-wrap:wrap;gap:8px;">
                <div style="display:flex;align-items:center;gap:12px;">
                  ${lost.photo ? `<img src="${lost.photo}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;" alt="Lost">` : `<div style="width:48px;height:48px;background:var(--bg-card);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;">📦</div>`}
                  <div>
                    <strong style="font-size:0.95rem;color:var(--text-primary);">${escapeHTML(lost.title)}</strong>
                    <div style="font-size:0.75rem;color:var(--text-muted);">📍 ${escapeHTML(lost.location)} • 📅 ${getTimeAgo(lost.date || lost.createdAt)}</div>
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:12px;">
                  <span style="font-size:1.1rem;font-weight:800;color:var(--teal-bright);">${m.score}% Match</span>
                  <button class="btn btn-sm btn-secondary" onclick="showPage('admin-page')">Inspect</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
  if (window.lucide) window.lucide.createIcons();
}
