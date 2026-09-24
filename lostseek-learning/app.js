// ==========================================================================
// LostSeek Learning — Phase 2 Application Logic
// Adding Client-Side Persistence with Browser localStorage
// ==========================================================================

// Storage key used in browser localStorage
const STORAGE_KEY = 'lostseek_learning_reports';

// 1. Application State
// In-memory JavaScript object holding the current session data.
// appState.reports is the SINGLE SOURCE OF TRUTH for active rendering.
const appState = {
  reports: [],
  currentFormType: 'LOST' // Tracks whether the user is reporting 'LOST' or 'FOUND'
};

// 2. DOM Elements Selection
const btnReportLost = document.getElementById('btn-report-lost');
const btnReportFound = document.getElementById('btn-report-found');
const btnCancel = document.getElementById('btn-cancel');
const btnClearReports = document.getElementById('btn-clear-reports');

const formSection = document.getElementById('form-section');
const formTitle = document.getElementById('form-title');
const reportForm = document.getElementById('report-form');

const inputItemName = document.getElementById('item-name');
const inputDescription = document.getElementById('description');
const inputCategory = document.getElementById('category');
const inputColor = document.getElementById('color');
const inputLocation = document.getElementById('location');

const reportsList = document.getElementById('reports-list');

// 3. LocalStorage Persistence Functions

// A. Load reports from localStorage into appState.reports
function loadReports() {
  try {
    // Read the raw text stored under our key
    const rawData = localStorage.getItem(STORAGE_KEY);

    // If nothing has been saved yet (first visit), rawData is null
    if (!rawData) {
      appState.reports = [];
      return;
    }

    // Convert the JSON text string back into a real JavaScript array
    const parsed = JSON.parse(rawData);

    // Ensure the parsed result is actually an array
    if (Array.isArray(parsed)) {
      appState.reports = parsed;
    } else {
      appState.reports = [];
    }
  } catch (error) {
    // If JSON is corrupted or invalid, reset cleanly without crashing the app
    console.warn('Could not parse saved reports from localStorage. Resetting to empty.', error);
    appState.reports = [];
  }
}

// B. Save reports from appState.reports into localStorage
function saveReports() {
  try {
    // Convert our JavaScript array of objects into a JSON text string
    const serialized = JSON.stringify(appState.reports);

    // Write that string to persistent browser storage
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save reports to localStorage:', error);
    alert('Warning: Could not save report to browser storage.');
  }
}

// 4. Functions to Show and Hide the Report Form

// Opens the form and adjusts titles based on type ('LOST' or 'FOUND')
function openForm(type) {
  appState.currentFormType = type;
  formTitle.textContent = type === 'LOST' ? 'Report a Lost Item' : 'Report a Found Item';
  formSection.classList.remove('hidden'); // Show form section
  inputItemName.focus(); // Focus on first field
}

// Closes the form and resets all inputs
function closeForm() {
  formSection.classList.add('hidden'); // Hide form section
  reportForm.reset(); // Clear input values
}

// 5. Function to Render Reports onto the Screen
function renderReports() {
  // If there are no reports, display a friendly empty message
  if (appState.reports.length === 0) {
    reportsList.innerHTML = '<p class="empty-state">No reports yet.</p>';
    return;
  }

  // Clear previous HTML content
  reportsList.innerHTML = '';

  // Loop through every report in appState.reports and build card HTML
  appState.reports.forEach((report) => {
    const card = document.createElement('div');
    card.className = 'report-card';

    const badgeClass = report.type === 'LOST' ? 'badge-lost' : 'badge-found';

    card.innerHTML = `
      <div class="report-card-header">
        <span class="report-title">${escapeText(report.itemName)}</span>
        <span class="badge ${badgeClass}">${report.type}</span>
      </div>
      <p class="report-desc">${escapeText(report.description)}</p>
      <div class="report-meta">
        <span><strong>Category:</strong> ${escapeText(report.category)}</span>
        ${report.color ? `<span><strong>Color:</strong> ${escapeText(report.color)}</span>` : ''}
        <span><strong>Location:</strong> ${escapeText(report.location)}</span>
      </div>
    `;

    reportsList.appendChild(card);
  });
}

// Helper to prevent HTML injection
function escapeText(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// 6. Form Submit Handler
function handleFormSubmit(event) {
  event.preventDefault(); // Stop page reload

  // Read current input values
  const itemName = inputItemName.value.trim();
  const description = inputDescription.value.trim();
  const category = inputCategory.value;
  const color = inputColor.value.trim();
  const location = inputLocation.value.trim();

  // Basic validation
  if (!itemName || !description || !category || !location) {
    alert('Please fill out all required fields.');
    return;
  }

  // Create report object
  const newReport = {
    type: appState.currentFormType, // 'LOST' or 'FOUND'
    itemName: itemName,
    description: description,
    category: category,
    color: color,
    location: location
  };

  // 1. Add new report to our in-memory working array
  appState.reports.unshift(newReport);

  // 2. Save the updated array to localStorage
  saveReports();

  // 3. Render the updated reports onto the screen
  renderReports();

  // 4. Close and reset the form
  closeForm();
}

// 7. Clear All Reports Handler
function handleClearAll() {
  if (appState.reports.length === 0) {
    alert('There are no reports to clear.');
    return;
  }

  // Ask for explicit user confirmation
  const confirmed = confirm('Are you sure you want to delete all saved reports? This cannot be undone.');
  if (confirmed) {
    // 1. Reset in-memory array
    appState.reports = [];

    // 2. Overwrite localStorage with empty array
    saveReports();

    // 3. Refresh the screen
    renderReports();
  }
}

// 8. Register Event Listeners
btnReportLost.addEventListener('click', () => openForm('LOST'));
btnReportFound.addEventListener('click', () => openForm('FOUND'));
btnCancel.addEventListener('click', closeForm);
reportForm.addEventListener('submit', handleFormSubmit);
if (btnClearReports) {
  btnClearReports.addEventListener('click', handleClearAll);
}

// 9. Startup Sequence
// Logical order:
// First load data from localStorage into appState.reports
// Then render whatever was loaded onto the screen
loadReports();
renderReports();
