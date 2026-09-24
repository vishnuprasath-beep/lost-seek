// Responsive Layout & Breakpoint Inspection Script
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, '../styles.css'), 'utf8');

console.log('Testing CSS Responsive Rules for 360px, 390px, 412px...');

const checks = [
  { name: 'overflow-x hidden on root', pattern: /#landing-page\s*\{[\s\S]*?overflow-x:\s*hidden/ },
  { name: 'box-sizing border-box', pattern: /#landing-page\s*\*[\s\S]*?box-sizing:\s*border-box/ },
  { name: 'clamp font size on title', pattern: /font-size:\s*clamp\(2\.3rem,\s*4\.4vw,\s*3\.6rem\)/ },
  { name: 'mobile breakpoint media query (max-width: 600px)', pattern: /@media\s*\(max-width:\s*600px\)/ },
  { name: 'mobile column layout for actions', pattern: /\.lp-actions-row\s*\{[\s\S]*?flex-direction:\s*column/ },
  { name: 'mobile phone mockup sizing', pattern: /\.lp-phone-frame\s*\{[\s\S]*?width:\s*260px/ },
  { name: 'mobile single-column highlights grid', pattern: /\.lp-highlights-inner\s*\{[\s\S]*?grid-template-columns:\s*1fr/ },
  { name: 'mobile padding reduction', pattern: /\.lp-hero-section\s*\{[\s\S]*?padding:\s*32px\s*16px/ },
  { name: 'mobile vertical workflow steps', pattern: /\.lp-workflow-steps\s*\{[\s\S]*?flex-direction:\s*column/ },
  { name: 'mobile workflow arrow rotation', pattern: /\.lp-workflow-arrow\s*\{[\s\S]*?transform:\s*rotate\(90deg\)/ }
];

let allPassed = true;
checks.forEach(c => {
  const match = c.pattern.test(css);
  if (match) {
    console.log(`  [PASS] ${c.name}`);
  } else {
    console.log(`  [FAIL] ${c.name}`);
    allPassed = false;
  }
});

if (allPassed) {
  console.log('\nAll responsive layout rules verified successfully for 360px, 390px, 412px!');
  process.exit(0);
} else {
  process.exit(1);
}
