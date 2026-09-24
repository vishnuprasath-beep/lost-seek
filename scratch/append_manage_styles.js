const fs = require('fs');

let css = fs.readFileSync('styles.css', 'utf8');

const manageCSS = `
/* ==========================================================================
   MANAGE PAGES (LOST, FOUND, ALL REPORTS, CLAIMS, MATCH CENTER) STYLES
   ========================================================================== */

.badge-type-lost {
  background: rgba(239, 68, 68, 0.15);
  color: #F87171;
  border: 1px solid rgba(239, 68, 68, 0.35);
  font-weight: 700;
  font-size: 0.72rem;
  letter-spacing: 0.5px;
}

.badge-type-found {
  background: rgba(20, 184, 166, 0.15);
  color: var(--teal-bright);
  border: 1px solid rgba(20, 184, 166, 0.35);
  font-weight: 700;
  font-size: 0.72rem;
  letter-spacing: 0.5px;
}

/* Explainable Match Reasons */
.explainable-reasons-box {
  background: var(--bg-subtle);
  border-radius: 8px;
  padding: 12px 14px;
  border: 1px solid var(--border-subtle);
}

.explainable-reasons-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
}

.reason-chip-matched {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #34D399;
  font-size: 0.82rem;
  font-weight: 600;
}

.reason-chip-unmatched {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #FBBF24;
  font-size: 0.8rem;
  font-style: italic;
}

/* Claims Verification Evidence Box */
.claim-evidence-box {
  background: rgba(245, 158, 11, 0.08);
  border: 1.5px dashed rgba(245, 158, 11, 0.35);
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 0.86rem;
  color: var(--text-primary);
}

/* Timeline History */
.timeline-history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  padding-left: 18px;
  border-left: 2px solid var(--border-subtle);
}

.timeline-event-item {
  position: relative;
}

.timeline-event-item::before {
  content: '';
  position: absolute;
  left: -24px;
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--teal-bright);
  box-shadow: 0 0 6px rgba(20, 184, 166, 0.5);
}

.timeline-event-time {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.timeline-event-desc {
  font-size: 0.82rem;
  color: var(--text-primary);
  margin-top: 2px;
}
`;

if (!css.includes('MANAGE PAGES (LOST, FOUND, ALL REPORTS, CLAIMS')) {
  css += '\n' + manageCSS;
  fs.writeFileSync('styles.css', css, 'utf8');
  console.log('Appended Manage CSS to styles.css');
}
