const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '../public/app.js');
const srcDir = path.join(__dirname, '../public/src');

if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir, { recursive: true });
}

const content = fs.readFileSync(appJsPath, 'utf8');
const lines = content.split('\n');

let currentSectionName = 'core';
let currentSectionLines = [];
let sections = {};

const sectionRegex = /\/\*\s*={10,}\s*\n\s*(.*?)\s*\n\s*={10,}\s*\*\//g;

// A simpler way: split by the top-level comment block pattern
let currentBuffer = [];
let fileIndex = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith('/* ==========================================================================')) {
    // Found a section start
    if (currentBuffer.length > 0) {
      sections[`${fileIndex}_${currentSectionName}`] = currentBuffer.join('\n');
      currentBuffer = [];
      fileIndex++;
    }
    // The next line contains the name
    if (i + 1 < lines.length) {
      let name = lines[i + 1].replace(/\*/g, '').trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      if (!name) name = 'section';
      currentSectionName = name;
    }
  }
  currentBuffer.push(line);
}
if (currentBuffer.length > 0) {
  sections[`${fileIndex}_${currentSectionName}`] = currentBuffer.join('\n');
}

console.log(`Found ${Object.keys(sections).length} sections.`);
for (const [name, data] of Object.entries(sections)) {
  const filename = path.join(srcDir, `${name}.js`);
  fs.writeFileSync(filename, data, 'utf8');
  console.log(`Wrote ${filename} (${data.split('\n').length} lines)`);
}

console.log("Done splitting.");
