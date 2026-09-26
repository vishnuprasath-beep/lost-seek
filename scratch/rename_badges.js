const fs = require('fs');
const path = require('path');

const srcDir = 'c:\\Users\\prakash c\\Desktop\\smart campus-pro\\public\\src';
const files = fs.readdirSync(srcDir);

files.forEach(f => {
  if (f.endsWith('.js')) {
    const fullPath = path.join(srcDir, f);
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;
    
    if (content.includes('updateBadges')) {
      content = content.replace(/updateBadges/g, 'updateIndicatorPills');
      changed = true;
    }
    
    if (content.includes('updateAdminMetricsAndBadges')) {
      content = content.replace(/updateAdminMetricsAndBadges/g, 'updateAdminMetricsAndPills');
      changed = true;
    }
    
    if (changed) {
      fs.writeFileSync(fullPath, content);
      console.log('Updated ' + f);
    }
  }
});
console.log('Badge terminology replaced.');
