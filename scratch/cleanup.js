const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\Users\\prakash c\\Desktop\\smart campus-pro';

// 1. Remove "Reset Demo Data" from HTML files
const htmlFiles = [
  'public/index.html',
  'public/story.html',
  'public/200.html',
  'index.html',
  'story.html',
  '200.html'
];

htmlFiles.forEach(relPath => {
  const p = path.join(rootDir, relPath);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    // Remove Reset Demo Data li element completely
    content = content.replace(/<li[^>]*>\s*<a[^>]*resetHackathonDemoData[^>]*>.*?<\/a>\s*<\/li>/g, '');
    
    // Also replace AI Match Precision with Match Results
    content = content.replace(/AI Match Precision/g, 'Match Results');
    
    fs.writeFileSync(p, content);
  }
});

// 2. Modify Analytics JS
const analyticsJs = path.join(rootDir, 'public/src/16_analytics_dashboard___analytics_page__with_chart_js.js');
if (fs.existsSync(analyticsJs)) {
  let content = fs.readFileSync(analyticsJs, 'utf8');
  
  // Replace confidence
  content = content.replace(
    /const avgConfidence = matches\.length > 0\s*\n\s*\? Math\.round\(matches\.reduce\(\(acc, m\) => acc \+ m\.score, 0\) \/ matches\.length\)\s*\n\s*: 87;/,
    `const avgConfidence = matches.length > 0
    ? Math.round(matches.reduce((acc, m) => acc + m.score, 0) / matches.length)
    : "No data";`
  );
  
  content = content.replace(/if \(confEl\) confEl\.textContent = `\$\{avgConfidence\}%`;/, `if (confEl) confEl.textContent = avgConfidence === "No data" ? avgConfidence : \`\${avgConfidence}%\`;`);
  
  // Replace time
  content = content.replace(/if \(timeEl\) timeEl\.textContent = '2\.8 hrs';/, `if (timeEl) timeEl.textContent = 'No data';`);
  
  // Chart timeline
  content = content.replace(
    /data: \[2, 3, 1, 4, 3, 5, 2\],/,
    `data: days.map(() => 0), // Real calculation logic should be implemented based on actual data`
  );
  content = content.replace(
    /data: \[1, 2, 2, 3, 4, 3, 1\],/,
    `data: days.map(() => 0), // Real calculation logic should be implemented based on actual data`
  );

  // Recovery rates fallback
  content = content.replace(
    /if \(itemsInCat\.length === 0\) return 65; \/\/ realistic fallback/,
    `if (itemsInCat.length === 0) return 0;`
  );
  content = content.replace(
    /return Math\.round\(\(returnedInCat \/ itemsInCat\.length\) \* 100\) \|\| 50;/,
    `return Math.round((returnedInCat / itemsInCat.length) * 100) || 0;`
  );
  
  fs.writeFileSync(analyticsJs, content);
}

// 3. Remove demo helpers
const demoHelpersJs = path.join(rootDir, 'public/src/19_demo_helpers___controls.js');
if (fs.existsSync(demoHelpersJs)) {
  let content = fs.readFileSync(demoHelpersJs, 'utf8');
  content = content.replace(/function resetHackathonDemoData\(\) \{[\s\S]*?\n\}/, '');
  fs.writeFileSync(demoHelpersJs, content);
}

// 4. "Ask Admin to Help" from contact privacy
const contactPrivacyJs = path.join(rootDir, 'public/src/29_contact_privacy_display_system.js');
if (fs.existsSync(contactPrivacyJs)) {
  let content = fs.readFileSync(contactPrivacyJs, 'utf8');
  content = content.replace(/<button type="button" class="contact-admin-help-btn" onclick="openAdminContactHelpModal\('\$\{report\.id\}'\)">[\s\S]*?<\/button>/g, `\${appState.user?.role?.toLowerCase() === 'admin' ? '' : \`<button type="button" class="contact-admin-help-btn" onclick="openAdminContactHelpModal('\${report.id}')">
          <i data-lucide="shield"></i>
          <span>Ask Admin to Help</span>
        </button>\`}`);
  fs.writeFileSync(contactPrivacyJs, content);
}

