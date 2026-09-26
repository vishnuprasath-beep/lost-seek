const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');

const virtualConsole = new jsdom.VirtualConsole();
let hasErrors = false;
virtualConsole.on("jsdomError", (error) => {
  console.error(error.stack, error.detail);
  hasErrors = true;
});
virtualConsole.on("error", (msg) => {
  console.error("CONSOLE ERROR:", msg);
  hasErrors = true;
});

const dom = new JSDOM(html, { 
  runScripts: "dangerously", 
  resources: "usable",
  url: "http://localhost:3000/",
  virtualConsole
});

dom.window.document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    runTests(dom.window);
  }, 2500); // wait for 2s requestIdleCallback fallback
});

function runTests(window) {
  const document = window.document;
  
  const results = {
    'Open LostSeek': 'FAIL',
    'Report Lost': 'FAIL',
    'Report Found': 'FAIL',
    'Reveal Story': 'FAIL',
    'Android App': 'FAIL',
    'Console errors': 'NO'
  };

  try {
    const btns = Array.from(document.querySelectorAll('.lp-btn'));
    
    // Test 1: Open LostSeek
    const btnOpen = btns.find(b => b.textContent && b.textContent.includes('Open LostSeek'));
    if (btnOpen) btnOpen.click();
    if (window.location.hash === '#login' && document.getElementById('login-page').style.display !== 'none') {
      results['Open LostSeek'] = 'PASS';
    }
    
    window.location.hash = '#home';
    
    // Test 2: Report Lost
    const btnLost = btns.find(b => b.textContent && b.textContent.includes('Report a Lost Item'));
    if (btnLost) btnLost.click();
    if (window.location.hash === '#login' && document.getElementById('login-page').style.display !== 'none') {
      results['Report Lost'] = 'PASS';
    }
    
    window.location.hash = '#home';
    
    // Test 3: Report Found
    const btnFound = btns.find(b => b.textContent && b.textContent.includes('Report a Found Item'));
    if (btnFound) btnFound.click();
    if (window.location.hash === '#login' && document.getElementById('login-page').style.display !== 'none') {
      results['Report Found'] = 'PASS';
    }
    
    // Test 4: Reveal Story
    const btnStory = btns.find(b => b.textContent && b.textContent.includes('Reveal the Story'));
    if (btnStory) {
      if (btnStory.getAttribute('onclick') && btnStory.getAttribute('onclick').includes('/story')) {
         results['Reveal Story'] = 'PASS';
      }
    }
    
    // Test 5: Android App
    const btnApp = btns.find(b => b.textContent && b.textContent.includes('Get Android App'));
    if (btnApp) {
      if (btnApp.tagName.toLowerCase() === 'a' && btnApp.href.includes('/download')) {
        results['Android App'] = 'PASS';
      }
    }
    
  } catch(e) {
    console.error("Test error:", e);
    hasErrors = true;
  }

  if (hasErrors) {
    results['Console errors'] = 'YES';
  }

  console.log('\n--- RESULTS ---');
  for (const [key, val] of Object.entries(results)) {
    console.log(`${key}: ${val}`);
  }
  
  process.exit(0);
}
