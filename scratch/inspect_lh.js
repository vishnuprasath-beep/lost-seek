const fs = require('fs');

const d = JSON.parse(fs.readFileSync('lh-mobile.json', 'utf8'));

if (d.audits['largest-contentful-paint-element'] && d.audits['largest-contentful-paint-element'].details && d.audits['largest-contentful-paint-element'].details.items.length > 0) {
    console.log('LCP Element:', d.audits['largest-contentful-paint-element'].details.items[0].node.snippet);
} else {
    console.log('LCP Element not clearly defined in JSON.');
}

console.log('Main Thread Work (ms):', d.audits['mainthread-work-breakdown'] ? d.audits['mainthread-work-breakdown'].numericValue : 'N/A');
console.log('Bootup Time (ms):', d.audits['bootup-time'] ? d.audits['bootup-time'].numericValue : 'N/A');
console.log('Performance Score:', d.categories.performance.score * 100);
console.log('LCP (ms):', d.audits['largest-contentful-paint'] ? d.audits['largest-contentful-paint'].numericValue : 'N/A');
console.log('TBT (ms):', d.audits['total-blocking-time'] ? d.audits['total-blocking-time'].numericValue : 'N/A');
console.log('Transfer size:', d.audits['total-byte-weight'] ? d.audits['total-byte-weight'].numericValue : 'N/A');
