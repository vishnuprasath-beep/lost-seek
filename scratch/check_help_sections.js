const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
console.log('Includes help-safety-page:', html.includes('id="help-safety-page"'));
console.log('Includes admin-help-page:', html.includes('id="admin-help-page"'));
console.log('Includes item-help-modal:', html.includes('id="item-help-modal"'));
console.log('Includes admin-settings-contacts-card:', html.includes('id="admin-settings-contacts-card"'));
