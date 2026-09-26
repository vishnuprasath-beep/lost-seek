const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Find inputs without associated labels or aria-labels
const inputRegex = /<input[^>]*>/gi;
let match;
while ((match = inputRegex.exec(html)) !== null) {
  const inputStr = match[0];
  if (inputStr.includes('type="hidden"')) continue;
  if (!inputStr.includes('id=')) continue;
  
  // check if there's a label for it, or aria-label
  if (!inputStr.includes('aria-label') && !inputStr.includes('aria-labelledby')) {
      const idMatch = inputStr.match(/id="([^"]+)"/);
      if (idMatch) {
          const id = idMatch[1];
          if (!html.includes(`for="${id}"`)) {
              console.log(`Input without label: ${id} -> ${inputStr}`);
          }
      }
  }
}

// Find images without alt
const imgRegex = /<img[^>]*>/gi;
while ((match = imgRegex.exec(html)) !== null) {
  const imgStr = match[0];
  if (!imgStr.includes('alt=')) {
      console.log(`Image without alt: ${imgStr}`);
  }
}

// Find buttons without text or aria-label
const btnRegex = /<button[^>]*>([\s\S]*?)<\/button>/gi;
while ((match = btnRegex.exec(html)) !== null) {
  const btnStr = match[0];
  const btnContent = match[1].replace(/<[^>]+>/g, '').trim();
  if (btnContent === '' && !btnStr.includes('aria-label') && !btnStr.includes('title')) {
      console.log(`Button without label: ${btnStr}`);
  }
}

// Links without text
const linkRegex = /<a[^>]*>([\s\S]*?)<\/a>/gi;
while ((match = linkRegex.exec(html)) !== null) {
  const linkStr = match[0];
  const linkContent = match[1].replace(/<[^>]+>/g, '').trim();
  if (linkContent === '' && !linkStr.includes('aria-label') && !linkStr.includes('title')) {
      console.log(`Link without label: ${linkStr}`);
  }
}

