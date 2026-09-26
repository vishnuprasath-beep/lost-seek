const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\Users\\prakash c\\Desktop\\smart campus-pro';

const campusLocationsData = [
  // OFFICIALLY VERIFIED - Blocks
  { name: 'Administrative Block', category: 'Academic & Administrative', status: 'OFFICIALLY VERIFIED' },
  { name: 'Academic Block', category: 'Academic & Administrative', status: 'OFFICIALLY VERIFIED' },
  { name: 'A Block', category: 'Academic & Administrative', status: 'OFFICIALLY VERIFIED' },
  { name: 'B Block', category: 'Academic & Administrative', status: 'OFFICIALLY VERIFIED' },
  { name: 'C Block', category: 'Academic & Administrative', status: 'OFFICIALLY VERIFIED' },
  { name: 'D Block', category: 'Academic & Administrative', status: 'OFFICIALLY VERIFIED' },
  { name: 'E Block', category: 'Academic & Administrative', status: 'OFFICIALLY VERIFIED' },
  { name: 'F Block', category: 'Academic & Administrative', status: 'OFFICIALLY VERIFIED' },

  // OFFICIALLY VERIFIED - Facilities
  { name: 'Library Block', category: 'Services', status: 'OFFICIALLY VERIFIED' },
  { name: 'Principal Quarters', category: 'Hostel / House Areas', status: 'OFFICIALLY VERIFIED' },
  { name: 'Guest House', category: 'Hostel / House Areas', status: 'OFFICIALLY VERIFIED' },
  { name: 'Sports Club & Gymnasium', category: 'Recreation', status: 'OFFICIALLY VERIFIED' },
  { name: 'Auditorium', category: 'Academic & Administrative', status: 'OFFICIALLY VERIFIED' },
  { name: 'Cafeteria', category: 'Food & Dining', status: 'OFFICIALLY VERIFIED' },
  { name: "Boys' Hostel", category: 'Hostel / House Areas', status: 'OFFICIALLY VERIFIED' },
  { name: "Girls' Hostel", category: 'Hostel / House Areas', status: 'OFFICIALLY VERIFIED' },
  { name: 'Power House', category: 'Services', status: 'OFFICIALLY VERIFIED' },
  { name: 'Stationery Store', category: 'Services', status: 'OFFICIALLY VERIFIED' },
  { name: 'Parking', category: 'Services', status: 'OFFICIALLY VERIFIED' },

  // FRIEND/STUDENT CONFIRMED - Hostel Houses
  { name: 'Himalayan House', category: 'Hostel / House Areas', status: 'FRIEND/STUDENT CONFIRMED' },
  { name: 'Tanjore House', category: 'Hostel / House Areas', status: 'FRIEND/STUDENT CONFIRMED' },
  { name: 'Madurai House', category: 'Hostel / House Areas', status: 'FRIEND/STUDENT CONFIRMED' },
  { name: 'Marina House', category: 'Hostel / House Areas', status: 'FRIEND/STUDENT CONFIRMED' },
  { name: 'Nilgiri House', category: 'Hostel / House Areas', status: 'FRIEND/STUDENT CONFIRMED' },
  { name: 'Ellora House', category: 'Hostel / House Areas', status: 'FRIEND/STUDENT CONFIRMED' },
  { name: 'Vivekananda Hostel', category: 'Hostel / House Areas', status: 'FRIEND/STUDENT CONFIRMED' },

  // FRIEND/STUDENT CONFIRMED - Campus Places
  { name: 'Raman Block', category: 'Academic & Administrative', status: 'FRIEND/STUDENT CONFIRMED' },
  { name: 'Mercury Block', category: 'Academic & Administrative', status: 'FRIEND/STUDENT CONFIRMED' },
  { name: 'Jupiter Block', category: 'Academic & Administrative', status: 'FRIEND/STUDENT CONFIRMED' },
  { name: 'MBA Block', category: 'Academic & Administrative', status: 'FRIEND/STUDENT CONFIRMED' },
  { name: 'Mechanical Block', category: 'Academic & Administrative', status: 'FRIEND/STUDENT CONFIRMED' },
  { name: 'IT Park', category: 'Academic & Administrative', status: 'FRIEND/STUDENT CONFIRMED' },
  { name: 'Techno Park', category: 'Academic & Administrative', status: 'FRIEND/STUDENT CONFIRMED' },
  { name: 'Founder Hall', category: 'Academic & Administrative', status: 'FRIEND/STUDENT CONFIRMED' },

  // FRIEND/STUDENT CONFIRMED - Food / Retail
  { name: 'West Mart', category: 'Food & Dining', status: 'FRIEND/STUDENT CONFIRMED' },
  { name: 'Cucumber Canteen', category: 'Food & Dining', status: 'FRIEND/STUDENT CONFIRMED' },
  { name: 'Mustard Cafe', category: 'Food & Dining', status: 'FRIEND/STUDENT CONFIRMED' },
  { name: 'Saffron Canteen', category: 'Food & Dining', status: 'FRIEND/STUDENT CONFIRMED' },
  { name: 'Cinnamon Canteen', category: 'Food & Dining', status: 'FRIEND/STUDENT CONFIRMED' },
  { name: 'Bite Zone', category: 'Food & Dining', status: 'FRIEND/STUDENT CONFIRMED' },

  // NEEDS FURTHER CONFIRMATION
  { name: 'Round Building', category: 'Unknown', status: 'NEEDS CONFIRMATION' },
  { name: "Women's Arts", category: 'Unknown', status: 'NEEDS CONFIRMATION' }
];

