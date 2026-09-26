const fs = require('fs');

const fixFile = (path) => {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/\\n/g, '\n');
  fs.writeFileSync(path, content);
};

fixFile('c:\\Users\\prakash c\\Desktop\\smart campus-pro\\public\\src\\0_core.js');
fixFile('c:\\Users\\prakash c\\Desktop\\smart campus-pro\\public\\src\\16_analytics_dashboard___analytics_page__with_chart_js.js');

// HTML files already use \n correctly? Let's check if they have literal \n
const htmlFiles = [
  'c:\\Users\\prakash c\\Desktop\\smart campus-pro\\index.html',
  'c:\\Users\\prakash c\\Desktop\\smart campus-pro\\story.html',
  'c:\\Users\\prakash c\\Desktop\\smart campus-pro\\200.html',
  'c:\\Users\\prakash c\\Desktop\\smart campus-pro\\public\\index.html',
  'c:\\Users\\prakash c\\Desktop\\smart campus-pro\\public\\story.html',
  'c:\\Users\\prakash c\\Desktop\\smart campus-pro\\public\\200.html'
];
htmlFiles.forEach(fixFile);
