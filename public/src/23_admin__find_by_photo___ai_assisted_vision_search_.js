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

async function runAdminPhotoSearch() {
  const category = document.getElementById('admin-photo-category')?.value || '';
  const location = document.getElementById('admin-photo-location')?.value || '';
  const resultsContainer = document.getElementById('admin-photo-search-results');
  if (!resultsContainer) return;

  if (!adminUploadedPhoto) {
    resultsContainer.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--color-error);"><p>Please upload a photo first.</p></div>';
    return;
  }

  resultsContainer.innerHTML = '<div style="padding: 24px; text-align: center;"><p>Running AI visual analysis...</p></div>';

  try {
    const activeLostReports = appState.lostReports.filter(r => r.status !== 'Returned' && r.status !== 'Claimed' && r.photo);
    
    // Call the real AI endpoint
    const response = await fetch('/api/ai?action=analyze_found', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: adminUploadedPhoto.split(',')[1],
        lostReports: activeLostReports
      })
    });
    
    if (!response.ok) throw new Error('AI processing failed');
    const data = await response.json();
    
    if (!data.success || data.aiAnalysis.status === 'failed') {
      throw new Error(data.error || data.aiAnalysis?.error || 'Unknown error');
    }

    const matches = [];
    if (data.aiAnalysis.clipMatches) {
      for (const [lostId, matchInfo] of Object.entries(data.aiAnalysis.clipMatches)) {
        if (matchInfo.points > 0) {
           const lost = appState.lostReports.find(r => r.id === lostId);
           if (lost) {
             matches.push({ lost, score: Math.round(matchInfo.similarity * 100), reason: matchInfo.reason });
           }
        }
      }
    }
    
    // Sort by score
    matches.sort((a, b) => b.score - a.score);

    if (matches.length === 0) {
      resultsContainer.innerHTML = `
        <div class="glass-card empty-state" style="text-align:center;padding:24px;">
          <i data-lucide="search-x" style="width:36px;height:36px;color:var(--text-muted);margin:0 auto 10px;"></i>
          <p>No high-probability visual matches found among active lost reports with photos.</p>
        </div>
      `;
    } else {
      resultsContainer.innerHTML = `
        <div class="glass-card" style="padding:20px;">
          <h3 style="margin-bottom:14px;color:var(--teal-bright);display:flex;align-items:center;gap:8px;">
            <i data-lucide="sparkles"></i>
            <span>Possible Matches (${matches.length})</span>
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
                      <div style="font-size:0.75rem;color:var(--teal-bright); margin-top:2px;">${m.reason || 'Visual Match'}</div>
                    </div>
                  </div>
                  <div style="display:flex;align-items:center;gap:12px;">
                    <span style="font-size:1.1rem;font-weight:800;color:var(--teal-bright);">${m.score}% Similarity</span>
                    <button class="btn btn-sm btn-secondary" onclick="showPage('admin-page')">Inspect</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }
  } catch (err) {
    resultsContainer.innerHTML = `
      <div class="glass-card empty-state" style="text-align:center;padding:24px;">
        <i data-lucide="alert-triangle" style="width:36px;height:36px;color:var(--color-error);margin:0 auto 10px;"></i>
        <p>Photo matching is temporarily unavailable.</p>
        <p style="font-size: 0.8rem; color: var(--text-muted);">${err.message}</p>
      </div>
    `;
  }
  if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
}
