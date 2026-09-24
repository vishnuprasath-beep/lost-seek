const fs = require('fs');

let css = fs.readFileSync('styles.css', 'utf8');

const newCSS = `
/* ==========================================================================
   LOSTSEEK HELP & SAFETY, COMPLAINTS & URGENT ESCALATION STYLES
   ========================================================================== */

/* 1. Official Contacts Directory Grid */
.contacts-directory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
  margin-bottom: 24px;
}

.contact-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
  border-radius: var(--radius-md);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.contact-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-glow);
}

.contact-card-top {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.contact-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.contact-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.85rem;
}

.contact-info-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.contact-info-row i {
  width: 16px;
  height: 16px;
  color: var(--teal-bright);
  flex-shrink: 0;
  margin-top: 2px;
}

.contact-phone-display {
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
}

.contact-unconfigured-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(245, 158, 11, 0.12);
  color: #F59E0B;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.76rem;
  font-weight: 600;
}

/* 2. Safety Guidelines Grid */
.safety-guidelines-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.guideline-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: var(--bg-subtle);
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
}

.guideline-num {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(20, 184, 166, 0.15);
  color: var(--teal-bright);
  font-weight: 800;
  font-size: 0.82rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 3. Radio Cards (Urgent Reason Options) */
.radio-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-subtle);
  border: 1.5px solid var(--border-subtle);
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.86rem;
  color: var(--text-primary);
}

.radio-card:hover {
  background: rgba(20, 184, 166, 0.06);
  border-color: rgba(20, 184, 166, 0.4);
}

.radio-card input[type="radio"] {
  accent-color: var(--teal-bright);
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.radio-card:has(input[type="radio"]:checked) {
  border-color: var(--teal-bright);
  background: rgba(20, 184, 166, 0.1);
}

/* 4. Admin Help Desk Tabs & Pills */
.admin-help-tabs-wrap {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.admin-help-tab {
  border-radius: 20px;
  padding: 5px 14px;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.admin-help-tab.active {
  background: var(--teal-bright);
  color: #051B20;
  border-color: var(--teal-bright);
  box-shadow: 0 0 12px rgba(20, 184, 166, 0.35);
}

.status-pill.status-critical {
  background: rgba(239, 68, 68, 0.18);
  color: #F87171;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.status-pill.status-in-review {
  background: rgba(59, 130, 246, 0.18);
  color: #60A5FA;
  border: 1px solid rgba(59, 130, 246, 0.35);
}

.status-pill.status-handled {
  background: rgba(16, 185, 129, 0.18);
  color: #34D399;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.status-pill.status-closed {
  background: rgba(148, 163, 184, 0.15);
  color: var(--text-muted);
  border: 1px solid var(--border-subtle);
}

/* Admin Internal Note Bubble */
.admin-note-bubble {
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-left: 3px solid var(--teal-bright);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.82rem;
}

.admin-note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-bottom: 3px;
}

.admin-note-author {
  font-weight: 700;
  color: var(--teal-bright);
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .contacts-directory-grid {
    grid-template-columns: 1fr;
  }

  .safety-guidelines-grid {
    grid-template-columns: 1fr;
  }

  .admin-help-metrics-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
`;

if (!css.includes('LOSTSEEK HELP & SAFETY, COMPLAINTS')) {
  css += '\n' + newCSS;
  fs.writeFileSync('styles.css', css, 'utf8');
  console.log('Appended Help & Safety CSS to styles.css');
} else {
  console.log('Styles already exist in styles.css');
}
