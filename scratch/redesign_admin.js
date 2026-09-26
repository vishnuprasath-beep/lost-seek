const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../styles.css');
let css = fs.readFileSync(cssPath, 'utf8');

const additionalCss = `
/* --- ADMIN DASHBOARD PREMIUM REDESIGN --- */
.dashboard-hero {
  background: var(--bg-card) !important;
  border: 1px solid var(--border-card) !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--shadow-card) !important;
  padding: 32px !important;
  margin-bottom: 24px !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: flex-start !important;
}
.stat-card {
  background: var(--bg-card) !important;
  border: 1px solid var(--border-card) !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--shadow-card) !important;
  padding: 24px !important;
  transition: all var(--transition-fast) !important;
}
.stat-card:hover {
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-elevated) !important;
  border-color: var(--teal-bright) !important;
}
.stat-meta h3 {
  color: var(--text-primary) !important;
  font-size: 2rem !important;
  font-weight: 800 !important;
  margin-bottom: 4px !important;
}
.stat-meta p {
  color: var(--text-secondary) !important;
  font-size: 0.95rem !important;
  font-weight: 500 !important;
}

/* Fix generic tables to be cleaner */
table {
  border-collapse: separate !important;
  border-spacing: 0 !important;
  width: 100% !important;
}
th {
  background: var(--bg-subtle) !important;
  color: var(--text-secondary) !important;
  font-weight: 600 !important;
  padding: 16px !important;
  border-bottom: 2px solid var(--border-subtle) !important;
  text-align: left !important;
}
td {
  padding: 16px !important;
  border-bottom: 1px solid var(--border-subtle) !important;
  color: var(--text-primary) !important;
}
tr:hover td {
  background: var(--bg-subtle) !important;
}

/* Badge styling for light theme */
.badge {
  padding: 4px 10px !important;
  border-radius: var(--radius-full) !important;
  font-weight: 600 !important;
  font-size: 0.75rem !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
}
.badge-verified {
  background: var(--color-success-bg) !important;
  color: var(--color-success) !important;
  border: 1px solid rgba(16, 185, 129, 0.2) !important;
}
`;

css += '\n' + additionalCss;
fs.writeFileSync(cssPath, css, 'utf8');

// HTML adjustments
const indexHtmlPath = path.join(__dirname, '../index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

// Admin hero adjustments
html = html.replace('class="hero-subtitle">Campus Lost &amp; Found Administration and Custody Console</p>', 'class="hero-subtitle" style="color: var(--text-secondary); font-size: 1.1rem;">Campus Lost &amp; Found Administration and Custody Console</p>');

fs.writeFileSync(indexHtmlPath, html, 'utf8');

console.log("Admin CSS injected into ROOT.");
