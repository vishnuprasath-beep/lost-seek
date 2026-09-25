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
    let yoloPts = 0;
    let clipPts = 0;

    const matchReasons = [];
    const unmatchedReasons = [];
    const aiSignals = { status: 'not_requested' };

    // Identify which is lost and which is found
    const lostItem = type === 'lost' ? report : other;
    const foundItem = type === 'lost' ? other : report;

    // SIGNAL 1: CATEGORY COMPATIBILITY (max 20)
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
      categoryPts = 20;
      const catObj = CATEGORY_MAP[report.category] || { label: 'Item' };
      matchReasons.push(`✓ Same item category (${catObj.label})`);
    } else {
      unmatchedReasons.push('⚠️ Different primary category');
    }

    // SIGNAL 2: TEXT & SEMANTIC KEYWORDS (max 15)
    if (sourceKeywords.length > 0 && targetKeywords.length > 0) {
      const uniqueKeywords = new Set([...sourceKeywords, ...targetKeywords]);
      let overlap = 0;
      sourceKeywords.forEach(k => {
        if (targetKeywords.includes(k)) overlap++;
      });
      textPts = Math.min(15, Math.round((overlap / uniqueKeywords.size) * 25));
      if (textPts >= 8) {
        matchReasons.push('✓ Strong title & description keyword alignment');
      }
    }

    // SIGNAL 3: COLOR SIMILARITY (max 10)
    const c1 = (sourceAttrs.color || '').toLowerCase().trim();
    const c2 = (targetAttrs.color || '').toLowerCase().trim();
    if (c1 && c2 && c1 !== 'unknown' && c2 !== 'unknown') {
      if (c1 === c2) {
        colorPts = 10;
        matchReasons.push(`✓ Same color (${c1.charAt(0).toUpperCase() + c1.slice(1)})`);
      } else if (c1.includes(c2) || c2.includes(c1) || hasColorOverlap(c1, c2)) {
        colorPts = 6;
        matchReasons.push(`✓ Similar color tones (${c1} / ${c2})`);
      } else {
        unmatchedReasons.push(`⚠️ Color difference (${c1} vs ${c2})`);
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
        matchReasons.push(`✓ Same campus location (${loc1})`);
      } else {
        const adj = LOCATION_PROXIMITY[loc1] || [];
        if (adj.some(a => a.toLowerCase().trim() === clean2) || isSameLocationCategory(loc1, loc2)) {
          locPts = 8;
          matchReasons.push(`✓ Adjacent campus area (${loc1} ↔ ${loc2})`);
        } else {
          unmatchedReasons.push(`⚠️ Different campus location (${loc1} vs ${loc2})`);
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
        matchReasons.push(`✓ Brand match (${b1.charAt(0).toUpperCase() + b1.slice(1)})`);
      } else {
        unmatchedReasons.push(`⚠️ Brand mismatch (${b1} vs ${b2})`);
      }
    } else {
      unmatchedReasons.push('⚠️ Brand could not be confirmed from image');
    }

    // SIGNAL 7: UNIQUE CHARACTERISTICS BONUS (max 10)
    const commonTokens = sourceAttrs.distinguishingTokens.filter(tok => targetAttrs.distinguishingTokens.includes(tok));
    if (commonTokens.length > 0) {
      featurePts = Math.min(10, commonTokens.length * 5 + 5);
      const featureLabel = commonTokens.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ');
      matchReasons.push(`✓ Distinguishing feature detected (${featureLabel})`);
    }

    // =======================================================================
    // REAL AI SIGNALS: YOLO (Signal 8) & CLIP (Signal 9)
    // =======================================================================
    const aiAnalysis = foundItem.aiAnalysis || foundItem.ai_analysis;
    const hasAiAnalysis = aiAnalysis && aiAnalysis.status === 'completed';

    if (hasAiAnalysis) {
      aiSignals.status = 'completed';

      // SIGNAL 8: YOLO VISUAL CONSISTENCY (max 10)
      const detections = (aiAnalysis.yolo && aiAnalysis.yolo.detections) || [];
      const lostCatStr = (lostItem.category || '').toLowerCase();
      const lostTitleStr = (lostItem.title || lostItem.itemName || '').toLowerCase();
      const lostDescStr = (lostItem.description || '').toLowerCase();
      const fullLostText = `${lostCatStr} ${lostTitleStr} ${lostDescStr}`;

      const cocoMap = {
        'bottle': ['bottle', 'bottles', 'flask', 'sipper', 'milton', 'water bottle'],
        'backpack': ['bag', 'bags', 'backpack', 'rucksack', 'kitbag'],
        'handbag': ['bag', 'bags', 'handbag', 'purse', 'wallet'],
        'suitcase': ['bag', 'bags', 'suitcase'],
        'laptop': ['laptop', 'macbook', 'notebook', 'computer', 'electronics', 'dell', 'hp', 'lenovo'],
        'cell phone': ['phone', 'cell phone', 'iphone', 'android', 'mobile', 'smartphone'],
        'mouse': ['mouse', 'electronics'],
        'keyboard': ['keyboard', 'electronics'],
        'book': ['book', 'books', 'notebook', 'textbook'],
        'umbrella': ['umbrella']
      };

      let bestDet = null;
      for (const d of detections) {
        const c = (d.class || '').toLowerCase();
        const keywords = cocoMap[c] || [c];
        if (keywords.some(kw => fullLostText.includes(kw))) {
          const p = Math.min(10, Math.max(4, Math.round(d.confidence * 10)));
          if (p > yoloPts) {
            yoloPts = p;
            bestDet = d;
          }
        }
      }

      if (bestDet) {
        const confPct = Math.round(bestDet.confidence * 100);
        matchReasons.push(`✓ YOLO visual detection consistent: ${bestDet.class} in photo (${confPct}% confidence)`);
        aiSignals.yolo = {
          detectedClass: bestDet.class,
          confidence: bestDet.confidence,
          points: yoloPts
        };
      } else if (detections.length > 0) {
        aiSignals.yolo = {
          detectedClasses: detections.map(d => d.class),
          points: 0
        };
      }

      // SIGNAL 9: CLIP MULTIMODAL SIMILARITY (max 15)
      if (aiAnalysis.clipMatches && aiAnalysis.clipMatches[lostItem.id]) {
        const cm = aiAnalysis.clipMatches[lostItem.id];
        clipPts = cm.points || 0;
        if (cm.similarity !== undefined) {
          matchReasons.push(`✓ CLIP visual similarity to lost description: ${Number(cm.similarity).toFixed(2)}`);
        }
        aiSignals.clip = cm;
      }
    } else if (foundItem.photo && foundItem.photo.trim()) {
      aiSignals.status = aiAnalysis ? aiAnalysis.status : 'pending';
    }

    // Compute raw & normalized score (0–100)
    let rawScore;
    if (hasAiAnalysis) {
      rawScore = categoryPts + textPts + colorPts + locPts + timePts + brandPts + featurePts + yoloPts + clipPts;
    } else {
      // Scale non-AI points so non-photo items are not arbitrarily penalized
      const nonAiSum = categoryPts + textPts + colorPts + locPts + timePts + brandPts + featurePts;
      rawScore = Math.min(100, Math.round(nonAiSum * (100 / 75)));
    }

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
        yoloPts,
        clipPts,
        aiSignals,
        matchReasons,
        unmatchedReasons
      });
    }
  });

  return matches.sort((a, b) => b.score - a.score);
}


