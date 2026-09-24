const { detectObjects } = require('../api/yolo_service.js');
const path = require('path');

async function runTest() {
  console.log('====================================');
  console.log('TESTING REAL YOLOv5n ONNX INFERENCE');
  console.log('====================================');

  const testImagePath = path.resolve(__dirname, 'real_bottle.jpg');
  console.log('Input Image:', testImagePath);

  const result = await detectObjects(testImagePath, 0.25);
  console.log('\nActual YOLO Inference Output:');
  console.log(JSON.stringify(result, null, 2));

  console.log('\nSummary:');
  console.log(`Detections found: ${result.detections.length}`);
  console.log(`Inference time: ${result.inferenceTimeMs} ms`);

  if (result.detections.length > 0 && result.detections.some(d => d.class === 'bottle')) {
    console.log('\n>>> YOLO REAL INFERENCE: PASS <<<');
  } else {
    console.log('\n>>> YOLO REAL INFERENCE: VERIFY <<<');
  }
}

runTest().catch(err => {
  console.error('YOLO Test Failed:', err);
  process.exit(1);
});
