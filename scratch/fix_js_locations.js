const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\Users\\prakash c\\Desktop\\smart campus-pro';

// Update 0_core.js
const corePath = path.join(rootDir, 'public/src/0_core.js');
let coreContent = fs.readFileSync(corePath, 'utf8');

const newCampusLocations = `const CAMPUS_LOCATIONS = [
  // HOSTEL / HOUSE AREAS
  { name: 'Himalayan House', category: 'Hostel / House Areas', coordinates: null },
  { name: 'Tanjore House', category: 'Hostel / House Areas', coordinates: null },
  { name: 'Marina House', category: 'Hostel / House Areas', coordinates: null },
  { name: 'Nilgiri House', category: 'Hostel / House Areas', coordinates: null },
  { name: 'Madura House', category: 'Hostel / House Areas', coordinates: null },

  // FOOD & DINING
  { name: 'Saffron Canteen', category: 'Food & Dining', coordinates: null },
  { name: 'West Mart', category: 'Food & Dining', coordinates: null },
  { name: 'Cinnamon Cafe', category: 'Food & Dining', coordinates: null },
  { name: 'Cucumber Canteen', category: 'Food & Dining', coordinates: null },
  { name: 'Mustard Cafe', category: 'Food & Dining', coordinates: null },

  // SERVICES
  { name: 'Post Office', category: 'Services', coordinates: null },
  { name: 'Campus Security Office (Main Gate)', category: 'Services', coordinates: null },
  { name: 'Library (A Block)', category: 'Services', coordinates: null },

  // ACADEMIC & ADMINISTRATIVE
  { name: 'A Block', category: 'Academic & Administrative', coordinates: null },
  { name: 'B Block', category: 'Academic & Administrative', coordinates: null },
  { name: 'C Block', category: 'Academic & Administrative', coordinates: null },
  { name: 'D Block', category: 'Academic & Administrative', coordinates: null },
  { name: 'E Block', category: 'Academic & Administrative', coordinates: null },
  { name: 'F Block', category: 'Academic & Administrative', coordinates: null },
  { name: 'R Block', category: 'Academic & Administrative', coordinates: null }
];`;

coreContent = coreContent.replace(/const CAMPUS_LOCATIONS = \[[\s\S]*?\];/m, newCampusLocations);

// Also remove legacy from LOCATION_PROXIMITY if it exists
coreContent = coreContent.replace(/\s*\/\/\s*Legacy campus locations.*?\]/s, '');
// Let's just rewrite LOCATION_PROXIMITY
const newProximity = `const LOCATION_PROXIMITY = {
  'A Block': ['B Block', 'C Block', 'Library (A Block)'],
  'B Block': ['A Block', 'C Block', 'D Block'],
  'C Block': ['A Block', 'B Block', 'D Block', 'E Block'],
  'D Block': ['B Block', 'C Block', 'E Block', 'F Block'],
  'E Block': ['C Block', 'D Block', 'F Block', 'Post Office'],
  'F Block': ['D Block', 'E Block', 'Post Office', 'West Mart'],
  'R Block': [],
  'Saffron Canteen': ['West Mart', 'Cinnamon Cafe', 'Cucumber Canteen', 'Mustard Cafe'],
  'West Mart': ['Saffron Canteen', 'Post Office', 'Cinnamon Cafe', 'F Block'],
  'Cinnamon Cafe': ['Saffron Canteen', 'Cucumber Canteen', 'West Mart'],
  'Cucumber Canteen': ['Saffron Canteen', 'Cinnamon Cafe', 'Mustard Cafe'],
  'Mustard Cafe': ['Saffron Canteen', 'Cucumber Canteen', 'Tanjore House'],
  'Post Office': ['West Mart', 'E Block', 'F Block'],
  'Campus Security Office (Main Gate)': [],
  'Library (A Block)': ['A Block', 'B Block'],
  'Himalayan House': ['Tanjore House', 'Marina House', 'Nilgiri House', 'Madura House'],
  'Tanjore House': ['Himalayan House', 'Marina House', 'Mustard Cafe'],
  'Marina House': ['Himalayan House', 'Tanjore House', 'Nilgiri House'],
  'Nilgiri House': ['Marina House', 'Himalayan House', 'Madura House'],
  'Madura House': ['Nilgiri House', 'Himalayan House', 'Marina House']
};`;
coreContent = coreContent.replace(/const LOCATION_PROXIMITY = \{[\s\S]*?\};\n/m, newProximity + '\n');
fs.writeFileSync(corePath, coreContent);
console.log('Updated 0_core.js');

// Update 16_analytics_dashboard
const analyticsPath = path.join(rootDir, 'public/src/16_analytics_dashboard___analytics_page__with_chart_js.js');
let analyticsContent = fs.readFileSync(analyticsPath, 'utf8');

const newZones = `    const zones = [
      'A Block', 'B Block', 'C Block', 'D Block', 'E Block', 'F Block', 'R Block',
      'Saffron Canteen', 'West Mart', 'Cinnamon Cafe', 'Cucumber Canteen', 'Mustard Cafe',
      'Post Office', 'Campus Security Office (Main Gate)', 'Library (A Block)',
      'Himalayan House', 'Tanjore House', 'Marina House', 'Nilgiri House', 'Madura House'
    ];`;
analyticsContent = analyticsContent.replace(/const zones = \[[\s\S]*?\];/m, newZones);

const newCampusZones = `  const campusZones = [
    { name: 'A Block', icon: '🏢', desc: 'Academic building A' },
    { name: 'B Block', icon: '🏢', desc: 'Academic building B' },
    { name: 'C Block', icon: '🏢', desc: 'Academic building C' },
    { name: 'D Block', icon: '🏢', desc: 'Academic building D' },
    { name: 'E Block', icon: '🏢', desc: 'Academic building E' },
    { name: 'F Block', icon: '🏢', desc: 'Academic building F' },
    { name: 'R Block', icon: '🏢', desc: 'Academic building R' },
    { name: 'Saffron Canteen', icon: '☕', desc: 'Dining & cafeteria' },
    { name: 'West Mart', icon: '🏪', desc: 'Campus convenience store' },
    { name: 'Cinnamon Cafe', icon: '☕', desc: 'Snacks and beverages' },
    { name: 'Cucumber Canteen', icon: '🥗', desc: 'Healthy food & salads' },
    { name: 'Mustard Cafe', icon: '🍔', desc: 'Fast food & grill' },
    { name: 'Post Office', icon: '📮', desc: 'Campus postal services' },
    { name: 'Campus Security Office (Main Gate)', icon: '🛡️', desc: 'Main security desk' },
    { name: 'Library (A Block)', icon: '📚', desc: 'Central library' },
    { name: 'Himalayan House', icon: '🏠', desc: 'Student dormitory' },
    { name: 'Tanjore House', icon: '🏠', desc: 'Student dormitory' },
    { name: 'Marina House', icon: '🏠', desc: 'Student dormitory' },
    { name: 'Nilgiri House', icon: '🏠', desc: 'Student dormitory' },
    { name: 'Madura House', icon: '🏠', desc: 'Student dormitory' }
  ];`;
analyticsContent = analyticsContent.replace(/const campusZones = \[[\s\S]*?\];/m, newCampusZones);
fs.writeFileSync(analyticsPath, analyticsContent);
console.log('Updated 16_analytics_dashboard');