const escapeQuotes = (str) => str.replace(/'/g, "\\\\'");
const escapeHtmlQuotes = (str) => str.replace(/'/g, "&#39;");

const coreCode = "const CAMPUS_LOCATIONS = [\\n" +
  campusLocationsData.map(loc => "  { name: '" + escapeQuotes(loc.name) + "', category: '" + loc.category + "', status: '" + loc.status + "' }").join(",\\n") +
"\\n];";

const optionListHTML = campusLocationsData.map(loc => '<option value="' + escapeHtmlQuotes(loc.name) + '">' + escapeHtmlQuotes(loc.name) + '</option>').join('\\n                      ');

// 1. Update 0_core.js
const corePath = path.join(rootDir, 'public/src/0_core.js');
let coreContent = fs.readFileSync(corePath, 'utf8');

coreContent = coreContent.replace(/const CAMPUS_LOCATIONS = \[[\s\S]*?\];/m, coreCode);

const oldProximity = "const LOCATION_PROXIMITY = {\\n" +
"  // Official Blocks & Facilities\\n" +
"  'Administrative Block': ['Academic Block', 'A Block', 'Library Block'],\\n" +
"  'Academic Block': ['Administrative Block', 'A Block', 'B Block', 'C Block'],\\n" +
"  'A Block': ['B Block', 'C Block', 'Academic Block', 'Administrative Block'],\\n" +
"  'B Block': ['A Block', 'C Block', 'D Block', 'Academic Block'],\\n" +
"  'C Block': ['A Block', 'B Block', 'D Block', 'E Block'],\\n" +
"  'D Block': ['B Block', 'C Block', 'E Block', 'F Block'],\\n" +
"  'E Block': ['C Block', 'D Block', 'F Block'],\\n" +
"  'F Block': ['D Block', 'E Block'],\\n" +
"  'Library Block': ['Cafeteria', 'Administrative Block', 'Academic Block'],\\n" +
"  'Cafeteria': ['Library Block', 'Saffron Canteen'],\\n" +
"  'Auditorium': ['Administrative Block'],\\n" +
"  'Sports Club & Gymnasium': ['Parking'],\\n" +
"  'Parking': ['Sports Club & Gymnasium'],\\n" +
"  'Boys\\' Hostel': [],\\n" +
"  'Girls\\' Hostel': [],\\n" +
"  'Principal Quarters': [],\\n" +
"  'Guest House': [],\\n" +
"  'Power House': [],\\n" +
"  'Stationery Store': [],\\n" +
"  // Student confirmed places without verified physical adjacency will be left empty\\n" +
"  'Himalayan House': [],\\n" +
"  'Tanjore House': [],\\n" +
"  'Madurai House': [],\\n" +
"  'Marina House': [],\\n" +
"  'Nilgiri House': [],\\n" +
"  'Ellora House': [],\\n" +
"  'Vivekananda Hostel': [],\\n" +
"  'Raman Block': [],\\n" +
"  'Mercury Block': [],\\n" +
"  'Jupiter Block': [],\\n" +
"  'MBA Block': [],\\n" +
"  'Mechanical Block': [],\\n" +
"  'IT Park': [],\\n" +
"  'Techno Park': [],\\n" +
"  'Founder Hall': [],\\n" +
"  'West Mart': [],\\n" +
"  'Cucumber Canteen': [],\\n" +
"  'Mustard Cafe': [],\\n" +
"  'Saffron Canteen': [],\\n" +
"  'Cinnamon Canteen': [],\\n" +
"  'Bite Zone': [],\\n" +
"  'Round Building': [],\\n" +
"  'Women\\'s Arts': []\\n" +
"};";

coreContent = coreContent.replace(/const LOCATION_PROXIMITY = \{[\s\S]*?\};\n/m, oldProximity + '\\n');
fs.writeFileSync(corePath, coreContent);
console.log('Updated 0_core.js');

// 2. Update HTML files
const htmlFiles = [
  'index.html',
  'story.html',
  '200.html',
  'public/index.html',
  'public/story.html',
  'public/200.html'
];

htmlFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    const newOptionsHtml = '<option value="" disabled selected>Select location on campus</option>\\n                      ' + optionListHTML;
    content = content.replace(/(<option value="" disabled selected>Select location on campus<\/option>)[\s\S]*?(?=<\/select>)/g, newOptionsHtml + '\\n                    ');
    
    const newFilterOptionsHtml = '<option value="">Any Location</option>\\n                      ' + optionListHTML;
    content = content.replace(/(<option value="">Any Location<\/option>)[\s\S]*?(?=<\/select>)/g, newFilterOptionsHtml + '\\n                    ');
    
    fs.writeFileSync(filePath, content);
    console.log('Updated HTML:', file);
  }
});

