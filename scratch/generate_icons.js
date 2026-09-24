const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const logoPath = path.resolve(__dirname, '../assets/images/lostseek-logo.png');
const resDir = path.resolve(__dirname, '../android/app/src/main/res');

const densities = [
  { name: 'mipmap-mdpi', size: 48, fgSize: 108 },
  { name: 'mipmap-hdpi', size: 72, fgSize: 162 },
  { name: 'mipmap-xhdpi', size: 96, fgSize: 216 },
  { name: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
  { name: 'mipmap-xxxhdpi', size: 192, fgSize: 432 }
];

async function run() {
  console.log('Generating Android icon resources from', logoPath);
  for (const d of densities) {
    const dir = path.join(resDir, d.name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // 1. Standard square launcher icon
    await sharp(logoPath)
      .resize(d.size, d.size)
      .toFile(path.join(dir, 'ic_launcher.png'));

    // 2. Round launcher icon with circular mask
    const r = d.size / 2;
    const circleSvg = Buffer.from(`<svg width="${d.size}" height="${d.size}"><circle cx="${r}" cy="${r}" r="${r}" fill="#fff"/></svg>`);
    await sharp(logoPath)
      .resize(d.size, d.size)
      .composite([{ input: circleSvg, blend: 'dest-in' }])
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    // 3. Foreground for adaptive icon (scaled to 72% with transparent padding)
    const iconInner = Math.round(d.fgSize * 0.72);
    const padding = Math.round((d.fgSize - iconInner) / 2);
    const innerBuf = await sharp(logoPath).resize(iconInner, iconInner).toBuffer();
    await sharp({
      create: {
        width: d.fgSize,
        height: d.fgSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: innerBuf, top: padding, left: padding }])
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));

    console.log('Created icons for:', d.name);
  }

  // 4. Create anydpi-v26 for Android 8.0+ adaptive icons
  const anydpiDir = path.join(resDir, 'mipmap-anydpi-v26');
  if (!fs.existsSync(anydpiDir)) fs.mkdirSync(anydpiDir, { recursive: true });

  const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;

  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveXml);
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveXml);
  console.log('Created adaptive icons in mipmap-anydpi-v26');

  // 5. Background color in values/colors.xml
  const valuesDir = path.join(resDir, 'values');
  const colorsXmlPath = path.join(valuesDir, 'colors.xml');
  const bgLine = '    <color name="ic_launcher_background">#0b0f19</color>';
  if (fs.existsSync(colorsXmlPath)) {
    let existing = fs.readFileSync(colorsXmlPath, 'utf8');
    if (!existing.includes('ic_launcher_background')) {
      existing = existing.replace('</resources>', `${bgLine}\n</resources>`);
      fs.writeFileSync(colorsXmlPath, existing);
    }
  } else {
    fs.writeFileSync(colorsXmlPath, `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n${bgLine}\n</resources>\n`);
  }

  // 6. Replace drawable/ic_launcher.png with real logo
  const drawableDir = path.join(resDir, 'drawable');
  await sharp(logoPath).resize(192, 192).toFile(path.join(drawableDir, 'ic_launcher.png'));
  console.log('Updated drawable/ic_launcher.png');

  // 7. Remove old stale vector ic_launcher.xml in drawable
  const oldDrawableXml = path.join(drawableDir, 'ic_launcher.xml');
  if (fs.existsSync(oldDrawableXml)) {
    fs.unlinkSync(oldDrawableXml);
    console.log('Removed old stale drawable/ic_launcher.xml vector');
  }

  console.log('ALL ANDROID LAUNCHER ICONS SUCCESSFULLY GENERATED!');
}

run().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
