const https = require('https');

function runPageSpeed(strategy = 'mobile') {
  const url = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://smart-campus-pro.vercel.app/&strategy=${strategy}&category=performance&category=accessibility&category=best-practices&category=seo`;
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          if (json.error) {
            return reject(new Error(json.error.message || 'PageSpeed API error'));
          }
          const lighthouse = json.lighthouseResult;
          const cats = lighthouse.categories;
          const audits = lighthouse.audits;
          
          const result = {
            strategy,
            performance: Math.round((cats.performance?.score || 0) * 100),
            accessibility: Math.round((cats.accessibility?.score || 0) * 100),
            bestPractices: Math.round((cats['best-practices']?.score || 0) * 100),
            seo: Math.round((cats.seo?.score || 0) * 100),
            fcp: audits['first-contentful-paint']?.displayValue,
            lcp: audits['largest-contentful-paint']?.displayValue,
            speedIndex: audits['speed-index']?.displayValue,
            tbt: audits['total-blocking-time']?.displayValue,
            cls: audits['cumulative-layout-shift']?.displayValue,
            lcpElement: audits['largest-contentful-paint-element']?.displayValue || audits['largest-contentful-paint-element']?.details?.items?.[0]?.node?.nodeLabel
          };
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Querying Google PageSpeed Insights API for MOBILE...');
  try {
    const mobile = await runPageSpeed('mobile');
    console.log('\n=== GOOGLE PAGESPEED RESULTS: MOBILE ===');
    console.log(`Performance:    ${mobile.performance}/100`);
    console.log(`Accessibility:  ${mobile.accessibility}/100`);
    console.log(`Best Practices: ${mobile.bestPractices}/100`);
    console.log(`SEO:            ${mobile.seo}/100`);
    console.log(`FCP:            ${mobile.fcp}`);
    console.log(`LCP:            ${mobile.lcp}`);
    console.log(`Speed Index:    ${mobile.speedIndex}`);
    console.log(`TBT:            ${mobile.tbt}`);
    console.log(`CLS:            ${mobile.cls}`);
    console.log(`LCP Element:    ${mobile.lcpElement}`);
  } catch (err) {
    console.error('Mobile PageSpeed check failed:', err.message);
  }

  console.log('\nQuerying Google PageSpeed Insights API for DESKTOP...');
  try {
    const desktop = await runPageSpeed('desktop');
    console.log('\n=== GOOGLE PAGESPEED RESULTS: DESKTOP ===');
    console.log(`Performance:    ${desktop.performance}/100`);
    console.log(`Accessibility:  ${desktop.accessibility}/100`);
    console.log(`Best Practices: ${desktop.bestPractices}/100`);
    console.log(`SEO:            ${desktop.seo}/100`);
    console.log(`FCP:            ${desktop.fcp}`);
    console.log(`LCP:            ${desktop.lcp}`);
    console.log(`Speed Index:    ${desktop.speedIndex}`);
    console.log(`TBT:            ${desktop.tbt}`);
    console.log(`CLS:            ${desktop.cls}`);
    console.log(`LCP Element:    ${desktop.lcpElement}`);
  } catch (err) {
    console.error('Desktop PageSpeed check failed:', err.message);
  }
}

main();
