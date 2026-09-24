/**
 * LostSeek Server-Side AI Analysis & Matching Service
 * 
 * Coordinates real YOLOv5n object detection and CLIP ViT-B/32 multimodal encoding.
 * 
 * Functions:
 * - analyzeFoundImage(imageInput)
 * - computeAiMatchSignals(foundReport, lostReport)
 * - buildLostQueryText(lostReport)
 */

const { detectObjects } = require('./yolo_service');
const { encodeImage, encodeText } = require('./clip_service');

// Mapping between COCO classes and campus item categories/keywords
const COCO_CATEGORY_MAP = {
  'bottle': ['bottle', 'bottles', 'flask', 'sipper', 'milton', 'water bottle'],
  'backpack': ['bag', 'bags', 'backpack', 'rucksack', 'kitbag', 'school bag'],
  'handbag': ['bag', 'bags', 'handbag', 'purse', 'wallet'],
  'suitcase': ['bag', 'bags', 'suitcase', 'luggage'],
  'laptop': ['laptop', 'macbook', 'notebook', 'computer', 'electronics', 'dell', 'hp', 'lenovo'],
  'cell phone': ['phone', 'cell phone', 'iphone', 'android', 'mobile', 'smartphone', 'electronics'],
  'mouse': ['mouse', 'electronics', 'accessory'],
  'keyboard': ['keyboard', 'electronics'],
  'book': ['book', 'books', 'notebook', 'textbook', 'diary', 'journal'],
  'umbrella': ['umbrella', 'parasol'],
  'clock': ['watch', 'clock', 'smartwatch', 'fastrack', 'titan'],
  'sports ball': ['ball', 'football', 'cricket ball', 'basketball']
};

/**
 * Fetch buffer from image source (URL, Buffer, Base64 data URI, or file path)
 */
async function resolveImageBuffer(imageInput) {
  if (Buffer.isBuffer(imageInput)) {
    return imageInput;
  }
  if (typeof imageInput === 'string') {
    if (imageInput.startsWith('data:')) {
      const base64Data = imageInput.replace(/^data:image\/\w+;base64,/, '');
      return Buffer.from(base64Data, 'base64');
    }
    if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
      const res = await fetch(imageInput);
      if (!res.ok) {
        throw new Error(`Failed to fetch image from URL: ${res.status} ${res.statusText}`);
      }
      const ab = await res.arrayBuffer();
      return Buffer.from(ab);
    }
    // Assume local file path
    const fs = require('fs');
    return fs.promises.readFile(imageInput);
  }
  throw new Error('Unsupported imageInput type. Provide Buffer, URL, Base64, or file path.');
}

/**
 * Compute cosine similarity between two Float32Array / number[] vectors.
 * If both are L2-normalized, dot product is equal to cosine similarity.
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Analyze a FOUND image using real YOLOv5n and CLIP ViT-B/32 models.
 * Returns structured visual analysis object.
 */
