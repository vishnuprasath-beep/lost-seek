const fs = require('fs');

function parseLH(file) {
    if (!fs.existsSync(file)) return null;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const perf = data.categories.performance ? data.categories.performance.score * 100 : 'N/A';
    const a11y = data.categories.accessibility ? data.categories.accessibility.score * 100 : 'N/A';
    const lcp = data.audits['largest-contentful-paint'] ? data.audits['largest-contentful-paint'].displayValue : 'N/A';
    const lcpMs = data.audits['largest-contentful-paint'] ? data.audits['largest-contentful-paint'].numericValue : null;
    const tbt = data.audits['total-blocking-time'] ? data.audits['total-blocking-time'].displayValue : 'N/A';
    const cls = data.audits['cumulative-layout-shift'] ? data.audits['cumulative-layout-shift'].displayValue : 'N/A';
    const totalBytes = data.audits['total-byte-weight'] ? data.audits['total-byte-weight'].numericValue : 0;
    const transferKiB = (totalBytes / 1024).toFixed(1);
    
    return { perf: Math.round(perf), a11y: Math.round(a11y), lcp, lcpMs, tbt, cls, transferKiB };
}

const res = {
    homeMobile1: parseLH('lh-home-mobile-1.json'),
    homeMobile2: parseLH('lh-home-mobile-2.json'),
    homeMobile3: parseLH('lh-home-mobile-3.json'),
    homeDesktop: parseLH('lh-home-desktop.json'),
    downloadMobile: parseLH('lh-download-mobile.json'),
    downloadDesktop: parseLH('lh-download-desktop.json')
};

console.log("=== LIGHTHOUSE RESULTS ===");

if (res.homeMobile1 && res.homeMobile2 && res.homeMobile3) {
    const scores = [res.homeMobile1.perf, res.homeMobile2.perf, res.homeMobile3.perf].sort((a, b) => a - b);
    const lcps = [res.homeMobile1.lcpMs, res.homeMobile2.lcpMs, res.homeMobile3.lcpMs].sort((a, b) => a - b);
    const medianPerf = scores[1];
    const medianLcp = (lcps[1] / 1000).toFixed(1) + ' s';
    console.log(`HOME MOBILE:`);
    console.log(`Run 1: Perf ${res.homeMobile1.perf}, LCP ${res.homeMobile1.lcp}, TBT ${res.homeMobile1.tbt}, CLS ${res.homeMobile1.cls}, Size ${res.homeMobile1.transferKiB} KiB`);
    console.log(`Run 2: Perf ${res.homeMobile2.perf}, LCP ${res.homeMobile2.lcp}, TBT ${res.homeMobile2.tbt}, CLS ${res.homeMobile2.cls}, Size ${res.homeMobile2.transferKiB} KiB`);
    console.log(`Run 3: Perf ${res.homeMobile3.perf}, LCP ${res.homeMobile3.lcp}, TBT ${res.homeMobile3.tbt}, CLS ${res.homeMobile3.cls}, Size ${res.homeMobile3.transferKiB} KiB`);
    console.log(`Median Perf: ${medianPerf}`);
    console.log(`Median LCP: ${medianLcp}`);
}

if (res.homeDesktop) {
    console.log(`HOME DESKTOP:`);
    console.log(`Perf ${res.homeDesktop.perf}, A11y ${res.homeDesktop.a11y}, LCP ${res.homeDesktop.lcp}, TBT ${res.homeDesktop.tbt}, CLS ${res.homeDesktop.cls}, Size ${res.homeDesktop.transferKiB} KiB`);
}

if (res.downloadMobile) {
    console.log(`DOWNLOAD MOBILE:`);
    console.log(`Perf ${res.downloadMobile.perf}, A11y ${res.downloadMobile.a11y}, LCP ${res.downloadMobile.lcp}, TBT ${res.downloadMobile.tbt}, CLS ${res.downloadMobile.cls}, Size ${res.downloadMobile.transferKiB} KiB`);
}

if (res.downloadDesktop) {
    console.log(`DOWNLOAD DESKTOP:`);
    console.log(`Perf ${res.downloadDesktop.perf}, A11y ${res.downloadDesktop.a11y}, LCP ${res.downloadDesktop.lcp}, TBT ${res.downloadDesktop.tbt}, CLS ${res.downloadDesktop.cls}, Size ${res.downloadDesktop.transferKiB} KiB`);
}