function extractKeywords(str) {
  const stopWords = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'with', 'and', 'or', 'for', 'to', 'of', 'by', 'is', 'it', 'my', 'has', 'near', 'inside', 'was', 'this', 'that']);
  return str.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
}

function hasColorOverlap(color1, color2) {
  if (!color1 || !color2) return false;
  const c1Words = color1.toLowerCase().replace(/[^a-z]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  const c2Words = color2.toLowerCase().replace(/[^a-z]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  return c1Words.some(w => c2Words.includes(w));
}

function matchItem(report, type) {
  const matches = findMatches(report, type);
  if (matches.length > 0) {
    const top = matches[0];
    report.status = 'Matched';
    report.matchId = top.opposite.id;
    top.opposite.status = 'Matched';
    top.opposite.matchId = report.id;

    appState.notifications.unshift({
      id: generateId('notif'),
      message: `🤖 AI Match: ${top.score}% match between "${report.title}" and "${top.opposite.title}"!`,
      read: false,
      createdAt: new Date().toISOString()
    });
  }
  return matches;
}

function calculateMatchesList() {
  const allMatches = [];
  const seen = new Set();

  appState.lostReports.forEach(lost => {
    const matches = findMatches(lost, 'lost');
    matches.forEach(m => {
      const pairKey = `${m.lost.id}_${m.found.id}`;
      if (!seen.has(pairKey)) {
        seen.add(pairKey);
        allMatches.push(m);
      }
    });
  });

  return allMatches.sort((a, b) => b.score - a.score);
}

function recalculateMatches() {
  renderAIMatches();
  updateBadges();
  showToast('AI correlation scan completed!', 'info');
}

function renderAIMatches() {
  const container = document.getElementById('ai-matches-container');
  if (!container) return;

  const matches = calculateMatchesList();

  if (matches.length === 0) {
    container.innerHTML = `
      <div class="glass-card empty-state">
        <div class="empty-state-icon">🤖</div>
        <p>No high-probability item matches detected (&ge;40%). As new campus reports arrive, the engine will alert you!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = matches.map(m => {
    const { lost, found, score, categoryPts, textPts, colorPts, locPts, timePts, brandPts } = m;
    const isClaimed = appState.claims.some(c => c.lostReportId === lost.id && c.foundReportId === found.id);

    const circumference = 251.2;
    const strokeOffset = circumference - (score / 100) * circumference;
    const scoreColorClass = score > 70 ? 'score-green' : (score > 50 ? 'score-yellow' : 'score-red');

    const lostCat = CATEGORY_MAP[lost.category] || { label: 'Item', icon: '📦' };
    const foundCat = CATEGORY_MAP[found.category] || { label: 'Item', icon: '📦' };

    return `
      <div class="glass-card match-card" style="padding: 22px;">
        <div class="match-card-side-by-side">
          <!-- Left: Lost item -->
          <div class="match-item-pane">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="badge badge-searching"><span class="badge-dot"></span> Lost Item</span>
              ${lost.priority === 'urgent' ? `<span class="badge badge-urgent">🔴 URGENT</span>` : ''}
            </div>
            ${lost.photo ? `
              <div style="position: relative; overflow: hidden; border-radius: 8px;">
                <img src="${lost.photo}" class="match-item-thumb" alt="Lost Item">
                ${lost.imageSharedForMatch ? `
                  <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(15, 23, 42, 0.88); color: var(--teal-bright); font-size: 0.65rem; padding: 3px 6px; text-align: center; font-weight: 600; line-height: 1.2;">
                    Possible match — image shared for verification
                  </div>
                ` : ''}
              </div>
            ` : `
              <div class="match-item-thumb" style="display:flex;align-items:center;justify-content:center;font-size:2.5rem;">${lostCat.icon}</div>
            `}
            <h4 style="font-size: 1.05rem;">${escapeHTML(lost.title)}</h4>
            <div class="sub-text">📂 ${lostCat.label}</div>
            <div style="font-size: 0.82rem; color: var(--text-secondary);">📍 Last seen: <strong>${escapeHTML(lost.location)}</strong></div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">📅 ${getTimeAgo(lost.date || lost.createdAt)}</div>
          </div>

          <!-- Center: Large Animated SVG Progress Ring -->
          <div class="match-score-center">
            <div class="score-ring-wrap">
              <svg class="score-ring-svg" viewBox="0 0 100 100">
                <circle class="score-ring-bg" cx="50" cy="50" r="40"></circle>
                <circle class="score-ring-fill ${scoreColorClass}" cx="50" cy="50" r="40"
                  stroke-dasharray="${circumference}"
                  stroke-dashoffset="${strokeOffset}">
                </circle>
              </svg>
              <div class="score-text-inside">${score}%</div>
            </div>
            <span style="font-size: 0.72rem; text-transform: uppercase; color: var(--accent-light); font-weight: 700; letter-spacing: 0.6px;">AI Match</span>
          </div>

          <!-- Right: Found item -->
          <div class="match-item-pane">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="badge badge-matched"><span class="badge-dot"></span> Found Item</span>
              <span class="sub-text" style="font-size:0.75rem;">${escapeHTML(found.custody || 'Campus Desk')}</span>
            </div>
            ${found.photo ? `<img src="${found.photo}" class="match-item-thumb" alt="Found Item">` : `
              <div class="match-item-thumb" style="display:flex;align-items:center;justify-content:center;font-size:2.5rem;">${foundCat.icon}</div>
            `}
            <h4 style="font-size: 1.05rem;">${escapeHTML(found.title)}</h4>
            <div class="sub-text">📂 ${foundCat.label}</div>
            <div style="font-size: 0.82rem; color: var(--text-secondary);">📍 Found at: <strong>${escapeHTML(found.location)}</strong></div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">📅 ${getTimeAgo(found.date || found.createdAt)}</div>
          </div>
        </div>

        <!-- Breakdown Bar -->
        <div class="match-breakdown-bar" style="margin-top: 16px;">
          <span class="breakdown-chip ${categoryPts > 0 ? 'matched' : ''}">📦 Category ${categoryPts}/25 ${categoryPts > 0 ? '✓' : ''}</span>
          <span class="breakdown-chip ${textPts >= 15 ? 'matched' : ''}">📝 Text ${textPts}/30</span>
          <span class="breakdown-chip ${colorPts > 0 ? 'matched' : ''}">🎨 Color ${colorPts}/15 ${colorPts > 0 ? '✓' : ''}</span>
          <span class="breakdown-chip ${locPts > 0 ? 'matched' : ''}">📍 Location ${locPts}/15 ${locPts > 0 ? '✓' : ''}</span>
          <span class="breakdown-chip ${timePts >= 10 ? 'matched' : ''}">🕐 Time ${timePts}/15</span>
          ${brandPts > 0 ? `<span class="breakdown-chip matched">🏷️ Brand +5 ✓</span>` : ''}
        </div>

        <!-- Actions Area: Claim + Urgent Help -->
        <div style="margin-top: 14px; display: flex; justify-content: flex-end; align-items: center; gap: 10px; flex-wrap: wrap;">
          <button type="button" class="btn btn-outline" style="border-color: rgba(239, 68, 68, 0.4); color: #F87171; padding: 6px 12px; font-size: 0.82rem;" onclick="openItemHelpModal('${lost.id}', '${escapeHTML(lost.title)}', '${escapeHTML(lost.location)}')">
            <i data-lucide="shield-alert" style="width: 14px; height: 14px;"></i>
            <span>🆘 Need Help?</span>
          </button>
          ${isClaimed ? `
            <span class="badge badge-verified">Claim Verification in Review</span>
          ` : `
            <button class="btn btn-accent-teal" onclick="openClaimModal('${lost.id}', '${found.id}', '${escapeHTML(lost.title)}', '${lost.category}')">
              <span>🤝</span> Claim This Item
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}