// 5. Connect Find by Photo to real AI pipeline
const findByPhotoJs = path.join(rootDir, 'public/src/23_admin__find_by_photo___ai_assisted_vision_search_.js');
if (fs.existsSync(findByPhotoJs)) {
  let content = fs.readFileSync(findByPhotoJs, 'utf8');
  // Need to completely rewrite runAdminPhotoSearch
  const newFunc = \`async function runAdminPhotoSearch() {
  const category = document.getElementById('admin-photo-category')?.value || '';
  const location = document.getElementById('admin-photo-location')?.value || '';
  const resultsContainer = document.getElementById('admin-photo-search-results');
  if (!resultsContainer) return;
  
  if (!adminUploadedPhoto) {
    alert("Please upload a photo first.");
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
      resultsContainer.innerHTML = \`
        <div class="glass-card empty-state" style="text-align:center;padding:24px;">
          <i data-lucide="search-x" style="width:36px;height:36px;color:var(--text-muted);margin:0 auto 10px;"></i>
          <p>No high-probability visual matches found among active lost reports with photos.</p>
        </div>
      \`;
    } else {
      resultsContainer.innerHTML = \`
        <div class="glass-card" style="padding:20px;">
          <h3 style="margin-bottom:14px;color:var(--teal-bright);display:flex;align-items:center;gap:8px;">
            <i data-lucide="sparkles"></i>
            <span>Possible Matches (\${matches.length})</span>
          </h3>
          <div style="display:flex;flex-direction:column;gap:12px;">
            \${matches.map(m => {
              const lost = m.lost;
              return \`
                <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg-subtle);border-radius:8px;border:1px solid var(--border-subtle);flex-wrap:wrap;gap:8px;">
                  <div style="display:flex;align-items:center;gap:12px;">
                    \${lost.photo ? \`<img src="\${lost.photo}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;" alt="Lost">\` : \`<div style="width:48px;height:48px;background:var(--bg-card);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;">📦</div>\`}
                    <div>
                      <strong style="font-size:0.95rem;color:var(--text-primary);">\${escapeHTML(lost.title)}</strong>
                      <div style="font-size:0.75rem;color:var(--text-muted);">📍 \${escapeHTML(lost.location)} • 📅 \${getTimeAgo(lost.date || lost.createdAt)}</div>
                      <div style="font-size:0.75rem;color:var(--teal-bright); margin-top:2px;">\${m.reason || 'Visual Match'}</div>
                    </div>
                  </div>
                  <div style="display:flex;align-items:center;gap:12px;">
                    <span style="font-size:1.1rem;font-weight:800;color:var(--teal-bright);">\${m.score}% Similarity</span>
                    <button class="btn btn-sm btn-secondary" onclick="showPage('admin-page')">Inspect</button>
                  </div>
                </div>
              \`;
            }).join('')}
          </div>
        </div>
      \`;
    }
  } catch (err) {
    resultsContainer.innerHTML = \`
      <div class="glass-card empty-state" style="text-align:center;padding:24px;">
        <i data-lucide="alert-triangle" style="width:36px;height:36px;color:var(--color-error);margin:0 auto 10px;"></i>
        <p>Photo matching is temporarily unavailable.</p>
        <p style="font-size: 0.8rem; color: var(--text-muted);">\${err.message}</p>
      </div>
    \`;
  }
  if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
}\`;
  
  content = content.replace(/function runAdminPhotoSearch\(\) \{[\s\S]*?\}\n/, newFunc + '\n');
  fs.writeFileSync(findByPhotoJs, content);
}

console.log("Cleanup script completed!");
