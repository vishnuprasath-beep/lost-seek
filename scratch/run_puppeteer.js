const puppeteer = require('puppeteer-core');
const fs = require('fs');
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  console.log('Launching Edge...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: "new"
  });
  
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  await page.setViewport({ width: 1200, height: 800 });
  
  console.log('Navigating to https://smart-campus-pro.vercel.app...');
  await page.goto('https://smart-campus-pro.vercel.app', { waitUntil: 'networkidle2' });
  
  await page.waitForSelector('.manga-viewer-container');
  console.log('Testing Manga Viewer...');
  
  const active1 = await page.$eval('.manga-slide.active', el => el.getAttribute('data-page'));
  console.log('Current Active Page:', active1);
  await page.screenshot({ path: 'scratch/manga-test-1.png' });
  
  console.log('Clicking Next Button...');
  await page.click('#manga-next');
  await wait(600);
  
  const active2 = await page.$eval('.manga-slide.active', el => el.getAttribute('data-page'));
  console.log('Current Active Page after 1 click:', active2);
  await page.screenshot({ path: 'scratch/manga-test-2.png' });
  
  const img2 = await page.$eval('.manga-slide.active img', el => el.src);
  console.log('Image source on active page:', img2);
  
  console.log('Clicking Next Button...');
  await page.click('#manga-next');
  await wait(600);
  
  const active3 = await page.$eval('.manga-slide.active', el => el.getAttribute('data-page'));
  console.log('Current Active Page after 2 clicks:', active3);
  await page.screenshot({ path: 'scratch/manga-test-3.png' });
  
  await browser.close();
  console.log('Done!');
})();