// 3. Update 16_analytics_dashboard
const analyticsPath = path.join(rootDir, 'public/src/16_analytics_dashboard___analytics_page__with_chart_js.js');
let analyticsContent = fs.readFileSync(analyticsPath, 'utf8');

const analyticsZonesList = campusLocationsData.map(loc => "'" + escapeQuotes(loc.name) + "'").join(', ');
const analyticsZonesReplacement = "    const zones = [\\n      " + analyticsZonesList + "\\n    ];";
analyticsContent = analyticsContent.replace(/const zones = \[[\s\S]*?\];/m, analyticsZonesReplacement);

const heatmapZonesHtml = campusLocationsData.map(loc => {
  let icon = '📍';
  if (loc.category.includes('Hostel')) icon = '🏠';
  else if (loc.category.includes('Food')) icon = '☕';
  else if (loc.category.includes('Academic')) icon = '🏢';
  else if (loc.name.includes('Library')) icon = '📚';
  
  return "    { name: '" + escapeQuotes(loc.name) + "', icon: '" + icon + "', desc: '" + escapeQuotes(loc.status) + "' }";
}).join(',\\n');

const heatmapZonesReplacement = "  const campusZones = [\\n" + heatmapZonesHtml + "\\n  ];";
analyticsContent = analyticsContent.replace(/const campusZones = \[[\s\S]*?\];/m, heatmapZonesReplacement);

fs.writeFileSync(analyticsPath, analyticsContent);
console.log('Updated 16_analytics_dashboard');
