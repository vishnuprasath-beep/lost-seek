const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');

const headings = indexHtml.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/g) || [];
for (let i = 0; i < Math.min(30, headings.length); i++) {
    console.log(headings[i]);
}
