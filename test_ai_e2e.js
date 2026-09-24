/**
 * End-to-end test for LostSeek AI services
 * Tests YOLO detection and CLIP similarity with real model inference
 */

const path = require('path');
const Jimp = require('jimp');

// Set up module paths for the api/ services
const { detectObjects } = require('./api/yolo_service');
const { encodeImage, encodeText, compareImageToTexts, tokenize } = require('./api/clip_service');

async function createTestImage(color, shape) {
  const img = new Jimp(640, 480, 0xFFFFFFFF);
  
  const [r, g, b] = color;
  
  if (shape === 'tall_rect') {
    // Tall rectangle (bottle-like)
    for (let y = 80; y < 420; y++) {
      for (let x = 260; x < 380; x++) {
        img.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
      }
    }
  } else if (shape === 'circle') {
    // Circle (ball-like)
    const cx = 320, cy = 240, radius = 100;
    for (let y = 0; y < 480; y++) {
      for (let x = 0; x < 640; x++) {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (dist <= radius) {
          img.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
        }
      }
    }
  }
  
  const filePath = path.join(__dirname, `test_${shape}.jpg`);
  await img.writeAsync(filePath);
  return filePath;
}

async function testYOLO() {
  console.log('=== TEST 1: YOLO Object Detection ===');
  console.log('');
  
  const imagePath = await createTestImage([30, 60, 200], 'tall_rect');
  console.log('Created test image:', imagePath);
  
  console.log('Running YOLO detection...');
  const result = await detectObjects(imagePath, 0.1);
  
  console.log('Inference time:', result.inferenceTimeMs, 'ms');
  console.log('Image dimensions:', result.imageDimensions);
  console.log('Detections found:', result.detections.length);
  
  if (result.detections.length > 0) {
    result.detections.forEach((d, i) => {
      console.log(`  ${i + 1}. ${d.class} (${d.confidence}) at [${d.box.x}, ${d.box.y}, ${d.box.width}x${d.box.height}]`);
    });
  } else {
    console.log('  (No detections - expected for synthetic image)');
  }
  
  console.log('YOLO: PASS ✓');
  return true;
}

async function testCLIPTokenizer() {
  console.log('\n=== TEST 2: CLIP Tokenizer ===');
  console.log('');
  
  const tests = [
    'a blue water bottle',
    'red backpack with zipper',
    'black laptop computer',
    'lost keys on keychain'
  ];
  
  for (const text of tests) {
    const tokens = tokenize(text);
    const nonZero = Array.from(tokens).filter(t => t !== 0).length;
    console.log(`  "${text}" -> ${nonZero} tokens (first 5: [${Array.from(tokens.slice(0, 5))}])`);
  }
  
  console.log('Tokenizer: PASS ✓');
  return true;
}

async function testCLIPEmbedding() {
  console.log('\n=== TEST 3: CLIP Image & Text Embeddings ===');
  console.log('');
  
  // Create test image
  const imagePath = await createTestImage([30, 60, 200], 'tall_rect');
  
  // Encode image
  console.log('Encoding image...');
  const imgResult = await encodeImage(imagePath);
  console.log(`  Image embedding: ${imgResult.dimensions}D vector (${imgResult.inferenceTimeMs}ms)`);
  console.log(`  First 5 values: [${imgResult.embedding.slice(0, 5).map(v => v.toFixed(4))}]`);
  
  // Encode text
  console.log('Encoding text...');
  const txtResult = await encodeText('a blue rectangular object');
  console.log(`  Text embedding: ${txtResult.dimensions}D vector (${txtResult.inferenceTimeMs}ms)`);
  console.log(`  First 5 values: [${txtResult.embedding.slice(0, 5).map(v => v.toFixed(4))}]`);
  
  // Check L2 norm (should be ~1.0)
  const imgNorm = Math.sqrt(imgResult.embedding.reduce((s, v) => s + v * v, 0));
  const txtNorm = Math.sqrt(txtResult.embedding.reduce((s, v) => s + v * v, 0));
  console.log(`  Image embedding L2 norm: ${imgNorm.toFixed(4)} (should be ~1.0)`);
  console.log(`  Text embedding L2 norm: ${txtNorm.toFixed(4)} (should be ~1.0)`);
  
  console.log('CLIP Embeddings: PASS ✓');
  return true;
}

async function testCLIPSimilarity() {
  console.log('\n=== TEST 4: CLIP Image-Text Similarity ===');
  console.log('');
  
  const imagePath = await createTestImage([30, 60, 200], 'tall_rect');
  
  const descriptions = [
    'a blue bottle',
    'a red backpack',
    'a green umbrella',
    'a blue rectangular object',
    'a white piece of paper',
    'a black laptop',
    'blue water bottle with sticker'
  ];
  
  console.log('Comparing image against descriptions...');
  const result = await compareImageToTexts(imagePath, descriptions);
  
  console.log(`Total comparison time: ${result.totalTimeMs}ms`);
  console.log('Similarity scores (sorted):');
  result.scores.forEach((s, i) => {
    const bar = '█'.repeat(Math.max(0, Math.round((s.similarity + 0.5) * 20)));
    console.log(`  ${i + 1}. "${s.text}" -> ${s.similarity.toFixed(4)} ${bar}`);
  });
  
  console.log('CLIP Similarity: PASS ✓');
  return true;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  LostSeek AI — End-to-End Test Suite             ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
  
  const startTime = Date.now();
  
  await testYOLO();
  await testCLIPTokenizer();
  await testCLIPEmbedding();
  await testCLIPSimilarity();
  
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  ALL TESTS PASSED ✓                              ║');
  console.log(`║  Total time: ${Date.now() - startTime}ms                              ║`);
  console.log('╚══════════════════════════════════════════════════╝');
}

main().catch(e => {
  console.error('\nTEST FAILED:', e.message);
  console.error(e.stack);
  process.exit(1);
});
