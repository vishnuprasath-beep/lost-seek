/**
 * CLIP Service — Image and Text Embedding
 * 
 * Uses CLIP ViT-B/32 (quantized uint8) ONNX models for:
 * - Encoding images into 512-dim embeddings
 * - Encoding text descriptions into 512-dim embeddings
 * - Computing cosine similarity between image and text embeddings
 */

const ort = require('onnxruntime-node');
const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

// ===== CLIP BPE Tokenizer =====

const VOCAB_PATH = path.resolve(__dirname, '..', 'models', 'bpe_simple_vocab_16e6.txt');

let bpeRanks = null;
let encoder = null;
let decoder = null;

/**
 * Load the BPE vocabulary and build lookup tables
 */
function loadTokenizer() {
  if (bpeRanks) return; // Already loaded
  
  const vocabText = fs.readFileSync(VOCAB_PATH, 'utf-8');
  const lines = vocabText.split('\n');
  
  // First line is a header, skip it
  const merges = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0) continue;
    merges.push(line.split(' '));
  }
  
  // Build BPE ranks
  bpeRanks = new Map();
  for (let i = 0; i < merges.length; i++) {
    bpeRanks.set(merges[i][0] + ' ' + merges[i][1], i);
  }
  
  // Build byte encoder (maps bytes 0-255 to unicode chars)
  const byteEncoder = {};
  const byteDecoder = {};
  
  // Printable bytes
  const bs = [];
  for (let i = 33; i <= 126; i++) bs.push(i);   // '!' to '~'
  for (let i = 161; i <= 172; i++) bs.push(i);   // '¡' to '¬'
  for (let i = 174; i <= 255; i++) bs.push(i);   // '®' to 'ÿ'
  
  const cs = [...bs];
  let n = 0;
  for (let b = 0; b < 256; b++) {
    if (!bs.includes(b)) {
      bs.push(b);
      cs.push(256 + n);
      n++;
    }
  }
  
  for (let i = 0; i < bs.length; i++) {
    byteEncoder[bs[i]] = String.fromCharCode(cs[i]);
    byteDecoder[String.fromCharCode(cs[i])] = bs[i];
  }
  
  // Build token encoder/decoder
  // Base vocabulary: 256 byte tokens + 256 byte tokens with </w>
  encoder = new Map();
  decoder = new Map();
  
  // Byte-level tokens
  for (let i = 0; i < 256; i++) {
    const token = String.fromCharCode(cs[i]);
    encoder.set(token, i);
    decoder.set(i, token);
  }
  
  // Merge tokens (OpenAI CLIP vocabulary is strictly 49408: 256 bytes + merges + 2 special tokens)
  const maxMerges = Math.min(merges.length, 49406 - 256);
  for (let i = 0; i < maxMerges; i++) {
    const merged = merges[i][0] + merges[i][1];
    const idx = 256 + i;
    encoder.set(merged, idx);
    decoder.set(idx, merged);
  }
  
  // Special tokens
  const vocabSize = 256 + merges.length;
  encoder.set('<|startoftext|>', 49406);
  encoder.set('<|endoftext|>', 49407);
  decoder.set(49406, '<|startoftext|>');
  decoder.set(49407, '<|endoftext|>');
  
  // Store byte encoder for tokenization
  encoder._byteEncoder = byteEncoder;
}

/**
 * Get BPE pairs from a word
 */
function getPairs(word) {
  const pairs = new Set();
  let prev = word[0];
  for (let i = 1; i < word.length; i++) {
    pairs.add(prev + ' ' + word[i]);
    prev = word[i];
  }
  return pairs;
}

/**
 * Apply BPE to a single word
 */
function bpe(token) {
  let word = token.slice(0, -1).split('').concat([token.slice(-1) + '</w>']);
  
  if (word.length === 1) return word[0];
  
  while (true) {
    let minRank = Infinity;
    let minPair = null;
    
    for (let i = 0; i < word.length - 1; i++) {
      const pair = word[i] + ' ' + word[i + 1];
      const rank = bpeRanks.get(pair);
      if (rank !== undefined && rank < minRank) {
        minRank = rank;
        minPair = [word[i], word[i + 1]];
      }
    }
    
    if (minPair === null) break;
    
    const newWord = [];
    let i = 0;
    while (i < word.length) {
      if (i < word.length - 1 && word[i] === minPair[0] && word[i + 1] === minPair[1]) {
        newWord.push(minPair[0] + minPair[1]);
        i += 2;
      } else {
        newWord.push(word[i]);
        i++;
      }
    }
    word = newWord;
    if (word.length === 1) break;
  }
  
  return word.join(' ');
}

/**
 * Tokenize text for CLIP
 * Returns Int32Array of token IDs, padded to length 77
 */
function tokenize(text, maxLength = 77) {
  loadTokenizer();
  
  const byteEncoder = encoder._byteEncoder;
  
  // Lowercase and clean
  text = text.toLowerCase().trim();
  
  // Simple regex tokenization (similar to CLIP's pattern)
  const pat = /[a-z]+|[0-9]+|[^\sa-z0-9]+/g;
  const words = text.match(pat) || [];
  
  const tokens = [49406]; // <|startoftext|>
  
  for (const word of words) {
    // Convert each byte to its BPE representation
    const encoded = [];
    for (let i = 0; i < word.length; i++) {
      const byte = word.charCodeAt(i);
      if (byte < 256 && byteEncoder[byte]) {
        encoded.push(byteEncoder[byte]);
      }
    }
    
    if (encoded.length === 0) continue;
    
    const token = encoded.join('');
    const bpeTokens = bpe(token).split(' ');
    
    for (const bt of bpeTokens) {
      const id = encoder.get(bt);
      if (id !== undefined && id < 49406) {
        tokens.push(id);
      }
    }
  }
  
  tokens.push(49407); // <|endoftext|>
  
  // Pad or truncate to maxLength
  const result = new Int32Array(maxLength);
  for (let i = 0; i < Math.min(tokens.length, maxLength); i++) {
    result[i] = tokens[i];
  }
  
  return result;
}

