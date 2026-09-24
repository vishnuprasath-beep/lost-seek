const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sourceImagePath = path.resolve(__dirname, '../lostseek-logo.png');
const resDir = path.resolve(__dirname, '../android/app/src/main/res');

const densities = [
  { name: 'mipmap-mdpi', size: 48, fgSize: 108 },
  { name: 'mipmap-hdpi', size: 72, fgSize: 162 },
  { name: 'mipmap-xhdpi', size: 96, fgSize: 216 },
  { name: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
  { name: 'mipmap-xxxhdpi', size: 192, fgSize: 432 }
];

async function run() {
  console.log('Generating exact Android launcher icons from:', sourceImagePath);

  // Check source image exists
  if (!fs.existsSync(sourceImagePath)) {
    throw new Error('Source image not found at ' + sourceImagePath);
  }

  // First, extract the trimmed logo artwork so we know its bounding box
  const trimmedBuffer = await sharp(sourceImagePath).trim().toBuffer();
  const trimmedMeta = await sharp(trimmedBuffer).metadata();
  console.log('Trimmed logo size:', trimmedMeta.width, 'x', trimmedMeta.height);

  for (const d of densities) {
    const dir = path.join(resDir, d.name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // 1. LEGACY SQUARE ICON (ic_launcher.png)
    // Scale trimmed logo to fit 82% of d.size on a crisp white background
    const legacyLogoSize = Math.round(d.size * 0.82);
    const legacyLogo = await sharp(trimmedBuffer)
      .resize(legacyLogoSize, legacyLogoSize, { fit: 'inside' })
      .toBuffer();

    await sharp({
      create: {
        width: d.size,
        height: d.size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([{ input: legacyLogo, gravity: 'center' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    // 2. ROUND ICON (ic_launcher_round.png)
    // Masked circle on white background with the logo centered
    const roundLogoSize = Math.round(d.size * 0.76);
    const roundLogo = await sharp(trimmedBuffer)
      .resize(roundLogoSize, roundLogoSize, { fit: 'inside' })
      .toBuffer();

    const r = d.size / 2;
    const circleMaskSvg = Buffer.from(
      `<svg width="${d.size}" height="${d.size}"><circle cx="${r}" cy="${r}" r="${r}" fill="#fff"/></svg>`
    );

    const roundBase = await sharp({
      create: {
        width: d.size,
        height: d.size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([
        { input: roundLogo, gravity: 'center' },
        { input: circleMaskSvg, blend: 'dest-in' }
      ])
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    // 3. ADAPTIVE FOREGROUND (ic_launcher_foreground.png)
    // Canvas is fgSize x fgSize (108dp equivalent).
    // Safe viewport diameter is 66-72dp (approx 66% of fgSize).
    // Logo scaled to ~68% of fgSize on a transparent canvas.
    const fgLogoSize = Math.round(d.fgSize * 0.68);
    const fgLogo = await sharp(trimmedBuffer)
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
      .composite([{ input: fgLogo, gravity: 'center' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));

    console.log(`✓ Generated icons for ${d.name} (${d.size}x${d.size}, fg: ${d.fgSize}x${d.fgSize})`);
  }

  // Also update colors.xml background to #ffffff for crisp white adaptive background
  const colorsXmlPath = path.join(resDir, 'values/colors.xml');
  const colorsXmlContent = `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#ffffff</color>\n</resources>\n`;
  fs.writeFileSync(colorsXmlPath, colorsXmlContent);
  console.log('✓ Updated colors.xml with white ic_launcher_background (#ffffff)');

  console.log('All exact launcher icons successfully generated!');
}

run().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
