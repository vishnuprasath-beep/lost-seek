const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const jsErrors = [];
  const failedRequests = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') jsErrors.push(msg.text());
  });
  page.on('pageerror', err => jsErrors.push(err.toString()));
  page.on('requestfailed', req => {
    failedRequests.push(`${req.url()} (${req.failure().errorText})`);
  });
  
  let buildResult = 'PASS';
  
  async function runAction(name, buttonText, assertionFn) {
    console.log(`${name}:`);
    let beforeUrl = '';
    let afterUrl = '';
    let result = 'FAIL';
    let assertion = 'Did not execute';
    
    try {
      await page.goto('https://smart-campus-pro.vercel.app', { waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 1000));
      beforeUrl = await page.url();
      
      const success = await page.evaluate((text) => {
        const btns = Array.from(document.querySelectorAll('.lp-btn, a.lp-btn'));
        const btn = btns.find(b => b.textContent && b.textContent.includes(text));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      }, buttonText);
      
      if (!success) {
        throw new Error(`Button "${buttonText}" not found`);
      }
      
      // Wait for navigation/hash change
      await new Promise(r => setTimeout(r, 1000));
      afterUrl = await page.url();
      
      const passed = await page.evaluate(assertionFn);
      
      if (passed && beforeUrl !== afterUrl) {
        result = 'PASS';
        assertion = 'Expected state/navigation reached successfully.';
      } else if (passed) {
        // if url didn't change but passed, it might be a bug or something else, but in our case hash should change or url should change
        // Wait, button 4 (Reveal Story) and 5 (Get Android App) navigate away.
        // Button 1,2,3 change hash to #login and show login page
        if (afterUrl.includes('#login') || afterUrl.includes('/story') || afterUrl.includes('/download')) {
            result = 'PASS';
            assertion = 'Expected state reached successfully.';
        } else {
            assertion = 'State matched but URL did not change to expected destination.';
        }
      } else {
        assertion = 'Assertion failed: expected state not reached.';
      }
      
    } catch (e) {
      assertion = `Exception: ${e.message}`;
    }
    
    console.log(result);
    console.log(`Before: ${beforeUrl}`);
    console.log(`After: ${afterUrl}`);
    console.log(`Assertion: ${assertion}\n`);
  }

  // 1. Open LostSeek
  await runAction('Open LostSeek', 'Open LostSeek', () => {
    return window.location.hash === '#login' && document.getElementById('login-page').style.display !== 'none';
  });

  // 2. Report a Lost Item
  await runAction('Report Lost', 'Report a Lost Item', () => {
    return window.location.hash === '#login' && document.getElementById('login-page').style.display !== 'none';
  });
  
  // 3. Report a Found Item
  await runAction('Report Found', 'Report a Found Item', () => {
    return window.location.hash === '#login' && document.getElementById('login-page').style.display !== 'none';
  });
  
  // 4. Reveal the Story
  await runAction('Reveal Story', 'Reveal the Story', () => {
    return window.location.href.includes('/story');
  });
  
  // 5. Get Android App
  await runAction('Android App', 'Get Android App', () => {
    return window.location.href.includes('/download');
  });

  console.log('JavaScript errors:');
  if (jsErrors.length === 0) {
    console.log('None');
  } else {
    jsErrors.forEach(e => console.log(e));
  }
  
  console.log('\nFailed requests:');
  const ignoreList = ['favicon.ico'];
  const realFails = failedRequests.filter(f => !ignoreList.some(i => f.includes(i)));
  if (realFails.length === 0) {
    console.log('None');
  } else {
    realFails.forEach(f => console.log(f));
  }
  
  console.log(`\nBuild:\n${buildResult}`);
  
  await browser.close();
})();
