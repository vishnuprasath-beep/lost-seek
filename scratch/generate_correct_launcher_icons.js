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
  console.log('Generating Android icon resources from:', logoPath);

  // 1. First, trim the logo so we have the pure logo artwork without extraneous empty border
  const trimmedLogoBuffer = await sharp(logoPath).trim().toBuffer();

  for (const d of densities) {
    const dir = path.join(resDir, d.name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Target logo size inside legacy square & round icons (approx 72% of canvas)
    const legacyLogoSize = Math.round(d.size * 0.72);
    const legacyPadding = Math.round((d.size - legacyLogoSize) / 2);
    const legacyLogoResized = await sharp(trimmedLogoBuffer)
      .resize(legacyLogoSize, legacyLogoSize, { fit: 'inside' })
      .toBuffer();

    // 1. Standard square launcher icon with LostSeek dark brand background (#0b0f19)
    await sharp({
      create: {
        width: d.size,
        height: d.size,
        channels: 4,
        background: { r: 11, g: 15, b: 25, alpha: 1 }
      }
    })
      .composite([{ input: legacyLogoResized, gravity: 'center' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    // 2. Round launcher icon with circular LostSeek dark brand background (#0b0f19)
    const r = d.size / 2;
    const circleMaskSvg = Buffer.from(
      `<svg width="${d.size}" height="${d.size}"><circle cx="${r}" cy="${r}" r="${r}" fill="#fff"/></svg>`
    );
    const roundBase = await sharp({
      create: {
        width: d.size,
        height: d.size,
        channels: 4,
        background: { r: 11, g: 15, b: 25, alpha: 1 }
      }
    })
      .composite([
        { input: legacyLogoResized, gravity: 'center' },
        { input: circleMaskSvg, blend: 'dest-in' }
      ])
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    // 3. Foreground for adaptive icon (scaled to 70% of 108dp viewport, centered, transparent background)
    const fgLogoSize = Math.round(d.fgSize * 0.70);
    const fgLogoResized = await sharp(trimmedLogoBuffer)
      .resize(fgLogoSize, fgLogoSize, { fit: 'inside' })
      .toBuffer();

    await sharp({
      create: {
        width: d.fgSize,
        height: d.fgSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: fgLogoResized, gravity: 'center' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));

    console.log(`Generated all icons for density: ${d.name} (${d.size}x${d.size}, fg: ${d.fgSize}x${d.fgSize})`);
  }

  // 4. Adaptive icon definitions in mipmap-anydpi-v26
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

  // 5. Ensure background color in values/colors.xml
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

  // 6. Remove stale drawable/ic_launcher.png to avoid resource type confusion
  const drawableIcon = path.join(resDir, 'drawable', 'ic_launcher.png');
  if (fs.existsSync(drawableIcon)) {
    fs.unlinkSync(drawableIcon);
    console.log('Removed stale drawable/ic_launcher.png');
  }

  console.log('SUCCESS: All Android launcher icons generated perfectly!');
}

run().catch(err => {
  console.error('Failed to generate launcher icons:', err);
  process.exit(1);
});
