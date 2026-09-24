/**
 * LostSeek - Server-Side Intelligent Multi-Signal Matcher
 * 
 * Correlates LOST and FOUND reports across different accounts using:
 * - Category compatibility & item ontology
 * - Text & keyword overlap
 * - Color similarity
 * - Campus location proximity (KSRCE adjacency graph)
 * - Date/time proximity
 * - Brand matching
 * - Distinguishing feature tokens
 * - YOLO visual object consistency
 * - CLIP multimodal semantic similarity
 */

const { computeAiMatchSignals } = require('./lostseek_ai_service');

const KSRCE_LOCATION_PROXIMITY = {
  'Main Canteen': ['Cafeteria', 'Student Center', 'Food Court', 'Auditorium'],
  'Food Court': ['Main Canteen', 'Cafeteria', 'Student Center'],
  'Central Library': ['Reading Hall', 'Digital Library', 'Study Rooms', 'Academic Block A'],
  'Digital Library': ['Central Library', 'Reading Hall', 'Academic Block A'],
  'Academic Block A': ['ECE Department', 'EEE Department', 'Lecture Hall 101', 'Central Library'],
  'Academic Block B': ['CSE Department', 'IT Department', 'AI & DS Department', 'Computer Lab 3'],
  'CSE Department': ['Academic Block B', 'IT Department', 'Computer Lab 3'],
  'Computer Lab 3': ['Academic Block B', 'CSE Department', 'Software Lab'],
  'Mechanical Block': ['Workshop', 'CAD Lab', 'Robotics Center'],
  'Sports Complex': ['Football Ground', 'Basketball Court', 'Indoor Stadium', 'Gymnasium'],
  'Indoor Stadium': ['Sports Complex', 'Gymnasium', 'Badminton Court'],
  'Admin Block': ['Principal Office', 'Fee Counter', 'Reception', 'Board Room'],
  'Main Gate': ['Security Post 1', 'Parking Area A', 'Bus Bay'],
  'Hostel Block A': ['Hostel Block B', 'Hostel Mess', 'Campus Ground'],
  'Auditorium': ['Main Canteen', 'Open Air Theatre', 'Conference Hall']
};

function extractTokens(text) {
  if (!text) return [];
  const stopWords = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of', 'and', 'or', 'is', 'it', 'my', 'item', 'found', 'lost']);
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
}

function hasColorOverlap(c1, c2) {
  if (!c1 || !c2) return false;
  const col1 = c1.toLowerCase().trim();
  const col2 = c2.toLowerCase().trim();
  if (col1 === col2) return true;
  if (col1.includes(col2) || col2.includes(col1)) return true;
  const groups = [
    ['blue', 'navy', 'cyan', 'sky blue', 'azure'],
    ['red', 'maroon', 'crimson', 'burgundy'],
    ['black', 'dark', 'charcoal'],
    ['silver', 'grey', 'gray', 'metallic'],
    ['green', 'olive', 'emerald'],
    ['white', 'silver', 'cream']
  ];
  return groups.some(g => g.some(color => col1.includes(color)) && g.some(color => col2.includes(color)));
}

