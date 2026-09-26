const fs = require('fs');
const path = 'c:\\Users\\prakash c\\Desktop\\smart campus-pro\\public\\src\\16_analytics_dashboard___analytics_page__with_chart_js.js';
let lines = fs.readFileSync(path, 'utf8').split('\n');
lines = lines.slice(97); // Remove the first 97 lines (index 0 to 96)
// Wait, line 97 was "DO NOT DEPLOY TO PRODUCTION./* ="
lines[0] = '/*' + lines[0].split('/*')[1];
fs.writeFileSync(path, lines.join('\n'));
console.log('Fixed analytics js');
