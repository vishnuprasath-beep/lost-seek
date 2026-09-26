const fs = require('fs');

const fixQuotes = (path) => {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/'Boys\\' Hostel'/g, '"Boys\' Hostel"');
  content = content.replace(/'Girls\\' Hostel'/g, '"Girls\' Hostel"');
  content = content.replace(/'Women\\'s Arts'/g, '"Women\'s Arts"');
  fs.writeFileSync(path, content);
};

fixQuotes('c:\\Users\\prakash c\\Desktop\\smart campus-pro\\public\\src\\0_core.js');
fixQuotes('c:\\Users\\prakash c\\Desktop\\smart campus-pro\\public\\src\\16_analytics_dashboard___analytics_page__with_chart_js.js');