async function analyzeFoundImage(imageInput, lostReports = []) {
  const startTime = Date.now();
  try {
    const buffer = await resolveImageBuffer(imageInput);

    // 1. Run YOLOv5n object detection
    let yoloResult;
    try {
      yoloResult = await detectObjects(buffer, 0.20);
    } catch (yoloErr) {
      console.warn('YOLO detection warning:', yoloErr.message);
      yoloResult = { detections: [], inferenceTimeMs: 0, error: yoloErr.message };
    }

    // 2. Run CLIP ViT-B/32 image encoder
    let clipResult;
    try {
      clipResult = await encodeImage(buffer);
    } catch (clipErr) {
      console.warn('CLIP image encoding warning:', clipErr.message);
      clipResult = { embedding: null, inferenceTimeMs: 0, error: clipErr.message };
    }

    // If both models failed or image buffer was unreadable, return status: 'failed'
    if (clipResult.error && yoloResult.error) {
      return {
        status: 'failed',
        error: clipResult.error || yoloResult.error,
        analysis_version: '1.0',
        analysis_created_at: new Date().toISOString(),
        totalPipelineTimeMs: Date.now() - startTime
      };
    }

    const detections = yoloResult.detections || [];
    const detectedClasses = [...new Set(detections.map(d => d.class))];
    const primaryClass = detections.length > 0 ? detections[0].class : 'unclassified';

    // 3. Optional batch CLIP comparisons against relevant lost reports
    const clipMatches = {};
    if (clipResult.embedding && Array.isArray(lostReports) && lostReports.length > 0) {
      for (const lost of lostReports) {
        if (!lost.id) continue;
        const qText = buildLostQueryText(lost);
        if (qText) {
          try {
            const txtRes = await encodeText(qText);
            const sim = cosineSimilarity(clipResult.embedding, txtRes.embedding);
            let pts = 0;
            if (sim >= 0.19) {
              const ratio = Math.max(0, Math.min(1, (sim - 0.19) / 0.12));
              pts = Math.round(ratio * 15);
            }
            clipMatches[lost.id] = {
              lostId: lost.id,
              queryText: qText,
              similarity: Number(sim.toFixed(4)),
              points: pts,
              reason: pts >= 5 ? `✓ CLIP visual similarity to lost description: ${sim.toFixed(2)}` : null
            };
          } catch (tErr) {
            console.warn('Lost report text encoding warning:', lost.id, tErr.message);
          }
        }
      }
    }

    return {
      status: 'completed',
      yolo: {
        model: 'yolov5n_fp32',
        detections: detections.map(d => ({
          class: d.class,
          confidence: Number(d.confidence.toFixed(4)),
          box: {
            x: Math.round(d.box.x),
            y: Math.round(d.box.y),
            width: Math.round(d.box.width),
            height: Math.round(d.box.height)
          }
        })),
        inferenceTimeMs: yoloResult.inferenceTimeMs || 0
      },
      clip: {
        model: 'clip-vit-b-32-uint8',
        imageEmbeddingAvailable: !!(clipResult.embedding && clipResult.embedding.length === 512),
        embedding: clipResult.embedding ? Array.from(clipResult.embedding) : null,
        inferenceTimeMs: clipResult.inferenceTimeMs || 0
      },
      clipMatches,
      visualSummary: {
        objectTypes: detectedClasses,
        primaryClass,
        detectedCount: detections.length
      },
      analysis_version: '1.0',
      analysis_created_at: new Date().toISOString(),
      totalPipelineTimeMs: Date.now() - startTime
    };
  } catch (error) {
    console.error('analyzeFoundImage failure:', error);
    return {
      status: 'failed',
      error: error.message || 'AI pipeline processing error',
      analysis_version: '1.0',
      analysis_created_at: new Date().toISOString(),
      totalPipelineTimeMs: Date.now() - startTime
    };
  }
}

/**
 * Construct a clean, natural search query from actual LOST report fields.
 */
function buildLostQueryText(lostReport) {
  if (!lostReport) return '';
  const parts = [];

  const color = (lostReport.color || '').trim();
  const brand = (lostReport.brand || '').trim();
  const title = (lostReport.title || lostReport.itemName || '').trim();
  const cat = (lostReport.category || '').trim();
  const desc = (lostReport.description || '').trim();
  const features = (lostReport.distinguishingFeatures || '').trim();

  // Combine key visual tokens
  if (color && !color.toLowerCase().includes('unspecified') && !color.toLowerCase().includes('unknown')) {
    parts.push(color);
  }
  if (brand && !brand.toLowerCase().includes('unspecified') && !brand.toLowerCase().includes('not clearly')) {
    parts.push(brand);
  }
  if (title) {
    parts.push(title);
  } else if (cat) {
    parts.push(cat);
  }
  if (desc && desc !== title) {
    parts.push(desc);
  }
  if (features) {
    parts.push(features);
  }

  // Deduplicate words and join cleanly
  const words = parts.join(' ').toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
  const uniqueWords = [];
  for (const w of words) {
    if (!uniqueWords.includes(w) || ['blue', 'red', 'black', 'white', 'bottle', 'laptop', 'bag'].includes(w)) {
      uniqueWords.push(w);
    }
  }

  return uniqueWords.join(' ');
}

/**
 * Compute real AI match signals (YOLO consistency + CLIP multimodal similarity)
 * between a FOUND report (with aiAnalysis) and a candidate LOST report.
 * 
 * Returns:
 * - yoloConsistencyPts (0 to 10)
 * - clipSimilarityPts (0 to 15)
 * - aiReasons (Array of explainable strings)
 * - aiSignals (Structured details)
 */