// ===== CLIP Model Sessions =====

let clipImageSession = null;
let clipTextSession = null;

async function getClipImageSession() {
  if (!clipImageSession) {
    const modelPath = path.resolve(__dirname, '..', 'models', 'clip-image-vit-32-uint8.onnx');
    clipImageSession = await ort.InferenceSession.create(modelPath, {
      executionProviders: ['cpu']
    });
  }
  return clipImageSession;
}

async function getClipTextSession() {
  if (!clipTextSession) {
    const modelPath = path.resolve(__dirname, '..', 'models', 'clip-text-vit-32-uint8.onnx');
    clipTextSession = await ort.InferenceSession.create(modelPath, {
      executionProviders: ['cpu']
    });
  }
  return clipTextSession;
}

// ===== CLIP Image Preprocessing =====

/**
 * Preprocess image for CLIP ViT-B/32
 * Resize to 224x224, normalize with CLIP mean/std
 */
async function preprocessImage(imageInput) {
  let image;
  if (typeof imageInput === 'string') {
    image = await Jimp.read(imageInput);
  } else if (Buffer.isBuffer(imageInput)) {
    image = await Jimp.read(imageInput);
  } else {
    throw new Error('Unsupported image input type');
  }
  
  // Resize to 224x224 (CLIP's expected input)
  image.resize(224, 224);
  
  // CLIP normalization constants
  const mean = [0.48145466, 0.4578275, 0.40821073];
  const std = [0.26862954, 0.26130258, 0.27577711];
  
  const float32Data = new Float32Array(3 * 224 * 224);
  const totalPixels = 224 * 224;
  
  let p = 0;
  for (let y = 0; y < 224; y++) {
    for (let x = 0; x < 224; x++) {
      const idx = (y * 224 + x) * 4;
      const r = image.bitmap.data[idx] / 255.0;
      const g = image.bitmap.data[idx + 1] / 255.0;
      const b = image.bitmap.data[idx + 2] / 255.0;
      
      // NCHW format with normalization
      float32Data[p] = (r - mean[0]) / std[0];
      float32Data[totalPixels + p] = (g - mean[1]) / std[1];
      float32Data[2 * totalPixels + p] = (b - mean[2]) / std[2];
      p++;
    }
  }
  
  return new ort.Tensor('float32', float32Data, [1, 3, 224, 224]);
}

// ===== Core Functions =====

/**
 * Encode an image into a 512-dimensional CLIP embedding
 * @param {string|Buffer} imageInput - File path or Buffer
 * @returns {Float32Array} 512-dim embedding vector
 */
async function encodeImage(imageInput) {
  const startTime = Date.now();
  const session = await getClipImageSession();
  const tensor = await preprocessImage(imageInput);
  
  const results = await session.run({ input: tensor });
  const embedding = results.output.data;
  
  // L2 normalize the embedding
  const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
  const normalized = new Float32Array(embedding.length);
  for (let i = 0; i < embedding.length; i++) {
    normalized[i] = embedding[i] / norm;
  }
  
  return {
    embedding: Array.from(normalized),
    inferenceTimeMs: Date.now() - startTime,
    dimensions: 512
  };
}

/**
 * Encode text into a 512-dimensional CLIP embedding
 * @param {string} text - Description text
 * @returns {Float32Array} 512-dim embedding vector
 */
async function encodeText(text) {
  const startTime = Date.now();
  const session = await getClipTextSession();
  
  const tokenIds = tokenize(text);
  const tensor = new ort.Tensor('int32', tokenIds, [1, 77]);
  
  const results = await session.run({ input: tensor });
  const embedding = results.output.data;
  
  // L2 normalize
  const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
  const normalized = new Float32Array(embedding.length);
  for (let i = 0; i < embedding.length; i++) {
    normalized[i] = embedding[i] / norm;
  }
  
  return {
    embedding: Array.from(normalized),
    inferenceTimeMs: Date.now() - startTime,
    dimensions: 512
  };
}

/**
 * Compute cosine similarity between two embedding vectors
 */
function cosineSimilarity(embA, embB) {
  let dot = 0;
  for (let i = 0; i < embA.length; i++) {
    dot += embA[i] * embB[i];
  }
  return dot; // Already L2-normalized, so dot product = cosine similarity
}

/**
 * Compare an image against multiple text descriptions
 * Returns similarity scores for each text
 */
async function compareImageToTexts(imageInput, texts) {
  const startTime = Date.now();
  
  const imageResult = await encodeImage(imageInput);
  const imageEmb = imageResult.embedding;
  
  const scores = [];
  for (const text of texts) {
    const textResult = await encodeText(text);
    const similarity = cosineSimilarity(imageEmb, textResult.embedding);
    scores.push({
      text,
      similarity: parseFloat(similarity.toFixed(4))
    });
  }
  
  scores.sort((a, b) => b.similarity - a.similarity);
  
  return {
    scores,
    totalTimeMs: Date.now() - startTime
  };
}

module.exports = {
  encodeImage,
  encodeText,
  cosineSimilarity,
  compareImageToTexts,
  tokenize
};
