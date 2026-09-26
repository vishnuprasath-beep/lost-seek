const fs = require('fs');
const path = require('path');

// 1. UPDATE STYLES.CSS
const cssPath = path.join(__dirname, '../styles.css');
let css = fs.readFileSync(cssPath, 'utf8');

// The manga CSS starts at: /* MANGA VIEWER STYLES */
const mangaCssStart = css.indexOf('/* MANGA VIEWER STYLES */');
if (mangaCssStart !== -1) {
  // We'll replace the entire manga viewer block
  // Let's first extract everything up to the manga styles
  const cssBeforeManga = css.substring(0, mangaCssStart);
  
  const newMangaCss = `/* MANGA VIEWER STYLES */
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
    display: none; /* Hide side arrows on mobile */
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
}


// 2. UPDATE STORY.HTML
const storyPath = path.join(__dirname, '../story.html');
let storyHtml = fs.readFileSync(storyPath, 'utf8');

const newMainContent = `<main id="main-content" class="manga-viewer-container">
  <div class="manga-reader-toolbar">
    <a href="/" class="manga-back-btn" aria-label="Back to Home">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
      Back to Home
    </a>
  </div>

  <div class="manga-stage">
    <button class="manga-nav-side manga-prev-side" id="manga-prev-desktop" onclick="prevMangaPage()" aria-label="Previous story page">
      <i data-lucide="chevron-left"></i>
    </button>
    
    <div class="manga-slides-wrapper" id="manga-slides-wrapper">
      <div class="manga-slide active" data-page="1">
        <div class="manga-art-container"><img src="assets/images/manga-page-1.jpg?v=3" alt="The Loss" class="manga-art" loading="eager" /></div>
      </div>
      <div class="manga-slide" data-page="2">
        <div class="manga-art-container"><img src="assets/images/manga-page-2.jpg?v=3" alt="The Hero Appears" class="manga-art" loading="lazy" /></div>
      </div>
      <div class="manga-slide" data-page="3">
        <div class="manga-art-container"><img src="assets/images/manga-page-3.jpg?v=3" alt="The Report" class="manga-art" loading="lazy" /></div>
      </div>
      <div class="manga-slide" data-page="4">
        <div class="manga-art-container"><img src="assets/images/manga-page-4.jpg?v=3" alt="YOLO Scans" class="manga-art" loading="lazy" /></div>
      </div>
      <div class="manga-slide" data-page="5">
        <div class="manga-art-container"><img src="assets/images/manga-page-5.jpg?v=3" alt="CLIP Connects" class="manga-art" loading="lazy" /></div>
      </div>
      <div class="manga-slide" data-page="6">
        <div class="manga-art-container"><img src="assets/images/manga-page-6.jpg?v=3" alt="Matching Engine" class="manga-art" loading="lazy" /></div>
      </div>
      <div class="manga-slide" data-page="7">
        <div class="manga-art-container"><img src="assets/images/manga-page-7.jpg?v=3" alt="Admin Review" class="manga-art" loading="lazy" /></div>
      </div>
      <div class="manga-slide" data-page="8">
        <div class="manga-art-container"><img src="assets/images/manga-page-8.jpg?v=3" alt="The Return" class="manga-art" loading="lazy" /></div>
      </div>
      <div class="manga-slide" data-page="9">
        <div class="manga-art-container"><img src="assets/images/manga-page-9.jpg?v=3" alt="The Reveal" class="manga-art" loading="lazy" /></div>
      </div>
    </div>
    
    <button class="manga-nav-side manga-next-side" id="manga-next-desktop" onclick="nextMangaPage()" aria-label="Next story page">
      <i data-lucide="chevron-right"></i>
    </button>
  </div>

  <div class="manga-bottom-bar">
    <div class="manga-mobile-nav">
      <button class="manga-mobile-nav-btn" id="manga-prev-mobile" onclick="prevMangaPage()" aria-label="Previous story page">
        <i data-lucide="chevron-left"></i>
      </button>
      <div class="manga-progress-text" id="manga-progress-text-mobile">1 / 9</div>
      <button class="manga-mobile-nav-btn" id="manga-next-mobile" onclick="nextMangaPage()" aria-label="Next story page">
        <i data-lucide="chevron-right"></i>
      </button>
    </div>

    <div class="manga-progress-container">
      <div class="manga-progress-text" id="manga-progress-text-desktop">Page 1 of 9</div>
      <div class="manga-progress-bar">
        <div class="manga-progress-fill" id="manga-progress-fill" style="width: 11.11%;"></div>
      </div>
    </div>
    
    <div class="manga-skip-action">
       <button type="button" aria-label="Skip Story and Open App" onclick="window.location.href='/#login'">Skip Story &amp; Open App</button>
    </div>
  </div>
</main>`;

const mainStart = storyHtml.indexOf('<main id="main-content" class="manga-viewer-container">');
const mainEnd = storyHtml.indexOf('</main>', mainStart) + 7;
storyHtml = storyHtml.substring(0, mainStart) + newMainContent + storyHtml.substring(mainEnd);

// Also remove the old top floating back button since it's now in the toolbar
storyHtml = storyHtml.replace(/<div style="position: absolute; top: 100px; left: 24px; z-index: 1000;">[\s\S]*?<\/div>/, '');

fs.writeFileSync(storyPath, storyHtml, 'utf8');

// 3. UPDATE APP.JS SRC (45_status_update_modal.js)
const jsPath = path.join(__dirname, '../public/src/45_status_update_modal.js');
let jsCode = fs.readFileSync(jsPath, 'utf8');

// Replace renderMangaPagination logic
const oldRender = `function renderMangaPagination() {
  const paginationContainer = document.getElementById('manga-pagination');
  if (!paginationContainer) return;
  
  paginationContainer.innerHTML = '';
  for (let i = 1; i <= totalMangaPages; i++) {
    const dot = document.createElement('div');
    dot.className = 'manga-dot' + (i === currentMangaPage ? ' active' : '');
    dot.onclick = () => goToMangaPage(i);
    paginationContainer.appendChild(dot);
  }
}`;

const newRender = `function renderMangaPagination() {
  const progressTextDesktop = document.getElementById('manga-progress-text-desktop');
  const progressTextMobile = document.getElementById('manga-progress-text-mobile');
  const progressFill = document.getElementById('manga-progress-fill');
  
  if (progressTextDesktop) progressTextDesktop.innerText = \`Page \${currentMangaPage} of \${totalMangaPages}\`;
  if (progressTextMobile) progressTextMobile.innerText = \`\${currentMangaPage} / \${totalMangaPages}\`;
  if (progressFill) progressFill.style.width = \`\${(currentMangaPage / totalMangaPages) * 100}%\`;
}`;

jsCode = jsCode.replace(oldRender, newRender);

// Update button disable logic
const oldBtnLogic = `  const prevBtn = document.getElementById('manga-prev');
  const nextBtn = document.getElementById('manga-next');
  
  if (prevBtn) prevBtn.disabled = currentMangaPage === 1;
  if (nextBtn) nextBtn.disabled = currentMangaPage === totalMangaPages;`;

const newBtnLogic = `  const prevBtns = [document.getElementById('manga-prev-desktop'), document.getElementById('manga-prev-mobile')];
  const nextBtns = [document.getElementById('manga-next-desktop'), document.getElementById('manga-next-mobile')];
  
  prevBtns.forEach(btn => { if (btn) btn.disabled = currentMangaPage === 1; });
  nextBtns.forEach(btn => { if (btn) btn.disabled = currentMangaPage === totalMangaPages; });`;

jsCode = jsCode.replace(oldBtnLogic, newBtnLogic);

// Add Keyboard Support (Left/Right)
if (!jsCode.includes('document.addEventListener(\'keydown\'')) {
  jsCode += `\n
// Manga Keyboard Support
document.addEventListener('keydown', (e) => {
  const wrapper = document.getElementById('manga-slides-wrapper');
  if (!wrapper) return; // Not on story page
  
  if (e.key === 'ArrowRight') {
    window.nextMangaPage();
  } else if (e.key === 'ArrowLeft') {
    window.prevMangaPage();
  } else if (e.key === 'Escape') {
    window.location.href = '/';
  }
});
`;
}

fs.writeFileSync(jsPath, jsCode, 'utf8');

console.log("Manga script finished.");
