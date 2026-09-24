const fs = require('fs');
const app = fs.readFileSync('app.js', 'utf8');

console.log('--- Checking handleLostSubmit ---');
const m1 = app.match(/function handleLostSubmit[\s\S]*?\n\}/);
if (m1) console.log(m1[0].slice(0, 600));

console.log('--- Checking handleFoundSubmit ---');
const m2 = app.match(/function handleFoundSubmit[\s\S]*?\n\}/);
if (m2) console.log(m2[0].slice(0, 600));