function evaluateHeuristicMatch(lostReport, foundReport) {
  if (!lostReport || !foundReport) return { isMatch: false, score: 0, confidence: 'Low', signals: {} };

  const matchReasons = [];
  const unmatchedReasons = [];

  let categoryPts = 0;
  let textPts = 0;
  let colorPts = 0;
  let locPts = 0;
  let timePts = 0;
  let brandPts = 0;
  let featurePts = 0;

  // Signal 1: Category Match (max 20)
  const cat1 = (lostReport.category || '').toLowerCase().replace(/s$/, '').trim();
  const cat2 = (foundReport.category || '').toLowerCase().replace(/s$/, '').trim();
  if (cat1 && cat2 && (cat1 === cat2 || cat1.includes(cat2) || cat2.includes(cat1))) {
    categoryPts = 20;
    matchReasons.push(`✓ Same item category (${lostReport.category})`);
  } else {
    unmatchedReasons.push('⚠️ Different primary category');
  }

  // Signal 2: Text Keywords (max 15)
  const lostTokens = extractTokens(`${lostReport.title || lostReport.itemName || ''} ${lostReport.description || ''}`);
  const foundTokens = extractTokens(`${foundReport.title || foundReport.itemName || ''} ${foundReport.description || ''}`);
  if (lostTokens.length > 0 && foundTokens.length > 0) {
    const unique = new Set([...lostTokens, ...foundTokens]);
    let overlap = 0;
    lostTokens.forEach(t => { if (foundTokens.includes(t)) overlap++; });
    textPts = Math.min(15, Math.round((overlap / unique.size) * 30));
    if (textPts >= 6) {
      matchReasons.push('✓ Strong title & description keyword alignment');
    }
  }

  // Signal 3: Color Similarity (max 10)
  const color1 = (lostReport.color || '').toLowerCase().trim();
  const color2 = (foundReport.color || '').toLowerCase().trim();
  if (color1 && color2 && color1 !== 'unknown' && color2 !== 'unknown') {
    if (color1 === color2) {
      colorPts = 10;
      matchReasons.push(`✓ Same color (${color1})`);
    } else if (hasColorOverlap(color1, color2)) {
      colorPts = 7;
      matchReasons.push(`✓ Similar color tones (${color1} / ${color2})`);
    } else {
      unmatchedReasons.push(`⚠️ Color difference (${color1} vs ${color2})`);
    }
  }

  // Signal 4: Location Proximity (max 15)
  const loc1 = (lostReport.location || '').trim();
  const loc2 = (foundReport.location || '').trim();
  if (loc1 && loc2) {
    if (loc1.toLowerCase() === loc2.toLowerCase()) {
      locPts = 15;
      matchReasons.push(`✓ Same campus location (${loc1})`);
    } else {
      const adj = KSRCE_LOCATION_PROXIMITY[loc1] || [];
      if (adj.some(a => a.toLowerCase() === loc2.toLowerCase())) {
        locPts = 10;
        matchReasons.push(`✓ Adjacent campus area (${loc1} ↔ ${loc2})`);
      } else {
        unmatchedReasons.push(`⚠️ Different campus location (${loc1} vs ${loc2})`);
      }
    }
  }

  // Signal 5: Time Proximity (max 10)
  const t1 = new Date(lostReport.dateTime || lostReport.createdAt || lostReport.date).getTime();
  const t2 = new Date(foundReport.dateTime || foundReport.createdAt || foundReport.date).getTime();
  if (!isNaN(t1) && !isNaN(t2)) {
    const diffDays = Math.abs(t1 - t2) / (1000 * 3600 * 24);
    if (diffDays <= 1) {
      timePts = 10;
      matchReasons.push('✓ Same timeframe (within 24 hours)');
    } else if (diffDays <= 3) {
      timePts = 7;
      matchReasons.push('✓ Compatible timeframe (within 3 days)');
    } else if (diffDays <= 7) {
      timePts = 4;
    }
  }

  // Signal 6: Brand Match (max 5)
  const brand1 = (lostReport.brand || '').toLowerCase().trim();
  const brand2 = (foundReport.brand || '').toLowerCase().trim();
  if (brand1 && brand2 && brand1 !== 'unknown' && brand2 !== 'unknown') {
    if (brand1 === brand2 || brand1.includes(brand2) || brand2.includes(brand1)) {
      brandPts = 5;
      matchReasons.push(`✓ Brand match (${brand1})`);
    }
  }

  // Signal 7: Distinguishing Features (max 10)
  const feat1 = extractTokens(lostReport.distinguishingFeatures || lostReport.distinguishing_features || '');
  const feat2 = extractTokens(foundReport.distinguishingFeatures || foundReport.distinguishing_features || '');
  if (feat1.length > 0 && feat2.length > 0) {
    const common = feat1.filter(f => feat2.includes(f));
    if (common.length > 0) {
      featurePts = Math.min(10, common.length * 5 + 5);
      matchReasons.push(`✓ Distinguishing features match (${common.join(', ')})`);
    }
  }

  const rawSum = categoryPts + textPts + colorPts + locPts + timePts + brandPts + featurePts;
  // Normalize 0-85 heuristic point scale to 0-100 percentage
  const finalScore = Math.min(100, Math.round(rawSum * (100 / 85)));

  // Strict meaningful match requirement:
  // Must NOT rely solely on category match (categoryPts alone is max 20).
  // There must be secondary evidence (text, location, color, brand, or distinguishing features).
  const hasSecondaryCorroboration = (textPts >= 6 || locPts >= 10 || colorPts >= 7 || brandPts >= 5 || featurePts >= 5);
  const isMeaningful = finalScore >= 40 && categoryPts > 0 && hasSecondaryCorroboration;

  let confidence = 'Low';
  if (finalScore >= 75) confidence = 'High';
  else if (finalScore >= 55) confidence = 'Medium';

  return {
    isMatch: isMeaningful,
    score: finalScore,
    confidence,
    signals: {
      categoryPts,
      textPts,
      colorPts,
      locPts,
      timePts,
      brandPts,
      featurePts
    },
    matchReasons,
    unmatchedReasons
  };
}

async function evaluateMatch(lostReport, foundReport) {
  const heuristic = evaluateHeuristicMatch(lostReport, foundReport);
  const matchReasons = [...heuristic.matchReasons];
  const unmatchedReasons = [...heuristic.unmatchedReasons];

  let yoloPts = 0;
  let clipPts = 0;
  let aiSignals = { status: 'not_applicable' };

  try {
    const aiRes = await computeAiMatchSignals(foundReport, lostReport);
    if (aiRes && aiRes.aiSignals && aiRes.aiSignals.status === 'completed') {
      yoloPts = aiRes.yoloConsistencyPts || 0;
      clipPts = aiRes.clipSimilarityPts || 0;
      aiSignals = aiRes.aiSignals;
      if (Array.isArray(aiRes.aiReasons)) {
        matchReasons.push(...aiRes.aiReasons);
      }
    }
  } catch (aiErr) {
    console.warn('AI matching evaluation warning:', aiErr.message);
  }

  const rawScore = heuristic.signals.categoryPts +
    heuristic.signals.textPts +
    heuristic.signals.colorPts +
    heuristic.signals.locPts +
    heuristic.signals.timePts +
    heuristic.signals.brandPts +
    heuristic.signals.featurePts +
    yoloPts +
    clipPts;

  const totalScore = Math.min(100, Math.max(0, rawScore));

  let confidence = 'Low';
  if (totalScore >= 75) confidence = 'High';
  else if (totalScore >= 55) confidence = 'Medium';

  return {
    isMatch: totalScore >= 50 || heuristic.isMatch,
    score: totalScore,
    confidence,
    lostReportId: lostReport.id,
    foundReportId: foundReport.id,
    signals: {
      ...heuristic.signals,
      yoloPts,
      clipPts
    },
    matchReasons,
    unmatchedReasons,
    aiSignals
  };
}

module.exports = {
  evaluateMatch,
  evaluateHeuristicMatch,
  KSRCE_LOCATION_PROXIMITY
};
