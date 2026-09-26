const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../styles.css');
let css = fs.readFileSync(cssPath, 'utf8');

const marker = '/* =========================================================================\r\n   MANGA VIEWER STYLES';
const marker2 = '/* =========================================================================\n   MANGA VIEWER STYLES';

let mangaCssStart = css.indexOf(marker);
if (mangaCssStart === -1) {
  mangaCssStart = css.indexOf(marker2);
}

if (mangaCssStart !== -1) {
  const cssBeforeManga = css.substring(0, mangaCssStart);
  const newMangaCss = `/* =========================================================================
   MANGA VIEWER STYLES
   ========================================================================= */
.manga-viewer-container {
  background-color: #0F172A; /* Deep navy/ink */
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  font-family: var(--font-family);
  color: #F8FAFC;
}

/* A soft vignette glow around the edges */
.manga-viewer-container::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.8);
  pointer-events: none;
  z-index: 10;
}

.manga-reader-toolbar {
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 20;
  position: relative;
}

.manga-back-btn {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #F8FAFC;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.manga-back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.manga-stage {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 15;
  padding: 20px;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
}

.manga-slides-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.manga-slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, transform 0.3s ease;
  transform: translateX(10px);
  display: flex;
  justify-content: center;
  align-items: center;
}

.manga-slide.active {
  opacity: 1;
  visibility: visible;
  transform: translateX(0);
}

.manga-slide.prev-slide {
  transform: translateX(-10px);
}

.manga-art-container {
  max-width: 100%;
  max-height: 75vh;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  position: relative;
  background: #000; /* Placeholder color before load */
  display: flex;
  justify-content: center;
  align-items: center;
}

.manga-art {
  width: 100%;
  height: 100%;
  max-height: 75vh;
  object-fit: contain;
  display: block;
}

/* Loading state for images */
.manga-art-container::before {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 32px; height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #10B981; /* LostSeek Green */
  border-radius: 50%;
  animation: manga-spin 1s linear infinite;
  z-index: 1;
}
.manga-art {
  position: relative;
  z-index: 2;
}

@keyframes manga-spin {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

/* Desktop Navigation Controls beside art */
.manga-nav-side {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 56px;
  height: 56px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #F8FAFC;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 20;
}

.manga-nav-side:hover:not(:disabled) {
  background: rgba(16, 185, 129, 0.9); /* Green accent */
  border-color: #10B981;
  transform: translateY(-50%) scale(1.05);
}

.manga-nav-side:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.manga-nav-side:focus-visible {
  outline: 2px solid #3B82F6; /* Soft blue focus */
  outline-offset: 2px;
}

.manga-prev-side {
  left: 20px;
}

.manga-next-side {
  right: 20px;
}

/* Bottom Progress and Skip Action */
.manga-bottom-bar {
  padding: 20px 24px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  z-index: 20;
  position: relative;
}

.manga-progress-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 320px;
}

.manga-progress-text {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: #94A3B8;
}

.manga-progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.manga-progress-fill {
  height: 100%;
  background: #10B981;
  transition: width 0.3s ease;
}

.manga-skip-action button {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #F8FAFC;
  padding: 10px 24px;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.manga-skip-action button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.manga-skip-action button:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

/* Mobile specific overrides */
@media (max-width: 768px) {
  .manga-nav-side {
    display: none !important; /* Hide side arrows on mobile */
  }
  
  .manga-reader-toolbar {
    padding: 12px 16px;
  }
  
  .manga-stage {
    padding: 10px;
  }
  
  .manga-art-container {
    max-height: 60vh;
  }
  
  .manga-bottom-bar {
    padding: 16px 16px 24px;
  }
  
  /* Mobile bottom nav controls */
  .manga-mobile-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-bottom: 12px;
  }
  
  .manga-mobile-nav-btn {
    width: 44px;
    height: 44px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .manga-mobile-nav-btn:disabled {
    opacity: 0.3;
  }
}
@media (min-width: 769px) {
  .manga-mobile-nav {
    display: none;
  }
}
`;
  css = cssBeforeManga + newMangaCss;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log("CSS replaced successfully.");
} else {
  console.log("Could not find manga marker.");
}
