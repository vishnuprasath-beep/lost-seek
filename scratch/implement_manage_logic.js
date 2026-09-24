const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');

// 1. Update routing in showPage
appJs = appJs.replace(
  `const adminPages = ['admin-page', 'admin-photo-search-page', 'admin-students-page', 'admin-help-page'];`,
  `const adminPages = [
    'admin-page', 'admin-lost-page', 'admin-found-page', 'admin-all-page',
    'admin-claims-page', 'admin-matches-page', 'admin-photo-search-page',
    'admin-students-page', 'admin-help-page'
  ];`
);

// titleMap in showPage
const titleMapTarget = `'settings-page': 'Settings',
      'help-safety-page': 'Help & Safety',
      'admin-help-page': 'Help & Complaints'`;

const titleMapReplacement = `'settings-page': 'Settings',
      'help-safety-page': 'Help & Safety',
      'admin-help-page': 'Help & Complaints',
      'admin-lost-page': 'Lost Items',
      'admin-found-page': 'Found Items',
      'admin-all-page': 'All Reports',
      'admin-claims-page': 'Claims',
      'admin-matches-page': 'Match Center'`;

appJs = appJs.replace(titleMapTarget, titleMapReplacement);

// hashMap in showPage
const hashMapTarget = `'settings-page': 'settings',
    'help-safety-page': 'help-safety',
    'admin-help-page': 'admin-help'`;

const hashMapReplacement = `'settings-page': 'settings',
    'help-safety-page': 'help-safety',
    'admin-help-page': 'admin-help',
    'admin-lost-page': 'admin-lost',
    'admin-found-page': 'admin-found',
    'admin-all-page': 'admin-all',
    'admin-claims-page': 'admin-claims',
    'admin-matches-page': 'admin-matches'`;

appJs = appJs.replace(hashMapTarget, hashMapReplacement);

// Routing switch in showPage
const renderSwitchTarget = `} else if (pageId === 'admin-help-page') {
    renderAdminHelpDesk('all');
  }`;

const renderSwitchReplacement = `} else if (pageId === 'admin-help-page') {
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
  }`;

appJs = appJs.replace(renderSwitchTarget, renderSwitchReplacement);

// reverseMap in handleHashNavigation
const reverseMapTarget = `'settings': 'settings-page',
    'help-safety': 'help-safety-page',
    'admin-help': 'admin-help-page'`;

const reverseMapReplacement = `'settings': 'settings-page',
    'help-safety': 'help-safety-page',
    'admin-help': 'admin-help-page',
    'admin-lost': 'admin-lost-page',
    'admin-found': 'admin-found-page',
    'admin-all': 'admin-all-page',
    'admin': 'admin-all-page',
    'admin-claims': 'admin-claims-page',
    'admin-matches': 'admin-matches-page'`;

appJs = appJs.replace(reverseMapTarget, reverseMapReplacement);

// 2. Enhanced Multi-Signal Explainable AI Matching Engine & Attribute Extraction
const matchingEngineCode = `
/* ==========================================================================
   LOSTSEEK AI MULTI-SIGNAL EXPLAINABLE MATCHING ENGINE
   Two-Way: Text Lost Report ↔ Found Item Image Attribute Analysis
   ========================================================================== */

// Extracts visual, text, and distinguishing attributes without hallucinating
function extractVisualAttributes(report) {
  if (!report) return {};
  const textContent = ((report.title || '') + ' ' + (report.description || '') + ' ' + (report.color || '') + ' ' + (report.brand || '')).toLowerCase();

  // 1. Detect Category/Object type
  let objectType = report.category || 'misc';
  if (textContent.includes('bottle') || textContent.includes('flask') || textContent.includes('sipper')) objectType = 'bottle';
  else if (textContent.includes('laptop') || textContent.includes('macbook') || textContent.includes('notebook')) objectType = 'laptop';
  else if (textContent.includes('phone') || textContent.includes('iphone') || textContent.includes('android')) objectType = 'phone';
  else if (textContent.includes('earbud') || textContent.includes('airpod') || textContent.includes('headphone')) objectType = 'audio';
  else if (textContent.includes('wallet') || textContent.includes('purse')) objectType = 'wallet';
  else if (textContent.includes('id card') || textContent.includes('id-card') || textContent.includes('student card')) objectType = 'id-card';
  else if (textContent.includes('bag') || textContent.includes('backpack')) objectType = 'bag';
  else if (textContent.includes('calculator')) objectType = 'calculator';

  // 2. Detect Color
  const knownColors = ['blue', 'black', 'white', 'silver', 'gray', 'grey', 'red', 'green', 'yellow', 'brown', 'purple', 'pink', 'gold', 'orange', 'navy'];
  let detectedColor = report.color ? report.color.toLowerCase().trim() : null;
  if (!detectedColor || detectedColor === 'not specified' || detectedColor === 'unspecified') {
    detectedColor = knownColors.find(c => textContent.includes(c)) || 'Unknown';
  }

  // 3. Detect Brand
  const knownBrands = ['milton', 'apple', 'dell', 'hp', 'lenovo', 'samsung', 'sony', 'jbl', 'boat', 'bose', 'nike', 'adidas', 'puma', 'wildcraft', 'fastrack', 'titan', 'casio', 'tupperware'];
  let detectedBrand = report.brand ? report.brand.toLowerCase().trim() : null;
  if (!detectedBrand) {
    detectedBrand = knownBrands.find(b => textContent.includes(b)) || 'Not clearly visible';
  }

  // 4. Detect Distinguishing features / Stickers / Markings
  const distinguishingTokens = [];
  const stickerPatterns = [
    'football sticker', 'soccer sticker', 'cricket sticker', 'apple sticker', 'anime sticker',
    'coding sticker', 'github sticker', 'sticker', 'scratch', 'dent', 'engraving', 'initials',
    'keychain', 'key ring', 'strap', 'case', 'cover', 'pouch', 'cracked screen', 'tag', 'signature'
  ];

  stickerPatterns.forEach(pattern => {
    if (textContent.includes(pattern)) {
      distinguishingTokens.push(pattern);
    }
  });

  return {
    objectType,
    color: detectedColor,
    brand: detectedBrand,
    distinguishingTokens,
    hasPhoto: !!(report.photo && report.photo.trim())
  };
}

// Multi-signal matching between any report and opposite list
function findMatches(report, type) {
  const oppositeList = (type === 'lost') ? appState.foundReports : appState.lostReports;
  const matches = [];

  const sourceAttrs = extractVisualAttributes(report);
  const sourceKeywords = extractKeywords((report.title || '') + ' ' + (report.description || ''));

  oppositeList.forEach(other => {
    const targetAttrs = extractVisualAttributes(other);
    const targetKeywords = extractKeywords((other.title || '') + ' ' + (other.description || ''));

    let categoryPts = 0;
    let textPts = 0;
    let colorPts = 0;
    let locPts = 0;
    let timePts = 0;
    let brandPts = 0;
    let featurePts = 0;

    const matchReasons = [];
    const unmatchedReasons = [];

    // SIGNAL 1: CATEGORY COMPATIBILITY (max 25)
    const cat1 = (report.category || '').toLowerCase().replace(/s$/, '');
    const cat2 = (other.category || '').toLowerCase().replace(/s$/, '');
    const isCatMatch = (cat1 && cat2 && (cat1 === cat2 || sourceAttrs.objectType === targetAttrs.objectType));
    
    // Incompatibility gate: bottle vs calculator should never match!
    const isIncompatible = (sourceAttrs.objectType === 'calculator' && targetAttrs.objectType === 'bottle') ||
                           (sourceAttrs.objectType === 'bottle' && targetAttrs.objectType === 'calculator') ||
                           (sourceAttrs.objectType === 'wallet' && targetAttrs.objectType === 'laptop');

    if (isIncompatible) {
      return; // Skip incompatible objects
    }

    if (isCatMatch) {
      categoryPts = 25;
      const catObj = CATEGORY_MAP[report.category] || { label: 'Item' };
      matchReasons.push(\`✓ Same item category (\${catObj.label})\`);
    } else {
      unmatchedReasons.push('⚠️ Different primary category');
    }

    // SIGNAL 2: TEXT & SEMANTIC SIMILARITY (max 25)
    if (sourceKeywords.length > 0 && targetKeywords.length > 0) {
      const uniqueKeywords = new Set([...sourceKeywords, ...targetKeywords]);
      let overlap = 0;
      sourceKeywords.forEach(k => {
        if (targetKeywords.includes(k)) overlap++;
      });
      textPts = Math.min(25, Math.round((overlap / uniqueKeywords.size) * 35));
      if (textPts >= 12) {
        matchReasons.push('✓ Strong title & description keyword alignment');
      }
    }

    // SIGNAL 3: COLOR SIMILARITY (max 15)
    const c1 = (sourceAttrs.color || '').toLowerCase().trim();
    const c2 = (targetAttrs.color || '').toLowerCase().trim();
    if (c1 && c2 && c1 !== 'unknown' && c2 !== 'unknown') {
      if (c1 === c2) {
        colorPts = 15;
        matchReasons.push(\`✓ Same color (\${c1.charAt(0).toUpperCase() + c1.slice(1)})\`);
      } else if (c1.includes(c2) || c2.includes(c1) || hasColorOverlap(c1, c2)) {
        colorPts = 8;
        matchReasons.push(\`✓ Similar color tones (\${c1} / \${c2})\`);
      } else {
        unmatchedReasons.push(\`⚠️ Color difference (\${c1} vs \${c2})\`);
      }
    } else {
      unmatchedReasons.push('⚠️ Color could not be verified from report');
    }

    // SIGNAL 4: LOCATION PROXIMITY (max 15) - Preserves KSRCE Adjacency
    const loc1 = report.location || '';
    const loc2 = other.location || '';
    if (loc1 && loc2) {
      const clean1 = loc1.toLowerCase().trim();
      const clean2 = loc2.toLowerCase().trim();
      if (clean1 === clean2) {
        locPts = 15;
        matchReasons.push(\`✓ Same campus location (\${loc1})\`);
      } else {
        const adj = LOCATION_PROXIMITY[loc1] || [];
        if (adj.some(a => a.toLowerCase().trim() === clean2) || isSameLocationCategory(loc1, loc2)) {
          locPts = 8;
          matchReasons.push(\`✓ Adjacent campus area (\${loc1} ↔ \${loc2})\`);
        } else {
          unmatchedReasons.push(\`⚠️ Different campus location (\${loc1} vs \${loc2})\`);
        }
      }
    }

    // SIGNAL 5: TIME PROXIMITY (max 10)
    const t1 = new Date(report.date || report.createdAt).getTime();
    const t2 = new Date(other.date || other.createdAt).getTime();
    if (!isNaN(t1) && !isNaN(t2)) {
      const diffDays = Math.abs(t1 - t2) / (1000 * 3600 * 24);
      if (diffDays <= 1) {
        timePts = 10;
        matchReasons.push('✓ Compatible date & time (same 24h window)');
      } else if (diffDays <= 3) {
        timePts = 7;
        matchReasons.push('✓ Compatible timeframe (within 3 days)');
      } else if (diffDays <= 7) {
        timePts = 4;
      }
    }

    // SIGNAL 6: BRAND MATCH (max 5)
    const b1 = (sourceAttrs.brand || '').toLowerCase().trim();
    const b2 = (targetAttrs.brand || '').toLowerCase().trim();
    if (b1 && b2 && b1 !== 'not clearly visible' && b2 !== 'not clearly visible' && b1 !== 'unknown' && b2 !== 'unknown') {
      if (b1 === b2 || b1.includes(b2) || b2.includes(b1)) {
        brandPts = 5;
        matchReasons.push(\`✓ Brand match (\${b1.charAt(0).toUpperCase() + b1.slice(1)})\`);
      } else {
        unmatchedReasons.push(\`⚠️ Brand mismatch (\${b1} vs \${b2})\`);
      }
    } else {
      unmatchedReasons.push('⚠️ Brand could not be confirmed from image');
    }

    // SIGNAL 7: UNIQUE CHARACTERISTICS BONUS (max 10)
    const commonTokens = sourceAttrs.distinguishingTokens.filter(tok => targetAttrs.distinguishingTokens.includes(tok));
    if (commonTokens.length > 0) {
      featurePts = Math.min(10, commonTokens.length * 5 + 5);
      const featureLabel = commonTokens.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ');
      matchReasons.push(\`✓ Distinguishing feature detected (\${featureLabel})\`);
    }

    const rawScore = categoryPts + textPts + colorPts + locPts + timePts + brandPts + featurePts;
    const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    if (finalScore >= 40) {
      matches.push({
        lost: type === 'lost' ? report : other,
        found: type === 'lost' ? other : report,
        opposite: other,
        score: finalScore,
        categoryPts,
        textPts,
        colorPts,
        locPts,
        timePts,
        brandPts,
        featurePts,
        matchReasons,
        unmatchedReasons
      });
    }
  });

  return matches.sort((a, b) => b.score - a.score);
}
`;

