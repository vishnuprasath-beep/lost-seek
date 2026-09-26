const fs = require('fs');

const path = 'c:\\Users\\prakash c\\Desktop\\smart campus-pro\\public\\src\\16_analytics_dashboard___analytics_page__with_chart_js.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/'Boys\\\\' Hostel'/g, '"Boys\' Hostel"');
content = content.replace(/'Girls\\\\' Hostel'/g, '"Girls\' Hostel"');
content = content.replace(/'Women\\\\'s Arts'/g, '"Women\'s Arts"');
// Fallback if they were already written as 'Boys\' Hostel' literally
content = content.split("'Boys\\\\' Hostel'").join('"Boys\' Hostel"');
content = content.split("'Girls\\\\' Hostel'").join('"Girls\' Hostel"');
content = content.split("'Women\\\\'s Arts'").join('"Women\'s Arts"');

// And if they are just Boys\' Hostel
content = content.replace(/'Boys\\' Hostel'/g, '"Boys\' Hostel"');
content = content.replace(/'Girls\\' Hostel'/g, '"Girls\' Hostel"');
content = content.replace(/'Women\\'s Arts'/g, '"Women\'s Arts"');

fs.writeFileSync(path, content);
console.log('Fixed quotes in 16');

