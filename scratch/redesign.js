const fs = require('fs');
const path = require('path');

// 1. UPDATE INDEX.HTML (ROOT)
const indexHtmlPath = path.join(__dirname, '../index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

// Replace the Student Dashboard hero
const oldStudentHero = `<div class="student-hero-banner">
              <div class="student-hero-tagline">LOSTSEEK • Find what's lost. Find it faster.</div>
              <h1 class="student-hero-greeting" id="student-welcome-heading">Hello, Student</h1>
              <p class="student-hero-question">What do you want to do?</p>
            </div>`;

const newStudentHero = `<div class="student-hero-banner" style="background: transparent; padding: 0; box-shadow: none; border: none; margin-bottom: 32px;">
              <h1 class="student-hero-greeting" id="student-welcome-heading" style="font-size: 2rem; color: var(--text-primary); letter-spacing: -0.02em;">Welcome back</h1>
              <p class="student-hero-question" style="font-size: 1.1rem; color: var(--text-secondary); margin-top: 4px;">How can we help you today?</p>
            </div>`;

html = html.replace(oldStudentHero, newStudentHero);

// Clean up glass-card references on the dashboard feeds
html = html.replace(/class="glass-card" style="padding: 20px;"/g, 'class="premium-card" style="padding: 24px;"');

// 2. UPDATE STYLES.CSS (ROOT)
const cssPath = path.join(__dirname, '../styles.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Rewrite `.student-four-actions-grid` and `.student-action-card-btn`
const newCssRules = `
/* --- PREMIUM REDESIGN RULES --- */
.premium-card {
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}
.premium-card:hover {
  box-shadow: var(--shadow-elevated);
}
.student-action-card-btn {
  background: var(--bg-card) !important;
  border: 1px solid var(--border-card) !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--shadow-card) !important;
  padding: 24px !important;
  transition: all var(--transition-fast) !important;
}
.student-action-card-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-elevated) !important;
  border-color: var(--teal-bright) !important;
}
.student-action-title {
  font-weight: 700 !important;
  color: var(--text-primary) !important;
  font-size: 1.1rem !important;
}
.student-action-desc {
  color: var(--text-secondary) !important;
  font-size: 0.9rem !important;
  line-height: 1.4 !important;
}
.icon-bg-blue, .icon-bg-teal, .icon-bg-amber, .icon-bg-purple {
  background: var(--bg-subtle) !important;
  box-shadow: none !important;
}
.icon-bg-blue i { color: var(--campus-blue) !important; }
.icon-bg-teal i { color: var(--teal-deep) !important; }
.icon-bg-amber i { color: var(--color-warning) !important; }
.icon-bg-purple i { color: var(--ai-violet) !important; }

/* Clean up sidebar */
.sidebar {
  background: var(--bg-sidebar) !important;
  border-right: 1px solid var(--border-subtle) !important;
  box-shadow: none !important;
}
.nav-link.active {
  background: var(--bg-subtle) !important;
  border-left: 3px solid var(--teal-bright) !important;
  color: var(--teal-deep) !important;
  box-shadow: none !important;
}
.nav-link.active i {
  color: var(--teal-deep) !important;
}
.nav-link:hover {
  background: var(--bg-subtle) !important;
}

/* Header */
.topbar {
  background: var(--bg-header) !important;
  border-bottom: 1px solid var(--border-subtle) !important;
  box-shadow: none !important;
  backdrop-filter: blur(12px) !important;
}

/* Remove old glowing glass cards */
.glass-card {
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}
`;

css += '\n' + newCssRules;

fs.writeFileSync(indexHtmlPath, html, 'utf8');
fs.writeFileSync(cssPath, css, 'utf8');
console.log("Redesign injected into ROOT.");
