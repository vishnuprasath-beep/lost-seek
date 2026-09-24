const ort = require('onnxruntime-node');
const Jimp = require('jimp');
const path = require('path');

// COCO 80 class labels
const COCO_CLASSES = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat', 'traffic light',
  'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
  'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
  'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard',
  'tennis racket', 'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
  'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
  'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone',
  'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear',
  'hair drier', 'toothbrush'
];

async function preprocess(imageInput, targetWidth = 640, targetHeight = 640) {
  let image;
  if (typeof imageInput === 'string') {
    image = await Jimp.read(imageInput);
  } else if (Buffer.isBuffer(imageInput)) {
    image = await Jimp.read(imageInput);
  } else {
    throw new Error('Unsupported image input type');
  }

  const origWidth = image.bitmap.width;
  const origHeight = image.bitmap.height;

  image.resize(targetWidth, targetHeight);

  const float32Data = new Float32Array(3 * targetWidth * targetHeight);
  const totalPixels = targetWidth * targetHeight;

  let p = 0;
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const idx = (y * targetWidth + x) * 4;
      const r = image.bitmap.data[idx] / 255.0;
      const g = image.bitmap.data[idx + 1] / 255.0;
      const b = image.bitmap.data[idx + 2] / 255.0;

      // NCHW format: [1, 3, 640, 640]
      float32Data[p] = r;
      float32Data[totalPixels + p] = g;
      float32Data[2 * totalPixels + p] = b;
      p++;
    }
  }

  const tensor = new ort.Tensor('float32', float32Data, [1, 3, targetHeight, targetWidth]);
  return { tensor, origWidth, origHeight };
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function iou(boxA, boxB) {
  const xA = Math.max(boxA.x, boxB.x);
  const yA = Math.max(boxA.y, boxB.y);
  const xB = Math.min(boxA.x + boxA.width, boxB.x + boxB.width);
  const yB = Math.min(boxA.y + boxA.height, boxB.y + boxB.height);

  const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
  const boxAArea = boxA.width * boxA.height;
  const boxBArea = boxB.width * boxB.height;

  return interArea / (boxAArea + boxBArea - interArea + 1e-6);
}

function nonMaxSuppression(boxes, iouThreshold = 0.45) {
  boxes.sort((a, b) => b.confidence - a.confidence);
  const picked = [];

  for (const box of boxes) {
    let keep = true;
    for (const p of picked) {
      if (p.class === box.class && iou(p.box, box.box) > iouThreshold) {
        keep = false;
        break;
      }
    }
    if (keep) picked.push(box);
  }
  return picked;
}

let yoloSession = null;

async function getYOLOSession() {
  if (!yoloSession) {
    const modelPath = path.resolve(__dirname, '..', 'models', 'yolov5n_fp32.onnx');
    yoloSession = await ort.InferenceSession.create(modelPath, {
      executionProviders: ['cpu']
    });
  }
  return yoloSession;
}

async function detectObjects(imageInput, confThreshold = 0.25) {
  const startTime = Date.now();
  const session = await getYOLOSession();
  const { tensor, origWidth, origHeight } = await preprocess(imageInput);

  const feeds = { [session.inputNames[0]]: tensor };
  const results = await session.run(feeds);
  const output = results[session.outputNames[0]];

  // Output shape for YOLOv5 is typically [1, 25200, 85] (cx, cy, w, h, obj_conf, 80 class probs)
  const dims = output.dims;
  const data = output.data;
  const numDetections = dims[1];
  const numFeatures = dims[2]; // 85

  const detections = [];
  const scaleX = origWidth / 640;
  const scaleY = origHeight / 640;

  for (let i = 0; i < numDetections; i++) {
    const offset = i * numFeatures;
    const objConf = data[offset + 4];

    if (objConf < confThreshold) continue;

    // Find highest class prob
    let maxProb = 0;
    let maxClassId = 0;
    for (let c = 5; c < numFeatures; c++) {
      const prob = data[offset + c];
      if (prob > maxProb) {
        maxProb = prob;
        maxClassId = c - 5;
      }
    }

    const confidence = objConf * maxProb;
    if (confidence >= confThreshold) {
      const cx = data[offset];
      const cy = data[offset + 1];
      const w = data[offset + 2];
      const h = data[offset + 3];

      const x = Math.max(0, Math.round((cx - w / 2) * scaleX));
      const y = Math.max(0, Math.round((cy - h / 2) * scaleY));
      const width = Math.min(origWidth - x, Math.round(w * scaleX));
      const height = Math.min(origHeight - y, Math.round(h * scaleY));

      detections.push({
        class: COCO_CLASSES[maxClassId] || `class_${maxClassId}`,
        confidence: parseFloat(confidence.toFixed(4)),
        box: { x, y, width, height }
      });
    }
  }

  const filtered = nonMaxSuppression(detections, 0.45);
  const inferenceTime = Date.now() - startTime;

  return {
    detections: filtered,
    inferenceTimeMs: inferenceTime,
    imageDimensions: { width: origWidth, height: origHeight }
  };
}

module.exports = {
  detectObjects,
  COCO_CLASSES
};
