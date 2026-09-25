
// On-demand script loader for performance optimization
function loadScriptAsync(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true' || window.Chart || window.QRCode || window.jspdf) return resolve();
      existing.addEventListener('load', () => { existing.dataset.loaded = 'true'; resolve(); });
      existing.addEventListener('error', reject);
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => { s.dataset.loaded = 'true'; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
/**
 * LostSeek - Core Application Logic
 * Modern Campus Lost & Found System
 */

// Global App State
const STORAGE_KEY = 'campusfind_data';

let appState = window.appState = {
  user: null,
  lostReports: [],
  foundReports: [],
  claims: [],
  notifications: []
};

// Category Metadata mapping for emojis and labels
const CATEGORY_MAP = {
  'id-card': { label: 'ID Card / Student Card', icon: '🪪' },
  'id-cards': { label: 'ID Card / Student Card', icon: '🪪' },
  'electronics': { label: 'Electronics', icon: '📱' },
  'wallet': { label: 'Wallet / Purse', icon: '👛' },
  'wallets': { label: 'Wallet / Purse', icon: '👛' },
  'keys': { label: 'Keys', icon: '🔑' },
  'bags': { label: 'Bags / Backpacks', icon: '🎒' },
  'documents': { label: 'Documents / Books', icon: '📄' },
  'clothing': { label: 'Clothing', icon: '👕' },
  'accessories': { label: 'Accessories', icon: '👓' },
  'misc': { label: 'Miscellaneous', icon: '🔮' }
};

// Extensible Landmark Data Structure (Preserves verified coordinates without guessing)
const CAMPUS_LOCATIONS = [
  // ACADEMIC / BUILDINGS
  { name: 'A Block', category: 'Academic / Buildings', coordinates: null },
  { name: 'B Block', category: 'Academic / Buildings', coordinates: null },
  { name: 'C Block', category: 'Academic / Buildings', coordinates: null },
  { name: 'D Block', category: 'Academic / Buildings', coordinates: null },
  { name: 'E Block', category: 'Academic / Buildings', coordinates: null },
  { name: 'F Block', category: 'Academic / Buildings', coordinates: null },
  { name: 'Administrative Block', category: 'Academic / Buildings', coordinates: null },
  { name: 'Academic Block', category: 'Academic / Buildings', coordinates: null },

  // FOOD / SHOPS
  { name: 'Saffron Canteen', category: 'Food / Shops', coordinates: null },
  { name: 'West Mart', category: 'Food / Shops', coordinates: null },
  { name: 'Cinnamon Cafe', category: 'Food / Shops', coordinates: null },
  { name: 'Cucumber Cafe', category: 'Food / Shops', coordinates: null },
  { name: 'Mustard Cafe', category: 'Food / Shops', coordinates: null },

  // SERVICES
  { name: 'Post Office', category: 'Services', coordinates: null },

  // HOSTEL / HOUSE AREAS
  { name: 'Himalayan House', category: 'Hostel / House Areas', coordinates: null },
  { name: 'Tanjore House', category: 'Hostel / House Areas', coordinates: null },
  { name: 'Marina House', category: 'Hostel / House Areas', coordinates: null },
  { name: 'Nilgiri House', category: 'Hostel / House Areas', coordinates: null },
  { name: 'Madura House', category: 'Hostel / House Areas', coordinates: null }
];

// Location Proximity Adjacency Map for AI Matching
const LOCATION_PROXIMITY = {
  // Academic & Administrative
  'A Block': ['B Block', 'C Block', 'Academic Block', 'Administrative Block'],
  'B Block': ['A Block', 'C Block', 'D Block', 'Academic Block'],
  'C Block': ['A Block', 'B Block', 'D Block', 'E Block'],
  'D Block': ['B Block', 'C Block', 'E Block', 'F Block'],
  'E Block': ['C Block', 'D Block', 'F Block', 'Post Office'],
  'F Block': ['D Block', 'E Block', 'Post Office', 'West Mart'],
  'Administrative Block': ['Academic Block', 'A Block', 'Main Building', 'Admin Block', 'Post Office'],
  'Academic Block': ['Administrative Block', 'A Block', 'B Block', 'C Block', 'Library'],

  // Food & Dining
  'Saffron Canteen': ['West Mart', 'Cinnamon Cafe', 'Cucumber Cafe', 'Mustard Cafe', 'Cafeteria'],
  'West Mart': ['Saffron Canteen', 'Post Office', 'Cinnamon Cafe', 'F Block'],
  'Cinnamon Cafe': ['Saffron Canteen', 'Cucumber Cafe', 'West Mart'],
  'Cucumber Cafe': ['Saffron Canteen', 'Cinnamon Cafe', 'Mustard Cafe'],
  'Mustard Cafe': ['Saffron Canteen', 'Cucumber Cafe', 'Tanjore House'],

  // Services
  'Post Office': ['Administrative Block', 'West Mart', 'E Block', 'F Block'],

  // Hostels / Residential
  'Himalayan House': ['Tanjore House', 'Marina House', 'Nilgiri House', 'Madura House', 'Hostel Block A'],
  'Tanjore House': ['Himalayan House', 'Marina House', 'Mustard Cafe', 'Hostel Block B'],
  'Marina House': ['Himalayan House', 'Tanjore House', 'Nilgiri House', 'Hostel Block C'],
  'Nilgiri House': ['Marina House', 'Himalayan House', 'Madura House'],
  'Madura House': ['Nilgiri House', 'Himalayan House', 'Marina House'],

  // Legacy campus locations (Preserved for backward compatibility)
  'Library': ['Cafeteria', 'Main Building', 'Admin Block', 'Lab Complex', 'Academic Block'],
  'Cafeteria': ['Library', 'Hostel Block A', 'Main Building', 'Saffron Canteen'],
  'Main Building': ['Library', 'Admin Block', 'Auditorium', 'Lab Complex', 'Administrative Block'],
  'Hostel Block A': ['Hostel Block B', 'Cafeteria', 'Sports Ground', 'Himalayan House'],
  'Hostel Block B': ['Hostel Block A', 'Hostel Block C', 'Tanjore House'],
  'Hostel Block C': ['Hostel Block B', 'Sports Ground', 'Marina House'],
  'Sports Ground': ['Hostel Block A', 'Hostel Block C', 'Parking Area'],
  'Lab Complex': ['Main Building', 'Library'],
  'Parking Area': ['Sports Ground', 'Admin Block', 'Main Building'],
  'Auditorium': ['Main Building', 'Admin Block'],
  'Admin Block': ['Main Building', 'Library', 'Parking Area', 'Administrative Block'],
  'Other': []
};

function getLocationCategory(locationName) {
  if (!locationName) return null;
  const match = CAMPUS_LOCATIONS.find(l => l.name.toLowerCase() === locationName.toLowerCase().trim());
  return match ? match.category : null;
}

function isSameLocationCategory(loc1, loc2) {
  const cat1 = getLocationCategory(loc1);
  const cat2 = getLocationCategory(loc2);
  return !!(cat1 && cat2 && cat1 === cat2);
}

function handleLocationSelectChange(selectEl, otherWrapId) {
  if (!selectEl || !otherWrapId) return;
  const wrap = document.getElementById(otherWrapId);
  if (!wrap) return;
  if (selectEl.value === 'Other') {
    wrap.style.display = 'block';
    const input = wrap.querySelector('input');
    if (input) input.focus();
  } else {
    wrap.style.display = 'none';
  }
}

function getOfficialContactDisplay(phone) {
  if (phone && phone.trim()) {
    const clean = phone.trim();
    return `<a href="tel:${escapeHTML(clean)}" style="color: var(--teal-bright); text-decoration: none; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;"><i data-lucide="phone-call" style="width: 14px; height: 14px;"></i> ${escapeHTML(clean)}</a>`;
  }
  return '<span class="contact-unconfigured-text">Contact number not configured</span>';
}


// Configurable Official Campus Contacts (Zero fake numbers: official KSRCE & 112)
const DEFAULT_OFFICIAL_CONTACTS = {
  campusOffice: {
    name: 'Campus Administration & Student Affairs (KSRCE)',
    office: 'Administrative Block, 1st Floor, Room 102',
    phone: '04288-274213',
    email: 'lostfound@ksrce.ac.in',
    hours: 'Mon - Fri, 9:00 AM - 5:00 PM'
  },
  campusSecurity: {
    name: 'Campus Security & Custody Desk (Main Gate)',
    office: 'Main Gate Security Post & Administrative Block Reception',
    phone: '04288-274757',
    hours: '24/7 Security Coverage & Custody Lockers'
  },
  policeStation: {
    name: 'Emergency & Police Assistance',
    address: 'National Emergency Response Centre',
    phone: '112',
    landmark: 'Police, Fire & Medical Emergency Services'
  }
};
