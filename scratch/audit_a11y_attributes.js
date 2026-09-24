const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

console.log('=== AUDITING INDEX.HTML FOR ACCESSIBILITY ISSUES ===\n');

// 1. Buttons without text and without aria-label
const buttons = [...indexHtml.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)];
console.log(`Total buttons found: ${buttons.length}`);
let emptyButtons = 0;
buttons.forEach((b, i) => {
  const attrs = b[1];
  const body = b[2].replace(/<[^>]+>/g, '').trim();
  const hasAriaLabel = /aria-label\s*=\s*["'][^"']+["']/i.test(attrs);
  const hasTitle = /title\s*=\s*["'][^"']+["']/i.test(attrs);
  if (!body && !hasAriaLabel && !hasTitle) {
    emptyButtons++;
    console.log(`  [Empty Button] line ~${indexHtml.slice(0, b.index).split('\n').length}: <button ${attrs}>...`);
  }
});
console.log(`Buttons missing accessible names: ${emptyButtons}`);

// 2. Images missing alt
const images = [...indexHtml.matchAll(/<img\b([^>]*)>/gi)];
console.log(`\nTotal images found: ${images.length}`);
let missingAlt = 0;
images.forEach((img, i) => {
  const attrs = img[1];
  const hasAlt = /\balt\s*=\s*["'][^"']*["']/i.test(attrs);
  if (!hasAlt) {
    missingAlt++;
    console.log(`  [Missing alt] line ~${indexHtml.slice(0, img.index).split('\n').length}: <img ${attrs}>`);
  }
});
console.log(`Images missing alt: ${missingAlt}`);

// 3. Inputs missing label or aria-label
const inputs = [...indexHtml.matchAll(/<input\b([^>]*)>/gi)];
console.log(`\nTotal inputs found: ${inputs.length}`);
let unlabelledInputs = 0;
inputs.forEach((inp) => {
  const attrs = inp[1];
  if (/type\s*=\s*["']hidden["']/i.test(attrs)) return;
  const idMatch = attrs.match(/id\s*=\s*["']([^"']+)["']/i);
  const id = idMatch ? idMatch[1] : null;
  const hasAria = /aria-label\s*=\s*["'][^"']+["']/i.test(attrs) || /aria-labelledby\s*=\s*["'][^"']+["']/i.test(attrs);
  let hasAssociatedLabel = false;
  if (id) {
    const labelRegex = new RegExp(`<label[^>]*for\\s*=\\s*["']${id}["']`, 'i');
    hasAssociatedLabel = labelRegex.test(indexHtml);
  }
  if (!hasAria && !hasAssociatedLabel) {
    unlabelledInputs++;
    console.log(`  [Unlabelled Input] line ~${indexHtml.slice(0, inp.index).split('\n').length}: id="${id}"`);
  }
});
console.log(`Inputs missing accessible label: ${unlabelledInputs}`);

// 4. Selects missing label
const selects = [...indexHtml.matchAll(/<select\b([^>]*)>/gi)];
console.log(`\nTotal selects found: ${selects.length}`);
let unlabelledSelects = 0;
selects.forEach((sel) => {
  const attrs = sel[1];
  const idMatch = attrs.match(/id\s*=\s*["']([^"']+)["']/i);
  const id = idMatch ? idMatch[1] : null;
  const hasAria = /aria-label\s*=\s*["'][^"']+["']/i.test(attrs);
  let hasAssociatedLabel = false;
  if (id) {
    const labelRegex = new RegExp(`<label[^>]*for\\s*=\\s*["']${id}["']`, 'i');
    hasAssociatedLabel = labelRegex.test(indexHtml);
  }
  if (!hasAria && !hasAssociatedLabel) {
    unlabelledSelects++;
    console.log(`  [Unlabelled Select] line ~${indexHtml.slice(0, sel.index).split('\n').length}: id="${id}"`);
  }
});
console.log(`Selects missing accessible label: ${unlabelledSelects}`);
