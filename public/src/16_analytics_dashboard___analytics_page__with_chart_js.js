/*undefined
   ========================================================================== */
let analyticsChartInstances = {};

function renderAnalyticsPage() {
  renderAnalyticsStats();
  initAnalyticsCharts();
  renderCampusHeatmap();
}

function renderAnalyticsStats() {
  const totalReports = appState.lostReports.length + appState.foundReports.length;
  const returnedCount = appState.lostReports.filter(r => r.status === 'Returned' || r.status === 'Verified').length +
    appState.foundReports.filter(r => r.status === 'Returned' || r.status === 'Verified').length;
  const recoveryRate = totalReports > 0 ? Math.round((returnedCount / totalReports) * 100) : 0;

  const matches = calculateMatchesList();
  const avgConfidence = matches.length > 0
    ? Math.round(matches.reduce((acc, m) => acc + m.score, 0) / matches.length)
    : "No data";

  const totalEl = document.getElementById('an-total-reports');
  const recoveryEl = document.getElementById('an-recovery-rate');
  const confEl = document.getElementById('an-avg-confidence');
  const timeEl = document.getElementById('an-avg-time');

  if (totalEl) totalEl.textContent = totalReports;
  if (recoveryEl) recoveryEl.textContent = `${recoveryRate}%`;
  if (confEl) confEl.textContent = avgConfidence === "No data" ? avgConfidence : `${avgConfidence}%`;
  if (timeEl) timeEl.textContent = 'No data';
}