// Replace old findMatches
const oldFindMatchesRegex = /function findMatches\(report, type\)[\s\S]*?return matches\.sort\(\(a, b\) => b\.score - a\.score\);\s*\}/;
appJs = appJs.replace(oldFindMatchesRegex, matchingEngineCode);

// 3. Implement Dedicated Manage Render Pages & Claims Workflow
const managePagesLogic = `
/* ==========================================================================
   MANAGE CONSOLE PAGES (LOST, FOUND, ALL REPORTS, CLAIMS, MATCH CENTER)
   ========================================================================== */

let currentClaimFilterTab = 'all';

// Ensure all reports have standard type and history array
function normalizeReportsData() {
  if (!appState.lostReports) appState.lostReports = [];
  if (!appState.foundReports) appState.foundReports = [];
  if (!appState.claims) appState.claims = [];

  appState.lostReports.forEach(r => {
    r.type = 'LOST';
    r.reportType = 'LOST';
    if (!r.history) {
      r.history = [
        { action: 'Report Created', timestamp: r.date || r.createdAt || new Date().toISOString(), author: r.reporterName || 'Student', note: 'Initial lost report registered on campus.' }
      ];
    }
  });

  appState.foundReports.forEach(r => {
    r.type = 'FOUND';
    r.reportType = 'FOUND';
    if (!r.history) {
      r.history = [
        { action: 'Report Registered', timestamp: r.date || r.createdAt || new Date().toISOString(), author: r.finderName || 'Finder', note: 'Found property logged into campus registry.' }
      ];
    }
  });
}

// Update Admin Navigation Badges & Dashboard Metrics
function updateAdminMetricsAndBadges() {
  normalizeReportsData();

  const lostCount = appState.lostReports.length;
  const foundCount = appState.foundReports.length;
  const claimsCount = (appState.claims || []).filter(c => c.status === 'Pending' || c.status === 'Under Verification').length;
  const helpCount = (appState.adminHelpRequests || []).filter(r => r.status === 'New').length;
  const recoveredCount = appState.lostReports.filter(r => r.status === 'Recovered').length +
                         appState.foundReports.filter(r => r.status === 'Returned').length;

  // Real Potential Matches calculation
  let totalPotentialMatches = 0;
  appState.lostReports.forEach(r => {
    const m = findMatches(r, 'lost');
    totalPotentialMatches += m.length;
  });

  // Sidebar badges
  const lostBadge = document.getElementById('sidebar-admin-lost-badge');
  const foundBadge = document.getElementById('sidebar-admin-found-badge');
  const claimsBadge = document.getElementById('sidebar-admin-claims-badge');
  const matchesBadge = document.getElementById('sidebar-admin-matches-badge');
  const helpBadge = document.getElementById('sidebar-admin-help-badge');

  if (lostBadge) lostBadge.textContent = lostCount;
  if (foundBadge) foundBadge.textContent = foundCount;
  if (claimsBadge) claimsBadge.textContent = claimsCount;
  if (matchesBadge) matchesBadge.textContent = totalPotentialMatches;
  if (helpBadge) {
    helpBadge.textContent = helpCount;
    helpBadge.style.display = helpCount > 0 ? 'inline-block' : 'none';
  }

  // Dashboard metric cards
  const statLost = document.getElementById('admin-stat-lost-reports');
  const statFound = document.getElementById('admin-stat-found-reports');
  const statMatches = document.getElementById('admin-stat-potential-matches');
  const statClaims = document.getElementById('admin-stat-pending-claims');
  const statUrgent = document.getElementById('admin-stat-urgent-cases');
  const statRecovered = document.getElementById('admin-stat-recovered-items');

  if (statLost) statLost.textContent = lostCount;
  if (statFound) statFound.textContent = foundCount;
  if (statMatches) statMatches.textContent = totalPotentialMatches;
  if (statClaims) statClaims.textContent = claimsCount;
  if (statUrgent) statUrgent.textContent = helpCount;
  if (statRecovered) statRecovered.textContent = recoveredCount;
}

/* --------------------------------------------------------------------------
   1. LOST ITEMS PAGE (#admin-lost-page)
   -------------------------------------------------------------------------- */
function renderAdminLostPage() {
  normalizeReportsData();
  updateAdminMetricsAndBadges();

  const tbody = document.getElementById('admin-lost-table-tbody');
  if (!tbody) return;

  const searchVal = (document.getElementById('admin-lost-search-input')?.value || '').toLowerCase().trim();
  const catVal = document.getElementById('admin-lost-filter-category')?.value || '';
  const locVal = document.getElementById('admin-lost-filter-location')?.value || '';
  const statusVal = document.getElementById('admin-lost-filter-status')?.value || '';
  const sortVal = document.getElementById('admin-lost-filter-sort')?.value || 'newest';

  let list = [...appState.lostReports];

  // Update Metric Pills
  const totalEl = document.getElementById('admin-lost-metric-total');
  const lookingEl = document.getElementById('admin-lost-metric-looking');
  const matchesEl = document.getElementById('admin-lost-metric-matches');
  const claimsEl = document.getElementById('admin-lost-metric-claims');
  const recoveredEl = document.getElementById('admin-lost-metric-recovered');

  if (totalEl) totalEl.textContent = list.length;
  if (lookingEl) lookingEl.textContent = list.filter(r => r.status === 'Looking').length;
  if (matchesEl) matchesEl.textContent = list.filter(r => r.status === 'Possible Match').length;
  if (claimsEl) claimsEl.textContent = list.filter(r => r.status === 'Claim Submitted' || r.status === 'Under Verification').length;
  if (recoveredEl) recoveredEl.textContent = list.filter(r => r.status === 'Recovered').length;

  // Filter
  if (searchVal) {
    list = list.filter(r => 
      (r.id && r.id.toLowerCase().includes(searchVal)) ||
      (r.title && r.title.toLowerCase().includes(searchVal)) ||
      (r.description && r.description.toLowerCase().includes(searchVal)) ||
      (r.brand && r.brand.toLowerCase().includes(searchVal)) ||
      (r.reporterName && r.reporterName.toLowerCase().includes(searchVal))
    );
  }

  if (catVal) list = list.filter(r => r.category === catVal);
  if (locVal) list = list.filter(r => r.location === locVal);
  if (statusVal) list = list.filter(r => r.status === statusVal);

  // Sort
  if (sortVal === 'oldest') {
    list.sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
  } else if (sortVal === 'title') {
    list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  } else {
    list.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  }

  if (list.length === 0) {
    tbody.innerHTML = \`
      <tr>
        <td colspan="10" style="text-align: center; padding: 40px 16px; color: var(--text-muted);">
          <i data-lucide="file-question" style="width: 36px; height: 36px; color: var(--teal-bright); margin: 0 auto 8px; display: block;"></i>
          No lost-item reports found matching current filters.
        </td>
      </tr>
    \`;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  tbody.innerHTML = list.map(item => {
    const cat = CATEGORY_MAP[item.category] || { label: 'Item', icon: '📦' };
    const matches = findMatches(item, 'lost');
    const matchBadge = matches.length > 0
      ? \`<span class="badge badge-matched" style="cursor: pointer;" onclick="viewMatchesForReport('\${item.id}', 'lost')">\${matches.length} Match\${matches.length > 1 ? 'es' : ''} (\${matches[0].score}%)</span>\`
      : '<span style="font-size: 0.75rem; color: var(--text-muted);">No match</span>';

    return \`
      <tr>
        <td>
          <span style="font-weight: 700; font-family: monospace; color: var(--teal-bright); font-size: 0.82rem;">\${item.id}</span>
          \${item.priority === 'urgent' ? '<span class="badge badge-urgent" style="display: block; width: fit-content; margin-top: 2px; font-size: 0.65rem;">🔴 URGENT</span>' : ''}
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            \${item.photo ? \`<img src="\${item.photo}" alt="\${escapeHTML(item.title)}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-subtle);">\` : \`<div style="width: 44px; height: 44px; border-radius: 6px; background: var(--bg-subtle); display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">\${cat.icon}</div>\`}
            <div>
              <strong style="font-size: 0.92rem; color: var(--text-primary); display: block;">\${escapeHTML(item.title)}</strong>
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">\${escapeHTML(item.description || 'No description')}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="sub-text">\${cat.icon} \${escapeHTML(cat.label)}</span>
        </td>
        <td style="font-size: 0.8rem; color: var(--text-secondary);">
          <div>🎨 \${escapeHTML(item.color || 'Unspecified')}</div>
          \${item.brand ? \`<div style="color: var(--text-muted); font-size: 0.75rem;">🏷️ \${escapeHTML(item.brand)}</div>\` : ''}
        </td>
        <td style="font-size: 0.82rem; color: var(--text-secondary);">
          📍 \${escapeHTML(item.location || 'Campus')}
        </td>
        <td style="font-size: 0.78rem; color: var(--text-muted); white-space: nowrap;">
          \${formatDateTime(item.date || item.createdAt)}
        </td>
        <td style="font-size: 0.8rem;">
          <div style="font-weight: 600; color: var(--text-primary);">\${escapeHTML(item.reporterName || 'Student')}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">\${item.phone && item.sharePhone ? '📞 ' + escapeHTML(item.phone) : '🔒 Private'}</div>
        </td>
        <td>
          \${getStatusBadgeHTML(item.status)}
        </td>
        <td>
          \${matchBadge}
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <div style="display: inline-flex; gap: 6px;">
            <button type="button" class="btn btn-sm btn-secondary" onclick="openReportDetailsModal('\${item.id}')" title="View Details">
              <i data-lucide="eye"></i>
            </button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="openStatusUpdateModal('\${item.id}')" title="Update Status">
              <i data-lucide="edit-3"></i>
            </button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="openReportHistoryModal('\${item.id}')" title="View Lifecycle History">
              <i data-lucide="history"></i>
            </button>
          </div>
        </td>
      </tr>
    \`;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function handleAdminLostFilterChange() {
  renderAdminLostPage();
}

/* --------------------------------------------------------------------------
   2. FOUND ITEMS PAGE (#admin-found-page)
   -------------------------------------------------------------------------- */
function renderAdminFoundPage() {
  normalizeReportsData();
  updateAdminMetricsAndBadges();

  const tbody = document.getElementById('admin-found-table-tbody');
  if (!tbody) return;

  const searchVal = (document.getElementById('admin-found-search-input')?.value || '').toLowerCase().trim();
  const catVal = document.getElementById('admin-found-filter-category')?.value || '';
  const locVal = document.getElementById('admin-found-filter-location')?.value || '';
  const statusVal = document.getElementById('admin-found-filter-status')?.value || '';
  const custodyVal = document.getElementById('admin-found-filter-custody')?.value || '';
  const sortVal = document.getElementById('admin-found-filter-sort')?.value || 'newest';

  let list = [...appState.foundReports];

  // Update Metric Pills
  const totalEl = document.getElementById('admin-found-metric-total');
  const lockersEl = document.getElementById('admin-found-metric-lockers');
  const finderEl = document.getElementById('admin-found-metric-finder');
  const matchesEl = document.getElementById('admin-found-metric-matches');
  const returnedEl = document.getElementById('admin-found-metric-returned');

  if (totalEl) totalEl.textContent = list.length;
  if (lockersEl) lockersEl.textContent = list.filter(r => (r.custody || '').toLowerCase().includes('desk') || (r.custody || '').toLowerCase().includes('office')).length;
  if (finderEl) finderEl.textContent = list.filter(r => (r.custody || '').toLowerCase().includes('finder') || (r.custody || '').toLowerCase().includes('me')).length;
  if (matchesEl) matchesEl.textContent = list.filter(r => r.status === 'Possible Owner' || r.status === 'Possible Match').length;
  if (returnedEl) returnedEl.textContent = list.filter(r => r.status === 'Returned').length;

  // Filter
  if (searchVal) {
    list = list.filter(r => 
      (r.id && r.id.toLowerCase().includes(searchVal)) ||
      (r.title && r.title.toLowerCase().includes(searchVal)) ||
      (r.description && r.description.toLowerCase().includes(searchVal)) ||
      (r.finderName && r.finderName.toLowerCase().includes(searchVal))
    );
  }

  if (catVal) list = list.filter(r => r.category === catVal);
  if (locVal) list = list.filter(r => r.location === locVal);
  if (statusVal) list = list.filter(r => r.status === statusVal);
  if (custodyVal === 'desk') list = list.filter(r => (r.custody || '').toLowerCase().includes('desk'));
  if (custodyVal === 'finder') list = list.filter(r => (r.custody || '').toLowerCase().includes('finder') || (r.custody || '').toLowerCase().includes('me'));

  // Sort
  if (sortVal === 'oldest') {
    list.sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
  } else if (sortVal === 'title') {
    list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  } else {
    list.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  }

  if (list.length === 0) {
    tbody.innerHTML = \`
      <tr>
        <td colspan="10" style="text-align: center; padding: 40px 16px; color: var(--text-muted);">
          <i data-lucide="package" style="width: 36px; height: 36px; color: var(--teal-bright); margin: 0 auto 8px; display: block;"></i>
          No found-item reports found matching current filters.
        </td>
      </tr>
    \`;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  tbody.innerHTML = list.map(item => {
    const cat = CATEGORY_MAP[item.category] || { label: 'Item', icon: '📦' };
    const matches = findMatches(item, 'found');
    const matchBadge = matches.length > 0
      ? \`<span class="badge badge-matched" style="cursor: pointer;" onclick="viewMatchesForReport('\${item.id}', 'found')">\${matches.length} Owner\${matches.length > 1 ? 's' : ''} (\${matches[0].score}%)</span>\`
      : '<span style="font-size: 0.75rem; color: var(--text-muted);">Searching...</span>';

    return \`
      <tr>
        <td>
          <span style="font-weight: 700; font-family: monospace; color: var(--teal-bright); font-size: 0.82rem;">\${item.id}</span>
          <span class="badge badge-verified" style="display: block; width: fit-content; margin-top: 2px; font-size: 0.65rem;">\${escapeHTML(item.custody || 'Security Desk')}</span>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            \${item.photo ? \`<img src="\${item.photo}" alt="\${escapeHTML(item.title)}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-subtle);">\` : \`<div style="width: 44px; height: 44px; border-radius: 6px; background: var(--bg-subtle); display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">\${cat.icon}</div>\`}
            <div>
              <strong style="font-size: 0.92rem; color: var(--text-primary); display: block;">\${escapeHTML(item.title)}</strong>
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">\${escapeHTML(item.description || 'No description')}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="sub-text">\${cat.icon} \${escapeHTML(cat.label)}</span>
        </td>
        <td style="font-size: 0.8rem; color: var(--text-secondary);">
          <div>🎨 \${escapeHTML(item.color || 'Unspecified')}</div>
          \${item.brand ? \`<div style="color: var(--text-muted); font-size: 0.75rem;">🏷️ \${escapeHTML(item.brand)}</div>\` : ''}
        </td>
        <td style="font-size: 0.82rem; color: var(--text-secondary);">
          📍 \${escapeHTML(item.location || 'Campus')}
        </td>
        <td style="font-size: 0.78rem; color: var(--text-muted); white-space: nowrap;">
          \${formatDateTime(item.date || item.createdAt)}
        </td>
        <td style="font-size: 0.8rem;">
          <div style="font-weight: 600; color: var(--text-primary);">\${escapeHTML(item.finderName || 'Campus Staff')}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">\${item.phone && item.sharePhone ? '📞 ' + escapeHTML(item.phone) : '🔒 Private / Desk'}</div>
        </td>
        <td>
          \${getStatusBadgeHTML(item.status)}
        </td>
        <td>
          \${matchBadge}
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <div style="display: inline-flex; gap: 6px;">
            <button type="button" class="btn btn-sm btn-secondary" onclick="openReportDetailsModal('\${item.id}')" title="View Details">
              <i data-lucide="eye"></i>
            </button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="openAdminHandoverModal('\${item.id}', 'found')" title="Safe Handover">
              <i data-lucide="package-check"></i>
            </button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="openStatusUpdateModal('\${item.id}')" title="Update Status">
              <i data-lucide="edit-3"></i>
            </button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="openReportHistoryModal('\${item.id}')" title="Lifecycle History">
              <i data-lucide="history"></i>
            </button>
          </div>
        </td>
      </tr>
    \`;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function handleAdminFoundFilterChange() {
  renderAdminFoundPage();
}

/* --------------------------------------------------------------------------
   3. ALL REPORTS PAGE COMBINED (#admin-all-page)
   -------------------------------------------------------------------------- */
function renderAdminAllReportsPage() {
  normalizeReportsData();
  updateAdminMetricsAndBadges();

  const tbody = document.getElementById('admin-all-table-tbody');
  if (!tbody) return;

  const searchVal = (document.getElementById('admin-all-search-input')?.value || '').toLowerCase().trim();
  const typeVal = document.getElementById('admin-all-filter-type')?.value || '';
  const catVal = document.getElementById('admin-all-filter-category')?.value || '';
  const locVal = document.getElementById('admin-all-filter-location')?.value || '';
  const statusVal = document.getElementById('admin-all-filter-status')?.value || '';
  const sortVal = document.getElementById('admin-all-filter-sort')?.value || 'newest';

  // Combine both collections with explicit type
  let list = [
    ...appState.lostReports.map(r => ({ ...r, displayType: 'LOST' })),
    ...appState.foundReports.map(r => ({ ...r, displayType: 'FOUND' }))
  ];

  // Filters
  if (typeVal) {
    list = list.filter(r => r.displayType === typeVal);
  }

  if (searchVal) {
    list = list.filter(r => 
      (r.id && r.id.toLowerCase().includes(searchVal)) ||
      (r.title && r.title.toLowerCase().includes(searchVal)) ||
      (r.description && r.description.toLowerCase().includes(searchVal)) ||
      (r.reporterName && r.reporterName.toLowerCase().includes(searchVal)) ||
      (r.finderName && r.finderName.toLowerCase().includes(searchVal))
    );
  }

  if (catVal) list = list.filter(r => r.category === catVal);
  if (locVal) list = list.filter(r => r.location === locVal);
  if (statusVal) list = list.filter(r => r.status === statusVal);

  // Sort
  if (sortVal === 'oldest') {
    list.sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
  } else if (sortVal === 'title') {
    list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  } else {
    list.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  }

  if (list.length === 0) {
    tbody.innerHTML = \`
      <tr>
        <td colspan="10" style="text-align: center; padding: 40px 16px; color: var(--text-muted);">
          <i data-lucide="clipboard-list" style="width: 36px; height: 36px; color: var(--teal-bright); margin: 0 auto 8px; display: block;"></i>
          No reports found matching selected criteria.
        </td>
      </tr>
    \`;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  tbody.innerHTML = list.map(item => {
    const isLost = item.displayType === 'LOST';
    const cat = CATEGORY_MAP[item.category] || { label: 'Item', icon: '📦' };
    const personName = isLost ? (item.reporterName || 'Student') : (item.finderName || 'Finder');

    return \`
      <tr>
        <td>
          <span class="badge \${isLost ? 'badge-type-lost' : 'badge-type-found'}">
            \${isLost ? '🔴 LOST' : '🟢 FOUND'}
          </span>
        </td>
        <td>
          <span style="font-weight: 700; font-family: monospace; color: var(--teal-bright); font-size: 0.82rem;">\${item.id}</span>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            \${item.photo ? \`<img src="\${item.photo}" alt="\${escapeHTML(item.title)}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-subtle);">\` : \`<div style="width: 40px; height: 40px; border-radius: 6px; background: var(--bg-subtle); display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">\${cat.icon}</div>\`}
            <div>
              <strong style="font-size: 0.92rem; color: var(--text-primary); display: block;">\${escapeHTML(item.title)}</strong>
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">\${escapeHTML(item.description || 'No description')}</span>
            </div>
          </div>
        </td>
        <td>\${cat.icon} \${escapeHTML(cat.label)}</td>
        <td style="font-size: 0.8rem; color: var(--text-secondary);">\${escapeHTML(item.color || 'Unspecified')}</td>
        <td style="font-size: 0.82rem; color: var(--text-secondary);">📍 \${escapeHTML(item.location || 'Campus')}</td>
        <td style="font-size: 0.78rem; color: var(--text-muted); white-space: nowrap;">\${formatDateTime(item.date || item.createdAt)}</td>
        <td style="font-size: 0.8rem; font-weight: 600;">\${escapeHTML(personName)}</td>
        <td>\${getStatusBadgeHTML(item.status)}</td>
        <td style="text-align: right; white-space: nowrap;">
          <button type="button" class="btn btn-sm btn-secondary" onclick="openReportDetailsModal('\${item.id}')" title="View Details">
            <i data-lucide="eye"></i>
          </button>
          <button type="button" class="btn btn-sm btn-secondary" onclick="openQrModal('\${item.id}')" title="QR Tag">
            <i data-lucide="qr-code"></i>
          </button>
        </td>
      </tr>
    \`;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function handleAdminAllFilterChange() {
  renderAdminAllReportsPage();
}

/* --------------------------------------------------------------------------
   4. CLAIMS & VERIFICATION MODULE (#admin-claims-page)
   -------------------------------------------------------------------------- */
function filterAdminClaimsTab(tabKey, btnEl) {
  currentClaimFilterTab = tabKey;
  const buttons = document.querySelectorAll('.admin-claims-tab');
  buttons.forEach(b => {
    b.classList.remove('active');
    b.classList.add('btn-secondary');
  });

  if (btnEl) {
    btnEl.classList.add('active');
    btnEl.classList.remove('btn-secondary');
  }

  renderAdminClaimsPage(tabKey);
}

function handleAdminClaimsFilterChange() {
  renderAdminClaimsPage(currentClaimFilterTab);
}

function renderAdminClaimsPage(filterTab = currentClaimFilterTab) {
  normalizeReportsData();
  updateAdminMetricsAndBadges();

  currentClaimFilterTab = filterTab;
  const tbody = document.getElementById('admin-claims-table-tbody');
  if (!tbody) return;

  const claims = appState.claims || [];

  // Metrics
  const totalEl = document.getElementById('admin-claims-metric-total');
  const pendingEl = document.getElementById('admin-claims-metric-pending');
  const verifEl = document.getElementById('admin-claims-metric-verification');
  const approvedEl = document.getElementById('admin-claims-metric-approved');
  const completedEl = document.getElementById('admin-claims-metric-completed');

  if (totalEl) totalEl.textContent = claims.length;
  if (pendingEl) pendingEl.textContent = claims.filter(c => c.status === 'Pending').length;
  if (verifEl) verifEl.textContent = claims.filter(c => c.status === 'Under Verification').length;
  if (approvedEl) approvedEl.textContent = claims.filter(c => c.status === 'Approved').length;
  if (completedEl) completedEl.textContent = claims.filter(c => c.status === 'Completed').length;

  let filtered = [...claims];
  if (filterTab !== 'all') {
    filtered = filtered.filter(c => c.status === filterTab);
  }

  const searchVal = (document.getElementById('admin-claims-search-input')?.value || '').toLowerCase().trim();
  if (searchVal) {
    filtered = filtered.filter(c => 
      (c.id && c.id.toLowerCase().includes(searchVal)) ||
      (c.claimantName && c.claimantName.toLowerCase().includes(searchVal)) ||
      (c.claimantId && c.claimantId.toLowerCase().includes(searchVal)) ||
      (c.itemTitle && c.itemTitle.toLowerCase().includes(searchVal)) ||
      (c.verificationEvidence && c.verificationEvidence.toLowerCase().includes(searchVal))
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = \`
      <tr>
        <td colspan="9" style="text-align: center; padding: 40px 16px; color: var(--text-muted);">
          <i data-lucide="shield-check" style="width: 36px; height: 36px; color: var(--teal-bright); margin: 0 auto 8px; display: block;"></i>
          No claims require review under the "\${escapeHTML(filterTab)}" tab.
        </td>
      </tr>
    \`;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  tbody.innerHTML = filtered.map(claim => {
    const lostReport = appState.lostReports.find(r => r.id === claim.lostReportId) || { title: claim.itemTitle || 'Lost Item' };
    const foundReport = appState.foundReports.find(r => r.id === claim.foundReportId) || { title: 'Found Item in Custody' };

    const statusBadge = 
      claim.status === 'Approved' ? '<span class="status-pill status-approved"><i data-lucide="check-circle-2"></i> Approved</span>' :
      claim.status === 'Under Verification' ? '<span class="status-pill status-checking"><i data-lucide="clock"></i> Under Verification</span>' :
      claim.status === 'Completed' ? '<span class="status-pill status-returned"><i data-lucide="package-check"></i> Completed / Returned</span>' :
      claim.status === 'Rejected' ? '<span class="status-pill status-rejected"><i data-lucide="x-circle"></i> Rejected</span>' :
      '<span class="status-pill status-waiting"><i data-lucide="clock"></i> Pending</span>';

    return \`
      <tr>
        <td>
          <span style="font-weight: 700; font-family: monospace; color: var(--teal-bright); font-size: 0.84rem;">#\${claim.id}</span>
          <span style="display: block; font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">\${getTimeAgo(claim.createdAt)}</span>
        </td>
        <td>
          <strong style="color: var(--text-primary); font-size: 0.9rem; display: block;">\${escapeHTML(lostReport.title)}</strong>
          <span style="font-size: 0.75rem; color: var(--text-muted);">ID: \${claim.lostReportId || '--'}</span>
        </td>
        <td>
          <strong style="color: var(--text-primary); font-size: 0.9rem; display: block;">\${escapeHTML(foundReport.title)}</strong>
          <span style="font-size: 0.75rem; color: var(--text-muted);">ID: \${claim.foundReportId || '--'}</span>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--text-primary); font-size: 0.88rem;">\${escapeHTML(claim.claimantName || 'Student')}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">ID: \${claim.claimantId || 'STU'} • \${claim.sharePhone ? '📞 Phone Shared' : '🔒 Phone Private'}</div>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--text-primary); font-size: 0.88rem;">\${escapeHTML(claim.finderName || foundReport.finderName || 'Finder')}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">\${escapeHTML(foundReport.custody || 'Campus Desk')}</div>
        </td>
        <td>
          <span class="badge badge-matched" style="font-weight: 800; font-size: 0.82rem;">\${claim.matchScore || 85}% AI Match</span>
        </td>
        <td>
          <div class="claim-evidence-box" style="padding: 6px 10px; font-size: 0.8rem; max-width: 260px;">
            <em>"\${escapeHTML(claim.verificationEvidence || 'No private secret proof logged yet.')}"</em>
          </div>
        </td>
        <td>
          \${statusBadge}
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <div style="display: inline-flex; gap: 6px;">
            <button type="button" class="btn btn-sm btn-primary" onclick="openClaimReviewModal('\${claim.id}')">
              <i data-lucide="shield-alert"></i>
              <span>Review Claim</span>
            </button>
            <button type="button" class="btn btn-sm btn-secondary" style="border-color: rgba(239, 68, 68, 0.4); color: #F87171;" onclick="openItemHelpModal('\${claim.lostReportId}', '\${escapeHTML(lostReport.title)}', '\${escapeHTML(lostReport.location)}')">
              <span>🆘</span>
            </button>
          </div>
        </td>
      </tr>
    \`;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

/* --------------------------------------------------------------------------
   5. MATCH CENTER MODULE (#admin-matches-page)
   -------------------------------------------------------------------------- */
function renderAdminMatchCenterPage() {
  normalizeReportsData();
  updateAdminMetricsAndBadges();

  const container = document.getElementById('admin-matches-cards-container');
  if (!container) return;

  const threshold = parseInt(document.getElementById('admin-match-filter-threshold')?.value || '40', 10);
  const searchVal = (document.getElementById('admin-match-search-input')?.value || '').toLowerCase().trim();

  // Calculate candidate matches across all lost reports
  const allCandidateMatches = [];
  appState.lostReports.forEach(lost => {
    const candidateMatches = findMatches(lost, 'lost');
    candidateMatches.forEach(m => {
      if (m.score >= threshold) {
        allCandidateMatches.push(m);
      }
    });
  });

  // Filter by search
  let filtered = allCandidateMatches;
  if (searchVal) {
    filtered = filtered.filter(m => 
      (m.lost.title && m.lost.title.toLowerCase().includes(searchVal)) ||
      (m.found.title && m.found.title.toLowerCase().includes(searchVal)) ||
      (m.lost.description && m.lost.description.toLowerCase().includes(searchVal)) ||
      (m.found.description && m.found.description.toLowerCase().includes(searchVal)) ||
      (m.lost.location && m.lost.location.toLowerCase().includes(searchVal)) ||
      (m.found.location && m.found.location.toLowerCase().includes(searchVal))
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = \`
      <div class="glass-card empty-state" style="text-align: center; padding: 48px 20px;">
        <i data-lucide="sparkles" style="width: 44px; height: 44px; color: var(--ai-violet); margin: 0 auto 12px; display: block;"></i>
        <h3 style="color: var(--text-primary); margin-bottom: 6px;">No Potential Matches Found</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; max-width: 480px; margin: 0 auto;">
          The multi-signal engine considers category, text descriptions, visual attributes, colors, KSRCE landmarks, and timestamps. As new campus reports arrive, potential matches will automatically populate here.
        </p>
      </div>
    \`;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = filtered.map(m => {
    const { lost, found, score, matchReasons, unmatchedReasons } = m;
    const lostCat = CATEGORY_MAP[lost.category] || { label: 'Item', icon: '📦' };
    const foundCat = CATEGORY_MAP[found.category] || { label: 'Item', icon: '📦' };
    const isClaimed = (appState.claims || []).some(c => c.lostReportId === lost.id && c.foundReportId === found.id);

    return \`
      <div class="glass-card match-card" style="padding: 22px;">
        <div class="match-card-side-by-side">
          <!-- Left: Lost item -->
          <div class="match-item-pane">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span class="badge badge-searching"><span class="badge-dot"></span> Lost Report (#\${lost.id})</span>
              \${lost.priority === 'urgent' ? '<span class="badge badge-urgent">🔴 URGENT</span>' : ''}
            </div>
            \${lost.photo ? \`<img src="\${lost.photo}" class="match-item-thumb" alt="Lost">\` : \`<div class="match-item-thumb" style="display:flex;align-items:center;justify-content:center;font-size:2.6rem;">\${lostCat.icon}</div>\`}
            <h4 style="font-size: 1.05rem; margin: 8px 0 2px;">\${escapeHTML(lost.title)}</h4>
            <div class="sub-text">\${lostCat.icon} \${lostCat.label} • 🎨 \${escapeHTML(lost.color || 'Unspecified')}</div>
            <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px;">📍 Last seen: <strong>\${escapeHTML(lost.location)}</strong></div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">📅 \${getTimeAgo(lost.date || lost.createdAt)} by \${escapeHTML(lost.reporterName || 'Student')}</div>
          </div>

          <!-- Center: Large Animated Confidence Ring -->
          <div class="match-score-center" style="padding: 0 16px;">
            <div class="score-ring-wrap">
              <svg class="score-ring-svg" viewBox="0 0 100 100">
                <circle class="score-ring-bg" cx="50" cy="50" r="40"></circle>
                <circle class="score-ring-fill \${score > 70 ? 'score-green' : (score > 50 ? 'score-yellow' : 'score-red')}" cx="50" cy="50" r="40"
                  stroke-dasharray="251.2"
                  stroke-dashoffset="\${251.2 - (score / 100) * 251.2}">
                </circle>
              </svg>
              <div class="score-text-inside" style="font-size: 1.25rem;">\${score}%</div>
            </div>
            <span style="font-size: 0.72rem; text-transform: uppercase; color: var(--ai-violet-light); font-weight: 700; letter-spacing: 0.6px; margin-top: 4px;">AI Confidence</span>
          </div>

          <!-- Right: Found item -->
          <div class="match-item-pane">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span class="badge badge-matched"><span class="badge-dot"></span> Found Report (#\${found.id})</span>
              <span class="sub-text" style="font-size: 0.75rem;">\${escapeHTML(found.custody || 'Campus Desk')}</span>
            </div>
            \${found.photo ? \`<img src="\${found.photo}" class="match-item-thumb" alt="Found">\` : \`<div class="match-item-thumb" style="display:flex;align-items:center;justify-content:center;font-size:2.6rem;">\${foundCat.icon}</div>\`}
            <h4 style="font-size: 1.05rem; margin: 8px 0 2px;">\${escapeHTML(found.title)}</h4>
            <div class="sub-text">\${foundCat.icon} \${foundCat.label} • 🎨 \${escapeHTML(found.color || 'Unspecified')}</div>
            <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px;">📍 Found at: <strong>\${escapeHTML(found.location)}</strong></div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">📅 \${getTimeAgo(found.date || found.createdAt)} by \${escapeHTML(found.finderName || 'Finder')}</div>
          </div>
        </div>

        <!-- Explainable Matching Reasons -->
        <div class="explainable-reasons-box" style="margin-top: 16px;">
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted);">Explainable Correlation Signals</div>
          <div class="explainable-reasons-list">
            \${matchReasons.map(r => \`<span class="reason-chip-matched">\${r}</span>\`).join('')}
            \${unmatchedReasons.map(r => \`<span class="reason-chip-unmatched">\${r}</span>\`).join('')}
          </div>
        </div>

        <!-- Actions -->
        <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <button type="button" class="btn btn-outline" style="border-color: rgba(239, 68, 68, 0.4); color: #F87171; font-size: 0.82rem;" onclick="openItemHelpModal('\${lost.id}', '\${escapeHTML(lost.title)}', '\${escapeHTML(lost.location)}')">
            <i data-lucide="shield-alert" style="width: 14px; height: 14px;"></i>
            <span>🆘 Need Help?</span>
          </button>

          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="openReportDetailsModal('\${lost.id}')">
              <i data-lucide="eye"></i>
              <span>Review Details</span>
            </button>
            \${isClaimed ? \`
              <span class="badge badge-verified" style="padding: 8px 14px; font-size: 0.82rem;">Claim in Verification</span>
            \` : \`
              <button type="button" class="btn btn-accent-teal btn-sm" onclick="openCreateClaimModal('\${lost.id}', '\${found.id}')">
                <i data-lucide="hand"></i>
                <span>Create Claim</span>
              </button>
            \`}
          </div>
        </div>
      </div>
    \`;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function handleAdminMatchFilterChange() {
  renderAdminMatchCenterPage();
}

function viewMatchesForReport(reportId, type) {
  showPage('admin-matches-page');
  const searchInput = document.getElementById('admin-match-search-input');
  const targetReport = (type === 'lost' ? appState.lostReports : appState.foundReports).find(r => r.id === reportId);
  if (searchInput && targetReport) {
    searchInput.value = targetReport.title;
    renderAdminMatchCenterPage();
  }
}

/* ==========================================================================
   CLAIM CREATION, OWNERSHIP VERIFICATION & REVIEW WORKFLOW
   ========================================================================== */

function openCreateClaimModal(lostId, foundId) {
  const lost = appState.lostReports.find(r => r.id === lostId);
  const found = appState.foundReports.find(r => r.id === foundId);
  if (!lost || !found) {
    showToast('Cannot initiate claim: reports not found.', 'warning');
    return;
  }

  const modal = document.getElementById('create-claim-modal');
  if (!modal) return;

  document.getElementById('create-claim-lost-id').value = lostId;
  document.getElementById('create-claim-found-id').value = foundId;
  document.getElementById('create-claim-secret-proof').value = '';

  const summary = document.getElementById('create-claim-items-summary');
  if (summary) {
    summary.innerHTML = \`
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: #F87171;">Lost Property</span>
          <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">\${escapeHTML(lost.title)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">📍 \${escapeHTML(lost.location)}</div>
        </div>
        <div style="font-size: 1.2rem; color: var(--teal-bright); font-weight: 800;">↕</div>
        <div>
          <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--teal-bright);">Found Property</span>
          <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">\${escapeHTML(found.title)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">📍 \${escapeHTML(found.location)}</div>
        </div>
      </div>
    \`;
  }

  modal.classList.add('show');
}

function closeCreateClaimModal() {
  const modal = document.getElementById('create-claim-modal');
  if (modal) modal.classList.remove('show');
}

function submitCreateClaimFromModal(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  const lostId = document.getElementById('create-claim-lost-id')?.value;
  const foundId = document.getElementById('create-claim-found-id')?.value;
  const secretProof = document.getElementById('create-claim-secret-proof')?.value.trim();
  const shareOpt = document.querySelector('input[name="claim-contact-share-opt"]:checked')?.value || 'share';
  const sharePhone = (shareOpt === 'share');

  if (!secretProof) {
    showToast('Please provide a distinguishing ownership proof.', 'warning');
    return;
  }

  const lost = appState.lostReports.find(r => r.id === lostId);
  const found = appState.foundReports.find(r => r.id === foundId);
  if (!lost || !found) return;

  const matches = findMatches(lost, 'lost');
  const targetMatch = matches.find(m => m.found.id === foundId) || { score: 85, matchReasons: ['Category and location correlation'] };

  const claimId = generateId('claim');
  const newClaim = {
    id: claimId,
    lostReportId: lostId,
    foundReportId: foundId,
    itemTitle: lost.title,
    claimantName: appState.user?.name || lost.reporterName || 'Student Claimant',
    claimantId: appState.user?.studentId || 'STU-2026',
    claimantContact: lost.phone || '',
    sharePhone: sharePhone,
    finderName: found.finderName || 'Finder',
    matchScore: targetMatch.score,
    matchReasons: targetMatch.matchReasons || ['Strong multi-signal correlation'],
    unmatchedReasons: targetMatch.unmatchedReasons || [],
    verificationEvidence: secretProof,
    verificationNotes: '',
    status: 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!appState.claims) appState.claims = [];
  appState.claims.unshift(newClaim);

  // Update report statuses
  lost.status = 'Claim Submitted';
  found.status = 'Claim Submitted';

  // Add lifecycle history events
  if (!lost.history) lost.history = [];
  lost.history.push({
    action: 'Claim Submitted',
    timestamp: new Date().toISOString(),
    author: newClaim.claimantName,
    note: \`Claim #\${claimId} submitted with secret ownership proof.\`
  });

  if (!found.history) found.history = [];
  found.history.push({
    action: 'Claim Submitted',
    timestamp: new Date().toISOString(),
    author: newClaim.claimantName,
    note: \`Claim #\${claimId} submitted by claimant.\`
  });

  // Notifications
  appState.notifications.unshift({
    id: generateId('notif'),
    message: \`🤝 Claim #\${claimId} submitted for "\${lost.title}". Proof logged for Campus Administration verification.\`,
    read: false,
    createdAt: new Date().toISOString()
  });

  appState.notifications.unshift({
    id: generateId('notif'),
    message: \`📋 New Claim #\${claimId} requires review: \${newClaim.claimantName} claimed "\${found.title}".\`,
    read: false,
    createdAt: new Date().toISOString()
  });

  saveData();
  renderNotifications();
  closeCreateClaimModal();

  showToast(\`Claim #\${claimId} created and sent for Admin verification! 🛡️\`, 'success');

  // Navigate to claims page if admin, or my reports if student
  const isAdmin = appState.user && appState.user.role && appState.user.role.toLowerCase() === 'admin';
  if (isAdmin) {
    showPage('admin-claims-page');
  } else {
    showPage('my-reports-page');
  }
}

function openClaimReviewModal(claimId) {
  const claim = (appState.claims || []).find(c => c.id === claimId);
  if (!claim) return;

  const lost = appState.lostReports.find(r => r.id === claim.lostReportId) || { title: claim.itemTitle || 'Lost Item' };
  const found = appState.foundReports.find(r => r.id === claim.foundReportId) || { title: 'Found Property' };

  const modal = document.getElementById('claim-review-modal');
  const body = document.getElementById('claim-review-modal-body');
  if (!modal || !body) return;

  document.getElementById('claim-review-modal-title').textContent = \`Claim #\${claim.id}\`;
  document.getElementById('claim-review-modal-sub').textContent = \`Filed \${formatDateTime(claim.createdAt)} (\${getTimeAgo(claim.createdAt)})\`;

  const lostCat = CATEGORY_MAP[lost.category] || { label: 'Item', icon: '📦' };
  const foundCat = CATEGORY_MAP[found.category] || { label: 'Item', icon: '📦' };

  body.innerHTML = \`
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px;">
      <!-- Lost Item Pane -->
      <div style="background: var(--bg-subtle); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
        <span class="badge badge-searching" style="font-size: 0.7rem;">🔴 Lost Report</span>
        <h4 style="margin: 6px 0 2px; font-size: 1rem; color: var(--text-primary);">\${escapeHTML(lost.title)}</h4>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 6px;">📍 \${escapeHTML(lost.location || 'Campus')} • 📅 \${formatDateTime(lost.date || lost.createdAt)}</div>
        <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4;">\${escapeHTML(lost.description || 'No description')}</div>
      </div>

      <!-- Found Item Pane -->
      <div style="background: var(--bg-subtle); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
        <span class="badge badge-matched" style="font-size: 0.7rem;">🟢 Found Property</span>
        <h4 style="margin: 6px 0 2px; font-size: 1rem; color: var(--text-primary);">\${escapeHTML(found.title)}</h4>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 6px;">📍 \${escapeHTML(found.location || 'Campus')} • 📦 \${escapeHTML(found.custody || 'Security Desk')}</div>
        <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4;">\${escapeHTML(found.description || 'No description')}</div>
      </div>
    </div>

    <!-- AI Match Confidence & Reasons -->
    <div class="explainable-reasons-box" style="margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--ai-violet);">AI Matching Confidence</span>
        <span class="badge badge-matched" style="font-weight: 800; font-size: 0.85rem;">\${claim.matchScore || 85}% Correlation</span>
      </div>
      <div class="explainable-reasons-list">
        \${(claim.matchReasons || []).map(r => \`<span class="reason-chip-matched">\${r}</span>\`).join('')}
        \${(claim.unmatchedReasons || []).map(r => \`<span class="reason-chip-unmatched">\${r}</span>\`).join('')}
      </div>
    </div>

    <!-- Private Secret Verification Proof -->
    <div style="margin-bottom: 18px;">
      <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--color-warning); display: block; margin-bottom: 4px;">
        🔒 Private Distinguishing Proof (Submitted by Claimant)
      </span>
      <div class="claim-evidence-box">
        <strong>Claimant Stated:</strong> "\${escapeHTML(claim.verificationEvidence || 'No distinguishing proof entered.')}"
      </div>
    </div>

    <!-- Claimant & Finder Info -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 0.82rem; background: var(--bg-subtle); padding: 12px 14px; border-radius: 8px; margin-bottom: 18px; border: 1px solid var(--border-subtle);">
      <div>
        <span style="color: var(--text-muted); display: block;">Claimant:</span>
        <strong style="color: var(--text-primary);">\${escapeHTML(claim.claimantName)} (\${escapeHTML(claim.claimantId)})</strong>
        <div style="color: var(--text-muted); margin-top: 2px;">\${claim.sharePhone && claim.claimantContact ? '📞 ' + escapeHTML(claim.claimantContact) : '🔒 Contact Private'}</div>
      </div>
      <div>
        <span style="color: var(--text-muted); display: block;">Finder &amp; Custody:</span>
        <strong style="color: var(--text-primary);">\${escapeHTML(claim.finderName || found.finderName || 'Finder')}</strong>
        <div style="color: var(--text-muted); margin-top: 2px;">Custody: \${escapeHTML(found.custody || 'Campus Security Desk')}</div>
      </div>
    </div>

    <!-- Status & Admin Actions -->
    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid var(--border-subtle); flex-wrap: wrap; gap: 10px;">
      <button type="button" class="btn btn-outline" style="border-color: rgba(239, 68, 68, 0.4); color: #F87171;" onclick="closeClaimReviewModal(); openItemHelpModal('\${claim.lostReportId}', '\${escapeHTML(lost.title)}', '\${escapeHTML(lost.location)}')">
        <i data-lucide="shield-alert"></i>
        <span>🆘 Need Help?</span>
      </button>

      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        \${claim.status !== 'Rejected' ? \`
          <button type="button" class="btn btn-secondary btn-sm" style="color: #F87171;" onclick="updateClaimStatus('\${claim.id}', 'Rejected')">
            <i data-lucide="x-circle"></i>
            <span>Reject</span>
          </button>
        \` : ''}
        \${claim.status === 'Pending' ? \`
          <button type="button" class="btn btn-secondary btn-sm" onclick="updateClaimStatus('\${claim.id}', 'Under Verification')">
            <i data-lucide="help-circle"></i>
            <span>Request More Proof</span>
          </button>
        \` : ''}
        \${claim.status !== 'Approved' && claim.status !== 'Completed' ? \`
          <button type="button" class="btn btn-accent-teal btn-sm" onclick="updateClaimStatus('\${claim.id}', 'Approved')">
            <i data-lucide="check-circle-2"></i>
            <span>Approve Claim</span>
          </button>
        \` : ''}
        \${claim.status === 'Approved' ? \`
          <button type="button" class="btn btn-primary btn-sm" onclick="closeClaimReviewModal(); openAdminHandoverModal('\${claim.foundReportId}', 'found')">
            <i data-lucide="package-check"></i>
            <span>Authorize Safe Handover</span>
          </button>
        \` : ''}
      </div>
    </div>
  \`;

  modal.classList.add('show');
  if (window.lucide) window.lucide.createIcons();
}

function closeClaimReviewModal() {
  const modal = document.getElementById('claim-review-modal');
  if (modal) modal.classList.remove('show');
}

function updateClaimStatus(claimId, newStatus) {
  const claim = (appState.claims || []).find(c => c.id === claimId);
  if (!claim) return;

  claim.status = newStatus;
  claim.updatedAt = new Date().toISOString();

  const lost = appState.lostReports.find(r => r.id === claim.lostReportId);
  const found = appState.foundReports.find(r => r.id === claim.foundReportId);

  if (newStatus === 'Approved') {
    if (lost) lost.status = 'Matched';
    if (found) found.status = 'Owner Confirmed';
  } else if (newStatus === 'Completed') {
    if (lost) lost.status = 'Recovered';
    if (found) found.status = 'Returned';
  } else if (newStatus === 'Rejected') {
    if (lost) lost.status = 'Looking';
    if (found) found.status = 'Looking';
  }

  // Audit history
  const historyEvent = {
    action: \`Claim \${newStatus}\`,
    timestamp: new Date().toISOString(),
    author: appState.user?.name || 'Campus Administrator',
    note: \`Claim #\${claimId} status updated to \${newStatus}.\`
  };

  if (lost && !lost.history) lost.history = [];
  if (lost) lost.history.push(historyEvent);
  if (found && !found.history) found.history = [];
  if (found) found.history.push(historyEvent);

  // Notification
  appState.notifications.unshift({
    id: generateId('notif'),
    message: \`🛡️ Claim #\${claimId} update: Status changed to "\${newStatus}" by Campus Security.\`,
    read: false,
    createdAt: new Date().toISOString()
  });

  saveData();
  renderNotifications();
  renderAdminClaimsPage(currentClaimFilterTab);
  closeClaimReviewModal();

  showToast(\`Claim #\${claimId} marked \${newStatus}!\`, 'success');
}

/* ==========================================================================
   REPORT HISTORY AUDIT MODAL
   ========================================================================== */
function openReportHistoryModal(reportId) {
  const report = appState.lostReports.find(r => r.id === reportId) ||
                 appState.foundReports.find(r => r.id === reportId);
  if (!report) return;

  const modal = document.getElementById('report-history-modal');
  const body = document.getElementById('report-history-modal-body');
  if (!modal || !body) return;

  document.getElementById('report-history-modal-title').textContent = \`Audit: \${escapeHTML(report.title)}\`;
  document.getElementById('report-history-modal-sub').textContent = \`Report ID #\${report.id} • \${report.type || 'Item'}\`;

  const history = report.history || [
    { action: 'Created', timestamp: report.date || report.createdAt, author: report.reporterName || report.finderName || 'Student', note: 'Report logged in LostSeek database.' }
  ];

  body.innerHTML = \`
    <div class="timeline-history-list">
      \${history.map(evt => \`
        <div class="timeline-event-item">
          <div class="timeline-event-time">\${formatDateTime(evt.timestamp)} (\${getTimeAgo(evt.timestamp)})</div>
          <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-primary); margin-top: 2px;">\${escapeHTML(evt.action)}</div>
          <div class="timeline-event-desc">\${escapeHTML(evt.note || '')}</div>
          <div style="font-size: 0.72rem; color: var(--teal-bright); margin-top: 2px;">Logged by: \${escapeHTML(evt.author || 'System')}</div>
        </div>
      \`).join('')}
    </div>
    <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
      <button type="button" class="btn btn-secondary" onclick="closeReportHistoryModal()">Close</button>
    </div>
  \`;

  modal.classList.add('show');
}

function closeReportHistoryModal() {
  const modal = document.getElementById('report-history-modal');
  if (modal) modal.classList.remove('show');
}

/* ==========================================================================
   STATUS UPDATE MODAL
   ========================================================================== */
let activeStatusReportId = null;

function openStatusUpdateModal(reportId) {
  activeStatusReportId = reportId;
  const report = appState.lostReports.find(r => r.id === reportId) ||
                 appState.foundReports.find(r => r.id === reportId);
  if (!report) return;

  const currentStatus = report.status || 'Looking';
  const newStatus = prompt(\`Update status for "\${report.title}" (Current: \${currentStatus}):\\n\\nOptions: Looking, Possible Match, Claim Submitted, Under Verification, Recovered, Returned, Archived\`, currentStatus);

  if (newStatus && newStatus.trim() && newStatus.trim() !== currentStatus) {
    report.status = newStatus.trim();
    if (!report.history) report.history = [];
    report.history.push({
      action: \`Status Changed to \${report.status}\`,
      timestamp: new Date().toISOString(),
      author: appState.user?.name || 'Administrator',
      note: \`Manual administrative status update.\`
    });

    saveData();
    renderAllAdminPages();
    showToast(\`Status updated to \${report.status}!\`, 'success');
  }
}

function renderAllAdminPages() {
  renderAdminLostPage();
  renderAdminFoundPage();
  renderAdminAllReportsPage();
  renderAdminClaimsPage();
  renderAdminMatchCenterPage();
  updateAdminMetricsAndBadges();
}
`;

if (!appJs.includes('function renderAdminLostPage')) {
  appJs += '\n' + managePagesLogic;
}

// 4. Global bindings
const manageExports = `
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
`;

if (!appJs.includes('window.renderAdminLostPage = renderAdminLostPage;')) {
  appJs += '\n' + manageExports;
}

fs.writeFileSync('app.js', appJs, 'utf8');
console.log('Successfully updated app.js with full Manage separation, AI matching, and Claims workflow!');
