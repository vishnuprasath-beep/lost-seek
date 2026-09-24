const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
console.log('Total lines in index.html:', lines.length);

lines.forEach((line, idx) => {
  if (line.includes('type="file"') || line.includes("type='file'") || line.includes('file-input') || line.includes('upload') || line.includes('camera')) {
    if (line.includes('<input') || line.includes('<button') || line.includes('id=')) {
      console.log(`L${idx + 1}: ${line.trim()}`);
    }
  }
});
