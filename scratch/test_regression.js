const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const errors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => errors.push(err.toString()));
  
  console.log('Navigating to local app...');
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });
  
  await new Promise(r => setTimeout(r, 2500)); // wait for idle callback hydration
  
  const results = {
    'Open LostSeek': 'FAIL',
    'Report Lost': 'FAIL',
    'Report Found': 'FAIL',
    'Reveal Story': 'FAIL',
    'Android App': 'FAIL',
    'Console errors': 'NO'
  };
  
  // Test 1: Open LostSeek
  try {
    await page.evaluate(() => {
      // Look for the specific "Open LostSeek" button
      const btns = Array.from(document.querySelectorAll('.lp-btn'));
      const btn = btns.find(b => b.innerText.includes('Open LostSeek'));
      if (btn) btn.click();
    });
    
    await new Promise(r => setTimeout(r, 500));
    
    const isLoginVisible = await page.evaluate(() => {
      const loginPage = document.getElementById('login-page');
      return loginPage && loginPage.style.display !== 'none';
    });
    
    if (isLoginVisible) {
      results['Open LostSeek'] = 'PASS';
    }
  } catch (e) {
    errors.push('Open LostSeek error: ' + e.message);
  }
  
  // Reset back to home for next tests
  await page.evaluate(() => { window.location.hash = '#home'; });
  await new Promise(r => setTimeout(r, 500));
  
  // Test 2: Report Lost
  try {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.lp-btn'));
      const btn = btns.find(b => b.innerText.includes('Report a Lost Item'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    
    const isLoginVisible = await page.evaluate(() => {
      const loginPage = document.getElementById('login-page');
      return loginPage && loginPage.style.display !== 'none';
    });
    
    if (isLoginVisible) results['Report Lost'] = 'PASS';
  } catch (e) {
    errors.push('Report Lost error: ' + e.message);
  }
  
  await page.evaluate(() => { window.location.hash = '#home'; });
  await new Promise(r => setTimeout(r, 500));
  
  // Test 3: Report Found
  try {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.lp-btn'));
      const btn = btns.find(b => b.innerText.includes('Report a Found Item'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    
    const isLoginVisible = await page.evaluate(() => {
      const loginPage = document.getElementById('login-page');
      return loginPage && loginPage.style.display !== 'none';
    });
    
    if (isLoginVisible) results['Report Found'] = 'PASS';
  } catch (e) {
    errors.push('Report Found error: ' + e.message);
  }
  
  await page.evaluate(() => { window.location.hash = '#home'; });
  await new Promise(r => setTimeout(r, 500));
  
  // Test 4: Reveal Story
  try {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.lp-btn'));
      const btn = btns.find(b => b.innerText.includes('Reveal the Story'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000)); // might navigate away
    
    const url = await page.url();
    if (url.includes('/story') || url.includes('story.html')) {
      results['Reveal Story'] = 'PASS';
    }
  } catch (e) {
    errors.push('Reveal Story error: ' + e.message);
  }
  
  // Test 5: Android App
  try {
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.lp-btn'));
      const btn = btns.find(b => b.innerText.includes('Get Android App'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    
    const url = await page.url();
    if (url.includes('/download') || url.includes('download.html')) {
      results['Android App'] = 'PASS';
    }
  } catch (e) {
    errors.push('Android App error: ' + e.message);
  }
  
  if (errors.length > 0) {
    results['Console errors'] = 'YES';
    console.log('Errors encountered:', errors);
  }
  
  console.log('\n--- RESULTS ---');
  for (const [key, val] of Object.entries(results)) {
    console.log(`${key}: ${val}`);
  }
  
  await browser.close();
})();
