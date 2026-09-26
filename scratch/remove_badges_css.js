const fs = require('fs');
const files = [
  'c:\\Users\\prakash c\\Desktop\\smart campus-pro\\styles.css',
  'c:\\Users\\prakash c\\Desktop\\smart campus-pro\\public\\styles.css'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove Badges Showcase
  content = content.replace(/\/\* Badges Showcase \*\/[\s\S]*?\/\* --------------------------------------------------------------------------/g, '/* --------------------------------------------------------------------------');
  
  // Remove Badges Item Card
  content = content.replace(/\/\* Badges Item Card \*\/[\s\S]*?\/\* Campus Heatmap Cell \*\//g, '/* Campus Heatmap Cell */');
  
  fs.writeFileSync(file, content);
  console.log('Removed gamification CSS from ' + file);
});
