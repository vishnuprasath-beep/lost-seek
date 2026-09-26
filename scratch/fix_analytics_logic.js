const fs = require('fs');
const path = 'c:\\Users\\prakash c\\Desktop\\smart campus-pro\\public\\src\\16_analytics_dashboard___analytics_page__with_chart_js.js';

let content = fs.readFileSync(path, 'utf8');

// Replace Top Loss Locations calculation
const topLossLocationsRegex = /const zones = \[[^]*?\];[\s\S]*?const zoneCountsData = zones\.map\(z => \(\{\s*name: z,\s*count: allItems\.filter\(i => i\.location && i\.location\.toLowerCase\(\)\.includes\(z\.toLowerCase\(\)\)\)\.length\s*\}\)\);/g;

const topLossReplacement = `const zoneCountsData = CAMPUS_LOCATIONS.map(c => c.name).map(z => ({
      name: z,
      count: allItems.filter(i => normalizeLocationName(i.location) === normalizeLocationName(z)).length
    }));`;

content = content.replace(topLossLocationsRegex, topLossReplacement);


// Replace Campus Heatmap logic
const campusHeatmapRegex = /const campusZones = \[[^]*?\];[\s\S]*?const allItems = \[\.\.\.appState\.lostReports, \.\.\.appState\.foundReports\];[\s\S]*?container\.innerHTML = campusZones\.map\(zone => \{\s*const count = allItems\.filter\(i => i\.location && i\.location\.toLowerCase\(\)\.includes\(zone\.name\.toLowerCase\(\)\)\)\.length;/g;

const campusHeatmapReplacement = `const categoryIcons = {
      'Academic & Administrative': '🏢',
      'Services': '📍',
      'Hostel / House Areas': '🏠',
      'Recreation': '📍',
      'Food & Dining': '☕',
      'Unknown': '📍'
    };
    const campusZones = CAMPUS_LOCATIONS.map(c => ({ name: c.name, icon: categoryIcons[c.category] || '📍', desc: c.status }));

    const allItems = [...appState.lostReports, ...appState.foundReports];

    container.innerHTML = campusZones.map(zone => {
      const count = allItems.filter(i => normalizeLocationName(i.location) === normalizeLocationName(zone.name)).length;`;

content = content.replace(campusHeatmapRegex, campusHeatmapReplacement);

fs.writeFileSync(path, content);
console.log('Fixed analytics script.');
