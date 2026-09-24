// Automated Test Suite for LostSeek Public Landing Page & Download Portal
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('LOSTSEEK PUBLIC LANDING PAGE — VERIFICATION SUITE');
console.log('================================================================');

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// TEST 1: SEO, METADATA & SCHEMA.ORG JSON-LD
// -----------------------------------------------------------------------------
console.log('\n--- 1. SEO, CANONICAL & STRUCTURED DATA ---');

const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

assert(indexHtml.includes('<title>LostSeek — AI-Powered Smart Campus Lost &amp; Found</title>') ||
       indexHtml.includes('<title>LostSeek — AI-Powered Smart Campus Lost & Found</title>'),
       'Title matches "LostSeek — AI-Powered Smart Campus Lost & Found"');

assert(indexHtml.includes('name="description"') && indexHtml.includes('smart campus lost-and-found platform'),
       'Meta description exists and describes platform accurately');

assert(indexHtml.includes('<link rel="canonical" href="https://smart-campus-pro.vercel.app/">'),
       'Canonical link points to https://smart-campus-pro.vercel.app/');

assert(indexHtml.includes('property="og:title"') && indexHtml.includes('property="og:image"'),
       'Open Graph meta tags present');

assert(indexHtml.includes('name="twitter:card"') && indexHtml.includes('name="twitter:title"'),
       'Twitter Card meta tags present');