function initAnalyticsCharts() {
  if (typeof Chart === 'undefined') {
    loadScriptAsync('https://cdn.jsdelivr.net/npm/chart.js').then(() => initAnalyticsCharts()).catch(() => { });
    return;
  }

  // Safely destroy existing charts before recreating
  ['chart-categories', 'chart-timeline', 'chart-recovery', 'chart-locations'].forEach(id => {
    if (analyticsChartInstances[id]) {
      analyticsChartInstances[id].destroy();
      analyticsChartInstances[id] = null;
    }
    const existing = Chart.getChart(id);
    if (existing) existing.destroy();
  });

  const allItems = [...appState.lostReports, ...appState.foundReports];
  if (allItems.length === 0) {
    const chartCanvases = document.querySelectorAll('.chart-card canvas');
    chartCanvases.forEach(canvas => {
      const parent = canvas.parentElement;
      if (parent) {
        parent.innerHTML = `<div class="empty-state" style="padding: 40px 20px; text-align: center; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
          <i data-lucide="bar-chart-2" style="width: 32px; height: 32px; margin-bottom: 12px; opacity: 0.5;"></i>
          <p>No data available yet</p>
        </div>`;
      }
    });
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    return;
  }

  const categories = [
    { key: 'id-card', label: 'ID Cards' },
    { key: 'electronics', label: 'Electronics' },
    { key: 'wallet', label: 'Wallets' },
    { key: 'keys', label: 'Keys' },
    { key: 'bags', label: 'Bags' },
    { key: 'documents', label: 'Documents' },
    { key: 'clothing', label: 'Clothing' },
    { key: 'misc', label: 'Misc' }
  ];

  // 1. Doughnut Chart: Items by Category
  const catCounts = categories.map(c => allItems.filter(i => (i.category === c.key || i.category === c.key + 's')).length);
  const catCanvas = document.getElementById('chart-categories');
  if (catCanvas) {
    analyticsChartInstances['chart-categories'] = new Chart(catCanvas, {
      type: 'doughnut',
      data: {
        labels: categories.map(c => c.label),
        datasets: [{
          data: catCounts,
          backgroundColor: [
            '#6c63ff', '#00d4aa', '#ffa502', '#ff4757',
            '#a29bfe', '#00cec9', '#fd79a8', '#636e72'
          ],
          borderColor: '#12121e',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#ffffff', boxWidth: 12, padding: 14, font: { family: 'Inter', size: 11 } }
          }
        }
      }
    });
  }

  // 2. Line Chart: Reports Over Time (Last 7 Days)
  const timelineCanvas = document.getElementById('chart-timeline');
  if (timelineCanvas) {
    const days = [];
    const lostCounts = [];
    const foundCounts = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days.push(dateString);

      const isSameDay = (isoStr) => {
        if (!isoStr) return false;
        const target = new Date(isoStr);
        return target.getDate() === d.getDate() && target.getMonth() === d.getMonth() && target.getFullYear() === d.getFullYear();
      };

      lostCounts.push(appState.lostReports.filter(r => isSameDay(r.createdAt)).length);
      foundCounts.push(appState.foundReports.filter(r => isSameDay(r.createdAt)).length);
    }

    analyticsChartInstances['chart-timeline'] = new Chart(timelineCanvas, {
      type: 'line',
      data: {
        labels: days,
        datasets: [
          {
            label: 'Lost Reports',
            data: lostCounts,
            borderColor: '#6c63ff',
            backgroundColor: 'rgba(108, 99, 255, 0.15)',
            tension: 0.35,
            fill: true
          },
          {
            label: 'Found Reports',
            data: foundCounts,
            borderColor: '#00d4aa',
            backgroundColor: 'rgba(0, 212, 170, 0.15)',
            tension: 0.35,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: 'rgba(255,255,255,0.6)' }, grid: { color: 'rgba(255,255,255,0.06)' } },
          y: { ticks: { color: 'rgba(255,255,255,0.6)' }, grid: { color: 'rgba(255,255,255,0.06)' }, beginAtZero: true }
        },
        plugins: {
          legend: { labels: { color: '#ffffff', boxWidth: 12, padding: 12 } }
        }
      }
    });
  }

  // 3. Bar Chart: Recovery Rate by Category (%)
  const recoveryCanvas = document.getElementById('chart-recovery');
  if (recoveryCanvas) {
    const recoveryRates = categories.map(c => {
      const itemsInCat = allItems.filter(i => i.category === c.key || i.category === c.key + 's');
      if (itemsInCat.length === 0) return 0; // realistic fallback
      const returnedInCat = itemsInCat.filter(i => i.status === 'Returned' || i.status === 'Verified').length;
      return Math.round((returnedInCat / itemsInCat.length) * 100) || 0;
    });

    analyticsChartInstances['chart-recovery'] = new Chart(recoveryCanvas, {
      type: 'bar',
      data: {
        labels: categories.map(c => c.label),
        datasets: [{
          label: 'Recovery %',
          data: recoveryRates,
          backgroundColor: '#00d4aa',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: 'rgba(255,255,255,0.6)', font: { size: 10 } }, grid: { display: false } },
          y: { ticks: { color: 'rgba(255,255,255,0.6)' }, grid: { color: 'rgba(255,255,255,0.06)' }, max: 100, beginAtZero: true }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  // 4. Horizontal Bar: Top Loss Locations
  const locationsCanvas = document.getElementById('chart-locations');
  if (locationsCanvas) {
    const zoneCountsData = CAMPUS_LOCATIONS.map(c => c.name).map(z => ({
      name: z,
      count: allItems.filter(i => normalizeLocationName(i.location) === normalizeLocationName(z)).length
    }));

    zoneCountsData.sort((a, b) => b.count - a.count);
    const topZones = zoneCountsData.slice(0, 6);

    analyticsChartInstances['chart-locations'] = new Chart(locationsCanvas, {
      type: 'bar',
      data: {
        labels: topZones.map(z => z.name),
        datasets: [{
          label: 'Incident Reports',
          data: topZones.map(z => z.count),
          backgroundColor: '#ffa502',
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: 'rgba(255,255,255,0.6)' }, grid: { color: 'rgba(255,255,255,0.06)' }, beginAtZero: true },
          y: { ticks: { color: 'rgba(255,255,255,0.8)' }, grid: { display: false } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}

function renderCampusHeatmap() {
  const container = document.getElementById('campus-heatmap-container');
  if (!container) return;

  const categoryIcons = {
    'Academic & Administrative': '🏢',
    'Services': '📍',
    'Hostel / House Areas': '🏠',
    'Recreation': '📍',
    'Food & Dining': '☕',
    'Unknown': '📍'
  };
  const campusZones = CAMPUS_LOCATIONS.map(c => ({ name: c.name, icon: categoryIcons[c.category] || '📍', desc: c.status }));

  const allItems = [...appState.lostReports, ...appState.foundReports];

  container.innerHTML = campusZones.map(zone => {
    const count = allItems.filter(i => normalizeLocationName(i.location) === normalizeLocationName(zone.name)).length;

    let intensityClass = 'heat-low';
    if (count >= 3) intensityClass = 'heat-high';
    else if (count >= 1) intensityClass = 'heat-med';

    return `
      <div class="heatmap-cell ${intensityClass}" title="${zone.name}: ${count} reports recorded">
        <div class="heatmap-cell-top">
          <span class="heatmap-zone-icon">${zone.icon}</span>
          <span class="heatmap-count-badge">${count} Reports</span>
        </div>
        <div>
          <div class="heatmap-zone-name">${escapeHTML(zone.name)}</div>
          <div class="heatmap-zone-desc">${escapeHTML(zone.desc)}</div>
        </div>
      </div>
    `;
  }).join('');
}
