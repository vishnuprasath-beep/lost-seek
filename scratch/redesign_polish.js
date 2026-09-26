const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../styles.css');
let css = fs.readFileSync(cssPath, 'utf8');

const additionalCss = `
/* --- HEADER POLISH --- */
.top-header {
  padding: 0 32px !important;
}
.header-search input {
  background: var(--bg-subtle) !important;
  border: 1px solid var(--border-subtle) !important;
  border-radius: var(--radius-full) !important;
  color: var(--text-primary) !important;
  padding: 8px 16px 8px 36px !important;
  transition: all var(--transition-fast) !important;
}
.header-search input:focus {
  background: var(--bg-card) !important;
  border-color: var(--border-focus) !important;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1) !important;
}
.header-search i {
  color: var(--text-muted) !important;
}
.cloud-sync-badge {
  background: var(--bg-subtle) !important;
  border: 1px solid var(--border-subtle) !important;
  color: var(--text-secondary) !important;
  border-radius: var(--radius-full) !important;
  font-weight: 500 !important;
  font-size: 0.8rem !important;
  padding: 6px 12px !important;
}
.cloud-sync-badge.synced .sync-dot {
  background: var(--color-success) !important;
  box-shadow: 0 0 6px var(--color-success) !important;
}
.theme-toggle-btn, .notif-btn {
  background: var(--bg-subtle) !important;
  border: 1px solid var(--border-subtle) !important;
  border-radius: var(--radius-full) !important;
  color: var(--text-secondary) !important;
  transition: all var(--transition-fast) !important;
}
.theme-toggle-btn:hover, .notif-btn:hover {
  background: var(--bg-card) !important;
  border-color: var(--border-focus) !important;
  color: var(--teal-bright) !important;
}
.notif-count-badge {
  background: var(--color-error) !important;
  color: #fff !important;
}

/* Forms */
.form-group label {
  color: var(--text-primary) !important;
  font-weight: 600 !important;
}
.input-glass, .textarea-glass, select {
  background: var(--bg-input) !important;
  border: 1px solid var(--border-subtle) !important;
  color: var(--text-primary) !important;
  border-radius: var(--radius-sm) !important;
  transition: border var(--transition-fast), box-shadow var(--transition-fast) !important;
}
.input-glass:focus, .textarea-glass:focus, select:focus {
  border-color: var(--border-focus) !important;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1) !important;
}
`;

css += '\n' + additionalCss;
fs.writeFileSync(cssPath, css, 'utf8');
console.log("Polish CSS injected into ROOT.");