// JSON-LD validation
const jsonLdMatch = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
assert(jsonLdMatch && jsonLdMatch[1], 'JSON-LD script block found');
if (jsonLdMatch) {
  try {
    const parsed = JSON.parse(jsonLdMatch[1]);
    assert(parsed['@type'] === 'WebApplication', 'JSON-LD @type is WebApplication');
    assert(parsed.name === 'LostSeek', 'JSON-LD name is LostSeek');
    assert(parsed.url === 'https://smart-campus-pro.vercel.app', 'JSON-LD URL is valid');
  } catch (err) {
    assert(false, `JSON-LD failed to parse: ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// TEST 2: STATIC SEO & BOT FILES (robots.txt, sitemap.xml)
// -----------------------------------------------------------------------------
console.log('\n--- 2. ROBOTS.TXT & SITEMAP.XML ---');

const robotsTxt = fs.readFileSync(path.join(__dirname, '../robots.txt'), 'utf8');
assert(robotsTxt.includes('User-agent: *'), 'robots.txt specifies User-agent: *');
assert(robotsTxt.includes('Allow: /'), 'robots.txt allows root /');
assert(robotsTxt.includes('Allow: /download'), 'robots.txt allows /download');
assert(robotsTxt.includes('Sitemap: https://smart-campus-pro.vercel.app/sitemap.xml'), 'robots.txt references sitemap.xml');

const sitemapXml = fs.readFileSync(path.join(__dirname, '../sitemap.xml'), 'utf8');
assert(sitemapXml.includes('<loc>https://smart-campus-pro.vercel.app/</loc>'), 'sitemap.xml contains root URL');
assert(sitemapXml.includes('<loc>https://smart-campus-pro.vercel.app/download</loc>'), 'sitemap.xml contains /download URL');

// -----------------------------------------------------------------------------
// TEST 3: HERO & CORE SECTIONS IN index.html
// -----------------------------------------------------------------------------
console.log('\n--- 3. LANDING PAGE CONTENT & WORKFLOW INTEGRITY ---');

assert(indexHtml.includes('id="landing-page"'), 'Section #landing-page is present');
assert(indexHtml.includes('Find what you lost.') && indexHtml.includes('what they found.'), 'Hero headline matches');
assert(indexHtml.includes('Report a Lost Item'), 'Hero has "Report a Lost Item" CTA');
assert(indexHtml.includes('Report a Found Item'), 'Hero has "Report a Found Item" CTA');
assert(indexHtml.includes('Open LostSeek'), 'Hero has "Open LostSeek" button');
assert(indexHtml.includes('Get Android App'), 'Hero has "Get Android App" button');
assert(indexHtml.includes('lp-phone-frame') && indexHtml.includes('Blue Backpack'), 'Hero phone mockup with recent reports is present');

// 5 Highlights Bar
assert(indexHtml.includes('AI Matching') && indexHtml.includes('Community Sightings') &&
       indexHtml.includes('Safe &amp; Private') && indexHtml.includes('Web + Android') &&
       indexHtml.includes('Simple &amp; Easy'), '5-item quick highlights bar present');

// 5-Step Workflow
assert(indexHtml.includes('How It Works') && indexHtml.includes('From lost to found — in just 5 simple steps.'), 'How It Works header present');
assert(indexHtml.includes('Report') && indexHtml.includes('Discover') && indexHtml.includes('AI Match') &&
       indexHtml.includes('Verify') && indexHtml.includes('Recover'), 'All 5 connected workflow steps present');

// Unique Feature: Lost it without a photo?
assert(indexHtml.includes('Lost it without a photo?'), 'Unique feature callout "Lost it without a photo?" is present');

// AI Section
assert(indexHtml.includes('AI-Assisted Matching'), 'AI-Assisted Matching section present');
assert(indexHtml.includes('Object detection') && indexHtml.includes('Image understanding') &&
       indexHtml.includes('Semantic similarity'), 'AI capabilities checklist present');
assert(indexHtml.includes('The AI produces supporting evidence for potential matches. It does not establish ownership by itself.'),
       'Mandatory AI non-ownership disclaimer present');

// I Saw Something
assert(indexHtml.includes('See Something?') && indexHtml.includes('I Saw Something'), 'I Saw Something section present');
assert(indexHtml.includes('Sightings are routed directly to the lost-item owner.'), 'Direct sighting routing to owner specified without exposing contact info');

// Privacy Section
assert(indexHtml.includes('Built with Privacy in Mind'), 'Privacy section present');
assert(indexHtml.includes('User-controlled contact sharing') && indexHtml.includes('Private ownership evidence'), 'Privacy guarantees present');

// Android Callout Banner
assert(indexHtml.includes('Get LostSeek for Android') && indexHtml.includes('/LostSeek.apk'), 'Android banner links to /LostSeek.apk');

// -----------------------------------------------------------------------------
// TEST 4: DEDICATED /download PAGE
// -----------------------------------------------------------------------------
console.log('\n--- 4. DEDICATED /download PAGE INTEGRITY ---');

const downloadHtml = fs.readFileSync(path.join(__dirname, '../download.html'), 'utf8');
assert(downloadHtml.includes('Get LostSeek for Android'), 'download.html headline present');
assert(downloadHtml.includes('href="/LostSeek.apk"'), 'download.html has direct link to /LostSeek.apk');
assert(downloadHtml.includes('Version 2.2.0'), 'download.html displays Version 2.2.0');
assert(downloadHtml.includes('Quick 3-Step Installation Guide'), 'download.html includes installation instructions');
assert(!downloadHtml.includes('Google Play Store available'), 'download.html correctly avoids false Google Play claims');

// -----------------------------------------------------------------------------
// TEST 5: JAVASCRIPT CONTROLLER FUNCTIONS IN app.js
// -----------------------------------------------------------------------------
console.log('\n--- 5. JAVASCRIPT CONTROLLER FUNCTIONS IN app.js ---');

const appJs = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
assert(appJs.includes('function showLandingPage'), 'app.js defines showLandingPage()');
assert(appJs.includes('function goToAppLogin'), 'app.js defines goToAppLogin()');
assert(appJs.includes('function goToReportLost'), 'app.js defines goToReportLost()');
assert(appJs.includes('function goToReportFound'), 'app.js defines goToReportFound()');
assert(appJs.includes('function handleLandingNav'), 'app.js defines handleLandingNav()');

// -----------------------------------------------------------------------------
// TEST 6: REGRESSION CHECK — PROFILE PICTURE CROP SUITE
// -----------------------------------------------------------------------------
console.log('\n--- 6. REGRESSION CHECK: PROFILE PICTURE CROP SUITE ---');

const cropSuite = require('./test_crop_suite.js');

console.log('\n================================================================');
console.log(`TOTAL LANDING PAGE TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
console.log('================================================================\n');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
