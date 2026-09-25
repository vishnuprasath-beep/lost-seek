const db = require('./db.js');

const BUCKET_NAME = 'lostseek-images';
let bucketVerified = false;

async function ensureBucket() {
  if (bucketVerified) return;
  const supabase = db.getSupabase();
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('Error listing buckets:', error);
    return;
  }
  const exists = buckets.find(b => b.name === BUCKET_NAME);
  if (!exists) {
    await supabase.storage.createBucket(BUCKET_NAME, { public: true, fileSizeLimit: 10485760 });
  }
  bucketVerified = true;
}

/**
 * Checks if a string is a base64 image data URL. If so, uploads it to Supabase Storage
 * and returns the public URL. Otherwise, returns the original string.
 */
async function uploadIfBase64(imageStr, prefix = 'img') {
  if (!imageStr || typeof imageStr !== 'string' || !imageStr.startsWith('data:image/')) {
    return imageStr;
  }

  await ensureBucket();
  
  const matches = imageStr.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return imageStr;
  }

  const mimeType = matches[1];
  const extension = mimeType.split('/')[1].replace('+xml', '');
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  // Prevent giant images (10MB limit)
  if (buffer.length > 10 * 1024 * 1024) {
    throw new Error('Image size exceeds 10MB limit.');
  }

  const fileName = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}.${extension}`;
  
  const supabase = db.getSupabase();
  const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, buffer, {
    contentType: mimeType,
    upsert: false
  });

  if (error) {
    console.error('Supabase Storage upload error:', error.message);
    throw new Error('Failed to upload image.');
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}

module.exports = {
  uploadIfBase64
};