async function computeAiMatchSignals(foundReport, lostReport) {
  const result = {
    yoloConsistencyPts: 0,
    clipSimilarityPts: 0,
    aiReasons: [],
    aiSignals: {
      status: 'not_available'
    }
  };

  const aiAnalysis = foundReport?.aiAnalysis || foundReport?.ai_analysis;
  if (!aiAnalysis || aiAnalysis.status !== 'completed') {
    return result;
  }

  result.aiSignals.status = 'completed';

  // =========================================================================
  // SIGNAL 8: YOLO VISUAL CONSISTENCY (0 to 10 points)
  // =========================================================================
  const yolo = aiAnalysis.yolo;
  const detections = (yolo && yolo.detections) || [];
  const lostCatStr = (lostReport.category || '').toLowerCase();
  const lostTitleStr = (lostReport.title || lostReport.itemName || '').toLowerCase();
  const lostDescStr = (lostReport.description || '').toLowerCase();
  const fullLostText = `${lostCatStr} ${lostTitleStr} ${lostDescStr}`;

  let bestYoloMatch = null;
  let maxYoloScore = 0;

  for (const d of detections) {
    const cocoClass = (d.class || '').toLowerCase();
    const mappedKeywords = COCO_CATEGORY_MAP[cocoClass] || [cocoClass];

    const isMatch = mappedKeywords.some(kw => fullLostText.includes(kw));
    if (isMatch) {
      // Score scaled by detection confidence
      const score = Math.min(10, Math.max(4, Math.round(d.confidence * 10)));
      if (score > maxYoloScore) {
        maxYoloScore = score;
        bestYoloMatch = {
          class: d.class,
          confidence: d.confidence,
          score
        };
      }
    }
  }

  if (bestYoloMatch) {
    result.yoloConsistencyPts = bestYoloMatch.score;
    const confPct = Math.round(bestYoloMatch.confidence * 100);
    result.aiReasons.push(`✓ YOLO visual detection consistent: ${bestYoloMatch.class} in photo (${confPct}% confidence)`);
    result.aiSignals.yolo = {
      detectedClasses: detections.map(d => d.class),
      matchedClass: bestYoloMatch.class,
      confidence: bestYoloMatch.confidence,
      points: bestYoloMatch.score
    };
  } else if (detections.length > 0) {
    result.aiSignals.yolo = {
      detectedClasses: detections.map(d => d.class),
      matchedClass: null,
      points: 0
    };
  }

  // =========================================================================
  // SIGNAL 9: CLIP MULTIMODAL SEMANTIC SIMILARITY (0 to 15 points)
  // =========================================================================
  const clip = aiAnalysis.clip;
  if (clip && clip.embedding && clip.embedding.length === 512) {
    try {
      const queryText = buildLostQueryText(lostReport);
      if (queryText.length > 0) {
        const textResult = await encodeText(queryText);
        const imgEmbedding = clip.embedding;
        const textEmbedding = textResult.embedding;

        const similarity = cosineSimilarity(imgEmbedding, textEmbedding);

        // ViT-B/32 normalized cosine similarities typically span:
        // < 0.18: unrelated items
        // 0.18 - 0.23: loose semantic relevance
        // 0.24 - 0.28: good match
        // > 0.28: strong multimodal correspondence
        let clipPts = 0;
        if (similarity >= 0.19) {
          // Linear mapping from 0.19 (0 pts) to 0.31 (15 pts)
          const ratio = Math.max(0, Math.min(1, (similarity - 0.19) / 0.12));
          clipPts = Math.round(ratio * 15);
        }

        result.clipSimilarityPts = clipPts;
        if (clipPts >= 5) {
          result.aiReasons.push(`✓ CLIP visual similarity to lost description: ${similarity.toFixed(2)}`);
        }

        // Check specific attribute prompt (color + category)
        const lostColor = (lostReport.color || '').toLowerCase().trim();
        let colorAttrScore = null;
        if (lostColor && !lostColor.includes('unspecified') && !lostColor.includes('unknown')) {
          try {
            const colorPrompt = `${lostColor} ${lostReport.category || 'item'}`;
            const colorResult = await encodeText(colorPrompt);
            const colorSim = cosineSimilarity(imgEmbedding, colorResult.embedding);
            colorAttrScore = Number(colorSim.toFixed(4));
            if (colorSim >= 0.22) {
              result.aiReasons.push(`✓ Visual similarity to ${lostColor} appearance description (${colorSim.toFixed(2)})`);
            }
          } catch (attrErr) {
            // Attribute prompt is optional enhancement
          }
        }

        result.aiSignals.clip = {
          queryText,
          semanticSimilarity: Number(similarity.toFixed(4)),
          colorAttributeSimilarity: colorAttrScore,
          points: clipPts
        };
      }
    } catch (clipErr) {
      console.warn('CLIP comparison error during matching:', clipErr.message);
    }
  }

  return result;
}

module.exports = {
  analyzeFoundImage,
  computeAiMatchSignals,
  buildLostQueryText,
  cosineSimilarity,
  resolveImageBuffer
};
