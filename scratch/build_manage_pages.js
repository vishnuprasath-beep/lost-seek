const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const KSRCE_OPTGROUPS = `
                    <optgroup label="Academic / Buildings">
                      <option value="A Block">A Block</option>
                      <option value="B Block">B Block</option>
                      <option value="C Block">C Block</option>
                      <option value="D Block">D Block</option>
                      <option value="E Block">E Block</option>
                      <option value="F Block">F Block</option>
                      <option value="Administrative Block">Administrative Block</option>
                      <option value="Academic Block">Academic Block</option>
                    </optgroup>
                    <optgroup label="Food / Shops">
                      <option value="Saffron Canteen">Saffron Canteen</option>
                      <option value="West Mart">West Mart</option>
                      <option value="Cinnamon Cafe">Cinnamon Cafe</option>
                      <option value="Cucumber Cafe">Cucumber Cafe</option>
                      <option value="Mustard Cafe">Mustard Cafe</option>
                    </optgroup>
                    <optgroup label="Services">
                      <option value="Post Office">Post Office</option>
                    </optgroup>
                    <optgroup label="Hostel / House Areas">
                      <option value="Himalayan House">Himalayan House</option>
                      <option value="Tanjore House">Tanjore House</option>
                      <option value="Marina House">Marina House</option>
                      <option value="Nilgiri House">Nilgiri House</option>
                      <option value="Madura House">Madura House</option>
                    </optgroup>
                    <optgroup label="Other Campus Areas">
                      <option value="Library">Library</option>
                      <option value="Cafeteria">Cafeteria</option>
                      <option value="Main Building">Main Building</option>
                      <option value="Hostel Block A">Hostel Block A</option>
                      <option value="Hostel Block B">Hostel Block B</option>
                      <option value="Hostel Block C">Hostel Block C</option>
                      <option value="Sports Ground">Sports Ground</option>
                      <option value="Lab Complex">Lab Complex</option>
                      <option value="Parking Area">Parking Area</option>
                      <option value="Auditorium">Auditorium</option>
                      <option value="Admin Block">Admin Block</option>
                      <option value="Other">Other / Custom Location</option>
                    </optgroup>`;

// 1. Update Admin Navigation in Sidebar
const adminNavManageTarget = `<div class="nav-group" id="nav-group-admin-manage">
            <button type="button" class="nav-group-header" onclick="toggleNavGroup(this)" aria-expanded="true">
              <span>Manage</span>
              <i data-lucide="chevron-down" class="nav-group-chevron"></i>
            </button>
            <div class="nav-group-children">
              <a href="#admin" class="nav-link" data-page="admin-page" onclick="filterAdminTableTab('all')">
                <i data-lucide="clipboard-list"></i>
                <span>All Reports</span>
              </a>
              <a href="#admin-lost" class="nav-link" data-page="admin-page" onclick="filterAdminTableTab('lost')">
                <i data-lucide="search"></i>
                <span>Lost Items</span>
              </a>
              <a href="#admin-found" class="nav-link" data-page="admin-page" onclick="filterAdminTableTab('found')">
                <i data-lucide="package"></i>
                <span>Found Items</span>
              </a>
              <a href="#admin-claims" class="nav-link" data-page="admin-page" onclick="filterAdminTableTab('claims')">
                <i data-lucide="shield-check"></i>
                <span>Claims</span>
              </a>
              <a href="#admin-help" class="nav-link" data-page="admin-help-page">
                <i data-lucide="shield-alert"></i>
                <span>Help &amp; Complaints</span>
                <span class="nav-badge" id="sidebar-admin-help-badge" style="display:none;">0</span>
              </a>
            </div>
          </div>`;

const adminNavManageReplacement = `<div class="nav-group" id="nav-group-admin-manage">
            <button type="button" class="nav-group-header" onclick="toggleNavGroup(this)" aria-expanded="true">
              <span>Manage</span>
              <i data-lucide="chevron-down" class="nav-group-chevron"></i>
            </button>
            <div class="nav-group-children">
              <a href="#admin-lost" class="nav-link" data-page="admin-lost-page">
                <i data-lucide="search"></i>
                <span>Lost Items</span>
                <span class="nav-badge" id="sidebar-admin-lost-badge" style="display:none;">0</span>
              </a>
              <a href="#admin-found" class="nav-link" data-page="admin-found-page">
                <i data-lucide="package"></i>
                <span>Found Items</span>
                <span class="nav-badge" id="sidebar-admin-found-badge" style="display:none;">0</span>
              </a>
              <a href="#admin-all" class="nav-link" data-page="admin-all-page">
                <i data-lucide="clipboard-list"></i>
                <span>All Reports</span>
              </a>
              <a href="#admin-claims" class="nav-link" data-page="admin-claims-page">
                <i data-lucide="shield-check"></i>
                <span>Claims</span>
                <span class="nav-badge" id="sidebar-admin-claims-badge" style="display:none;">0</span>
              </a>
              <a href="#admin-matches" class="nav-link" data-page="admin-matches-page">
                <i data-lucide="sparkles"></i>
                <span>Match Center</span>
                <span class="nav-badge" id="sidebar-admin-matches-badge" style="display:none;">0</span>
              </a>
              <a href="#admin-help" class="nav-link" data-page="admin-help-page">
                <i data-lucide="shield-alert"></i>
                <span>Help &amp; Complaints</span>
                <span class="nav-badge" id="sidebar-admin-help-badge" style="display:none;">0</span>
              </a>
            </div>
          </div>`;

html = html.replace(adminNavManageTarget, adminNavManageReplacement);

// 2. Update Admin Dashboard Metric Cards to link to real dedicated modules
const adminHeroActionsTarget = `<div class="hero-actions-box">
                <button class="btn btn-secondary btn-sm" onclick="resetHackathonDemoData()" title="Reload Demo Dataset">
                  <i data-lucide="rotate-ccw"></i>
                  <span>Reset Demo Data</span>
                </button>
                <button class="btn btn-primary btn-sm" onclick="showPage('admin-page')">
                  <i data-lucide="shield-check"></i>
                  <span>Go to Admin Desk</span>
                </button>
              </div>`;

const adminHeroActionsReplacement = `<div class="hero-actions-box">
                <button class="btn btn-secondary btn-sm" onclick="resetHackathonDemoData()" title="Reload Demo Dataset">
                  <i data-lucide="rotate-ccw"></i>
                  <span>Reset Demo Data</span>
                </button>
                <button class="btn btn-primary btn-sm" onclick="showPage('admin-all-page')">
                  <i data-lucide="shield-check"></i>
                  <span>Go to Reports Directory</span>
                </button>
              </div>`;

html = html.replace(adminHeroActionsTarget, adminHeroActionsReplacement);

const adminStatsGridTarget = `<div class="stats-grid">
              <div class="stat-card" onclick="showPage('my-reports-page')">
                <div class="stat-icon-wrapper" style="background: rgba(20, 184, 166, 0.12); color: var(--teal-bright);">
                  <i data-lucide="folder-open"></i>
                </div>
                <div class="stat-meta">
                  <h3 id="stat-active-reports">12</h3>
                  <p>Active Reports</p>
                </div>
              </div>

              <div class="stat-card" onclick="showPage('matches-page')">
                <div class="stat-icon-wrapper" style="background: rgba(139, 92, 246, 0.12); color: var(--ai-violet);">
                  <i data-lucide="sparkles"></i>
                </div>
                <div class="stat-meta">
                  <h3 id="stat-potential-matches">5</h3>
                  <p>Possible Matches</p>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon-wrapper" style="background: rgba(34, 197, 94, 0.12); color: var(--color-success);">
                  <i data-lucide="check-circle"></i>
                </div>
                <div class="stat-meta">
                  <h3 id="stat-returned-items">1</h3>
                  <p>Returned Items</p>
                </div>
              </div>

              <div class="stat-card" onclick="showPage('admin-page')">
                <div class="stat-icon-wrapper" style="background: rgba(245, 158, 11, 0.12); color: var(--color-warning);">
                  <i data-lucide="clock"></i>
                </div>
                <div class="stat-meta">
                  <h3 id="stat-pending-claims">1</h3>
                  <p>Pending Claims</p>
                </div>
              </div>
            </div>`;

const adminStatsGridReplacement = `<div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
              <!-- Metric 1: Lost Reports -->
              <div class="stat-card" onclick="showPage('admin-lost-page')" style="cursor: pointer;">
                <div class="stat-icon-wrapper" style="background: rgba(239, 68, 68, 0.12); color: #F87171;">
                  <i data-lucide="file-question"></i>
                </div>
                <div class="stat-meta">
                  <h3 id="admin-stat-lost-reports">0</h3>
                  <p>Lost Reports</p>
                </div>
              </div>

              <!-- Metric 2: Found Reports -->
              <div class="stat-card" onclick="showPage('admin-found-page')" style="cursor: pointer;">
                <div class="stat-icon-wrapper" style="background: rgba(20, 184, 166, 0.12); color: var(--teal-bright);">
                  <i data-lucide="package"></i>
                </div>
                <div class="stat-meta">
                  <h3 id="admin-stat-found-reports">0</h3>
                  <p>Found Reports</p>
                </div>
              </div>

              <!-- Metric 3: Potential Matches -->
              <div class="stat-card" onclick="showPage('admin-matches-page')" style="cursor: pointer;">
                <div class="stat-icon-wrapper" style="background: rgba(139, 92, 246, 0.12); color: var(--ai-violet);">
                  <i data-lucide="sparkles"></i>
                </div>
                <div class="stat-meta">
                  <h3 id="admin-stat-potential-matches">0</h3>
                  <p>Potential Matches</p>
                </div>
              </div>

              <!-- Metric 4: Pending Claims -->
              <div class="stat-card" onclick="showPage('admin-claims-page')" style="cursor: pointer;">
                <div class="stat-icon-wrapper" style="background: rgba(245, 158, 11, 0.12); color: var(--color-warning);">
                  <i data-lucide="shield-alert"></i>
                </div>
                <div class="stat-meta">
                  <h3 id="admin-stat-pending-claims">0</h3>
                  <p>Pending Claims</p>
                </div>
              </div>

              <!-- Metric 5: Urgent Cases -->
              <div class="stat-card" onclick="showPage('admin-help-page')" style="cursor: pointer;">
                <div class="stat-icon-wrapper" style="background: rgba(239, 68, 68, 0.15); color: #DC2626;">
                  <i data-lucide="alert-octagon"></i>
                </div>
                <div class="stat-meta">
                  <h3 id="admin-stat-urgent-cases">0</h3>
                  <p>Urgent Cases</p>
                </div>
              </div>

              <!-- Metric 6: Recovered Items -->
              <div class="stat-card" onclick="showPage('admin-all-page', { status: 'Returned' })" style="cursor: pointer;">
                <div class="stat-icon-wrapper" style="background: rgba(34, 197, 94, 0.12); color: var(--color-success);">
                  <i data-lucide="check-circle-2"></i>
                </div>
                <div class="stat-meta">
                  <h3 id="admin-stat-recovered-items">0</h3>
                  <p>Recovered Items</p>
                </div>
              </div>
            </div>`;

html = html.replace(adminStatsGridTarget, adminStatsGridReplacement);

// 3. Define the 5 new separated sections
const fiveSeparatedAdminPages = `
        <!-- ===================================================================
             PAGE: ADMIN LOST ITEMS ONLY (#admin-lost-page)
             =================================================================== -->
        <section id="admin-lost-page" class="page-section" style="display: none;">
          <div class="page-header-row" style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(239, 68, 68, 0.12); color: #F87171; padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; margin-bottom: 8px;">
                <i data-lucide="search" style="width: 14px; height: 14px;"></i>
                <span>Lost Property Registry</span>
              </div>
              <h1 style="margin: 0; font-size: 1.75rem; color: var(--text-primary);">Lost Items Management</h1>
              <p style="margin: 6px 0 0; color: var(--text-secondary); font-size: 0.95rem;">
                Displaying ONLY reports where property was reported as lost. Correlate prospective finders &amp; update resolution statuses.
              </p>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <button type="button" class="btn btn-secondary" onclick="renderAdminLostPage()">
                <i data-lucide="refresh-cw"></i>
                <span>Refresh</span>
              </button>
              <button type="button" class="btn btn-primary" onclick="showPage('report-lost-page')">
                <i data-lucide="plus"></i>
                <span>Report Lost</span>
              </button>
            </div>
          </div>

          <!-- Lost Metric Pills -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 20px;">
            <div class="glass-card stat-card" style="padding: 14px 18px;">
              <div class="stat-label">Total Lost</div>
              <div class="stat-value" id="admin-lost-metric-total" style="font-size: 1.5rem;">0</div>
            </div>
            <div class="glass-card stat-card" style="padding: 14px 18px; border-top: 3px solid #3B82F6;">
              <div class="stat-label" style="color: #60A5FA;">Actively Looking</div>
              <div class="stat-value" id="admin-lost-metric-looking" style="font-size: 1.5rem; color: #60A5FA;">0</div>
            </div>
            <div class="glass-card stat-card" style="padding: 14px 18px; border-top: 3px solid var(--ai-violet);">
              <div class="stat-label" style="color: var(--ai-violet);">Possible Matches</div>
              <div class="stat-value" id="admin-lost-metric-matches" style="font-size: 1.5rem; color: var(--ai-violet);">0</div>
            </div>
            <div class="glass-card stat-card" style="padding: 14px 18px; border-top: 3px solid #F59E0B;">
              <div class="stat-label" style="color: #FBBF24;">Claims in Verification</div>
              <div class="stat-value" id="admin-lost-metric-claims" style="font-size: 1.5rem; color: #FBBF24;">0</div>
            </div>
            <div class="glass-card stat-card" style="padding: 14px 18px; border-top: 3px solid #10B981;">
              <div class="stat-label" style="color: #34D399;">Recovered / Reunited</div>
              <div class="stat-value" id="admin-lost-metric-recovered" style="font-size: 1.5rem; color: #34D399;">0</div>
            </div>
          </div>

          <!-- Filter Controls -->
          <div class="glass-card" style="margin-bottom: 20px; padding: 16px 20px;">
            <div class="filter-pills-row">
              <div class="header-search" style="display: flex; flex: 1; min-width: 220px;">
                <i data-lucide="search"></i>
                <input type="text" id="admin-lost-search-input" class="input-glass" placeholder="Search by item title, description, brand, ID, reporter..." oninput="handleAdminLostFilterChange()">
              </div>
              <select id="admin-lost-filter-category" class="input-glass filter-select" onchange="handleAdminLostFilterChange()">
                <option value="">All Categories</option>
                <option value="id-card">ID Cards</option>
                <option value="electronics">Electronics</option>
                <option value="wallet">Wallets</option>
                <option value="keys">Keys</option>
                <option value="bags">Bags</option>
                <option value="documents">Documents</option>
                <option value="clothing">Clothing</option>
                <option value="accessories">Accessories</option>
                <option value="misc">Miscellaneous</option>
              </select>
              <select id="admin-lost-filter-location" class="input-glass filter-select" onchange="handleAdminLostFilterChange()">
                <option value="">All Campus Locations</option>
                ${KSRCE_OPTGROUPS}
              </select>
              <select id="admin-lost-filter-status" class="input-glass filter-select" onchange="handleAdminLostFilterChange()">
                <option value="">All Statuses</option>
                <option value="Looking">Looking</option>
                <option value="Possible Match">Possible Match</option>
                <option value="Claim Submitted">Claim Submitted</option>
                <option value="Under Verification">Under Verification</option>
                <option value="Recovered">Recovered</option>
              </select>
              <select id="admin-lost-filter-sort" class="input-glass filter-select" onchange="handleAdminLostFilterChange()">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>
          </div>

          <!-- Lost Reports Table -->
          <div class="glass-card" style="padding: 0; overflow: hidden;">
            <div class="admin-table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Report ID</th>
                    <th>Item &amp; Details</th>
                    <th>Category</th>
                    <th>Color / Brand</th>
                    <th>Lost Location</th>
                    <th>Date / Time</th>
                    <th>Reporter</th>
                    <th>Status</th>
                    <th>Matches</th>
                    <th style="text-align: right;">Actions</th>
                  </tr>
                </thead>
                <tbody id="admin-lost-table-tbody">
                  <!-- Rendered via JS -->
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- ===================================================================
             PAGE: ADMIN FOUND ITEMS ONLY (#admin-found-page)
             =================================================================== -->
        <section id="admin-found-page" class="page-section" style="display: none;">
          <div class="page-header-row" style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(20, 184, 166, 0.12); color: var(--teal-bright); padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; margin-bottom: 8px;">
                <i data-lucide="package" style="width: 14px; height: 14px;"></i>
                <span>Found Property Custody</span>
              </div>
              <h1 style="margin: 0; font-size: 1.75rem; color: var(--text-primary);">Found Items &amp; Custody Inventory</h1>
              <p style="margin: 6px 0 0; color: var(--text-secondary); font-size: 0.95rem;">
                Displaying ONLY reports where items were reported as found. Manage storage locker custody, identify prospective owners &amp; authorize returns.
              </p>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <button type="button" class="btn btn-secondary" onclick="renderAdminFoundPage()">
                <i data-lucide="refresh-cw"></i>
                <span>Refresh</span>
              </button>
              <button type="button" class="btn btn-primary" onclick="showPage('report-found-page')">
                <i data-lucide="plus"></i>
                <span>Report Found</span>
              </button>
            </div>
          </div>

          <!-- Found Metric Pills -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 20px;">
            <div class="glass-card stat-card" style="padding: 14px 18px;">
              <div class="stat-label">Total Found</div>
              <div class="stat-value" id="admin-found-metric-total" style="font-size: 1.5rem;">0</div>
            </div>
            <div class="glass-card stat-card" style="padding: 14px 18px; border-top: 3px solid #3B82F6;">
              <div class="stat-label" style="color: #60A5FA;">In Security Lockers</div>
              <div class="stat-value" id="admin-found-metric-lockers" style="font-size: 1.5rem; color: #60A5FA;">0</div>
            </div>
            <div class="glass-card stat-card" style="padding: 14px 18px; border-top: 3px solid #F59E0B;">
              <div class="stat-label" style="color: #FBBF24;">With Finder</div>
              <div class="stat-value" id="admin-found-metric-finder" style="font-size: 1.5rem; color: #FBBF24;">0</div>
            </div>
            <div class="glass-card stat-card" style="padding: 14px 18px; border-top: 3px solid var(--ai-violet);">
              <div class="stat-label" style="color: var(--ai-violet);">Possible Owners</div>
              <div class="stat-value" id="admin-found-metric-matches" style="font-size: 1.5rem; color: var(--ai-violet);">0</div>
            </div>
            <div class="glass-card stat-card" style="padding: 14px 18px; border-top: 3px solid #10B981;">
              <div class="stat-label" style="color: #34D399;">Handed Over / Returned</div>
              <div class="stat-value" id="admin-found-metric-returned" style="font-size: 1.5rem; color: #34D399;">0</div>
            </div>
          </div>

          <!-- Filter Controls -->
          <div class="glass-card" style="margin-bottom: 20px; padding: 16px 20px;">
            <div class="filter-pills-row">
              <div class="header-search" style="display: flex; flex: 1; min-width: 220px;">
                <i data-lucide="search"></i>
                <input type="text" id="admin-found-search-input" class="input-glass" placeholder="Search by item title, description, brand, ID, finder..." oninput="handleAdminFoundFilterChange()">
              </div>
              <select id="admin-found-filter-category" class="input-glass filter-select" onchange="handleAdminFoundFilterChange()">
                <option value="">All Categories</option>
                <option value="id-card">ID Cards</option>
                <option value="electronics">Electronics</option>
                <option value="wallet">Wallets</option>
                <option value="keys">Keys</option>
                <option value="bags">Bags</option>
                <option value="documents">Documents</option>
                <option value="clothing">Clothing</option>
                <option value="accessories">Accessories</option>
                <option value="misc">Miscellaneous</option>
              </select>
              <select id="admin-found-filter-location" class="input-glass filter-select" onchange="handleAdminFoundFilterChange()">
                <option value="">All Campus Locations</option>
                ${KSRCE_OPTGROUPS}
              </select>
              <select id="admin-found-filter-status" class="input-glass filter-select" onchange="handleAdminFoundFilterChange()">
                <option value="">All Statuses</option>
                <option value="Looking">Looking</option>
                <option value="Possible Owner">Possible Owner</option>
                <option value="Claim Submitted">Claim Submitted</option>
                <option value="Returned">Returned</option>
              </select>
              <select id="admin-found-filter-custody" class="input-glass filter-select" onchange="handleAdminFoundFilterChange()">
                <option value="">All Custody</option>
                <option value="desk">At Security Desk Lockers</option>
                <option value="finder">With Finder</option>
              </select>
              <select id="admin-found-filter-sort" class="input-glass filter-select" onchange="handleAdminFoundFilterChange()">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>
          </div>

          <!-- Found Reports Table -->
          <div class="glass-card" style="padding: 0; overflow: hidden;">
            <div class="admin-table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Report ID</th>
                    <th>Item &amp; Details</th>
                    <th>Category</th>
                    <th>Color / Brand</th>
                    <th>Found Location</th>
                    <th>Date / Time</th>
                    <th>Finder &amp; Custody</th>
                    <th>Status</th>
                    <th>Owner Matches</th>
                    <th style="text-align: right;">Actions</th>
                  </tr>
                </thead>
                <tbody id="admin-found-table-tbody">
                  <!-- Rendered via JS -->
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- ===================================================================
             PAGE: ADMIN ALL REPORTS COMBINED (#admin-all-page)
             =================================================================== -->
        <section id="admin-all-page" class="page-section" style="display: none;">
          <div class="page-header-row" style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(59, 130, 246, 0.12); color: #60A5FA; padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; margin-bottom: 8px;">
                <i data-lucide="clipboard-list" style="width: 14px; height: 14px;"></i>
                <span>Institutional Archive</span>
              </div>
              <h1 style="margin: 0; font-size: 1.75rem; color: var(--text-primary);">All Campus Reports Directory</h1>
              <p style="margin: 6px 0 0; color: var(--text-secondary); font-size: 0.95rem;">
                Complete master repository combining LOST and FOUND records with clear visual demarcation and multi-parameter filtering.
              </p>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <button type="button" class="btn btn-secondary" onclick="renderAdminAllReportsPage()">
                <i data-lucide="refresh-cw"></i>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <!-- All Reports Filter Bar -->
          <div class="glass-card" style="margin-bottom: 20px; padding: 16px 20px;">
            <div class="filter-pills-row">
              <div class="header-search" style="display: flex; flex: 1; min-width: 220px;">
                <i data-lucide="search"></i>
                <input type="text" id="admin-all-search-input" class="input-glass" placeholder="Search by title, description, ID, person, location..." oninput="handleAdminAllFilterChange()">
              </div>
              <select id="admin-all-filter-type" class="input-glass filter-select" onchange="handleAdminAllFilterChange()">
                <option value="">All Report Types (Lost &amp; Found)</option>
                <option value="LOST">Lost Reports Only</option>
                <option value="FOUND">Found Reports Only</option>
              </select>
              <select id="admin-all-filter-category" class="input-glass filter-select" onchange="handleAdminAllFilterChange()">
                <option value="">All Categories</option>
                <option value="id-card">ID Cards</option>
                <option value="electronics">Electronics</option>
                <option value="wallet">Wallets</option>
                <option value="keys">Keys</option>
                <option value="bags">Bags</option>
                <option value="documents">Documents</option>
                <option value="clothing">Clothing</option>
                <option value="accessories">Accessories</option>
                <option value="misc">Miscellaneous</option>
              </select>
              <select id="admin-all-filter-location" class="input-glass filter-select" onchange="handleAdminAllFilterChange()">
                <option value="">All Campus Locations</option>
                ${KSRCE_OPTGROUPS}
              </select>
              <select id="admin-all-filter-status" class="input-glass filter-select" onchange="handleAdminAllFilterChange()">
                <option value="">All Statuses</option>
                <option value="Looking">Looking</option>
                <option value="Possible Match">Possible Match / Owner</option>
                <option value="Claim Submitted">Claim Submitted</option>
                <option value="Under Verification">Under Verification</option>
                <option value="Recovered">Recovered / Returned</option>
              </select>
              <select id="admin-all-filter-sort" class="input-glass filter-select" onchange="handleAdminAllFilterChange()">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>
          </div>

          <!-- All Reports Table -->
          <div class="glass-card" style="padding: 0; overflow: hidden;">
            <div class="admin-table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Report ID</th>
                    <th>Item &amp; Details</th>
                    <th>Category</th>
                    <th>Color / Brand</th>
                    <th>Campus Location</th>
                    <th>Date Reported</th>
                    <th>Person</th>
                    <th>Status</th>
                    <th style="text-align: right;">Actions</th>
                  </tr>
                </thead>
                <tbody id="admin-all-table-tbody">
                  <!-- Rendered via JS -->
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- ===================================================================
             PAGE: ADMIN CLAIMS & VERIFICATION (#admin-claims-page)
             =================================================================== -->
        <section id="admin-claims-page" class="page-section" style="display: none;">
          <div class="page-header-row" style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(245, 158, 11, 0.12); color: #F59E0B; padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; margin-bottom: 8px;">
                <i data-lucide="shield-check" style="width: 14px; height: 14px;"></i>
                <span>Claims Verification &amp; Release</span>
              </div>
              <h1 style="margin: 0; font-size: 1.75rem; color: var(--text-primary);">Claims &amp; Ownership Verification</h1>
              <p style="margin: 6px 0 0; color: var(--text-secondary); font-size: 0.95rem;">
                Dedicated claims management module. Evaluate claimant secret proof, examine AI matching evidence &amp; authorize safe physical handovers.
              </p>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <button type="button" class="btn btn-secondary" onclick="renderAdminClaimsPage()">
                <i data-lucide="refresh-cw"></i>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <!-- Claims Metric Cards -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px;">
            <div class="glass-card stat-card" style="padding: 14px 18px;">
              <div class="stat-label">Total Claims</div>
              <div class="stat-value" id="admin-claims-metric-total" style="font-size: 1.5rem;">0</div>
            </div>
            <div class="glass-card stat-card" style="padding: 14px 18px; border-top: 3px solid #F59E0B;">
              <div class="stat-label" style="color: #FBBF24;">Pending Review</div>
              <div class="stat-value" id="admin-claims-metric-pending" style="font-size: 1.5rem; color: #FBBF24;">0</div>
            </div>
            <div class="glass-card stat-card" style="padding: 14px 18px; border-top: 3px solid #3B82F6;">
              <div class="stat-label" style="color: #60A5FA;">Under Verification</div>
              <div class="stat-value" id="admin-claims-metric-verification" style="font-size: 1.5rem; color: #60A5FA;">0</div>
            </div>
            <div class="glass-card stat-card" style="padding: 14px 18px; border-top: 3px solid #10B981;">
              <div class="stat-label" style="color: #34D399;">Approved (Ready)</div>
              <div class="stat-value" id="admin-claims-metric-approved" style="font-size: 1.5rem; color: #34D399;">0</div>
            </div>
            <div class="glass-card stat-card" style="padding: 14px 18px; border-top: 3px solid #64748B;">
              <div class="stat-label" style="color: var(--text-muted);">Completed Handover</div>
              <div class="stat-value" id="admin-claims-metric-completed" style="font-size: 1.5rem; color: var(--text-muted);">0</div>
            </div>
          </div>

          <!-- Claims Filter Tabs -->
          <div class="glass-card" style="margin-bottom: 20px; padding: 16px 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
              <div class="admin-help-tabs-wrap" id="admin-claims-tabs">
                <button type="button" class="btn btn-sm admin-claims-tab active" data-tab="all" onclick="filterAdminClaimsTab('all', this)">All Claims</button>
                <button type="button" class="btn btn-sm btn-secondary admin-claims-tab" data-tab="Pending" onclick="filterAdminClaimsTab('Pending', this)">Pending</button>
                <button type="button" class="btn btn-sm btn-secondary admin-claims-tab" data-tab="Under Verification" onclick="filterAdminClaimsTab('Under Verification', this)">Under Verification</button>
                <button type="button" class="btn btn-sm btn-secondary admin-claims-tab" data-tab="Approved" onclick="filterAdminClaimsTab('Approved', this)">Approved</button>
                <button type="button" class="btn btn-sm btn-secondary admin-claims-tab" data-tab="Rejected" onclick="filterAdminClaimsTab('Rejected', this)">Rejected</button>
                <button type="button" class="btn btn-sm btn-secondary admin-claims-tab" data-tab="Completed" onclick="filterAdminClaimsTab('Completed', this)">Completed</button>
              </div>

              <div style="display: flex; gap: 10px; align-items: center; flex: 1; max-width: 360px;">
                <input type="text" id="admin-claims-search-input" class="input-glass" placeholder="Search by claim ID, student, item title..." oninput="handleAdminClaimsFilterChange()">
              </div>
            </div>
          </div>

          <!-- Claims Table -->
          <div class="glass-card" style="padding: 0; overflow: hidden;">
            <div class="admin-table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Claim ID</th>
                    <th>Lost Item</th>
                    <th>Found Item</th>
                    <th>Claimant</th>
                    <th>Finder</th>
                    <th>Match Score</th>
                    <th>Secret Verification Evidence</th>
                    <th>Status</th>
                    <th style="text-align: right;">Actions</th>
                  </tr>
                </thead>
                <tbody id="admin-claims-table-tbody">
                  <!-- Rendered via JS -->
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- ===================================================================
             PAGE: ADMIN MATCH CENTER (#admin-matches-page)
             =================================================================== -->
        <section id="admin-matches-page" class="page-section" style="display: none;">
          <div class="page-header-row" style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(139, 92, 246, 0.12); color: var(--ai-violet); padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; margin-bottom: 8px;">
                <i data-lucide="sparkles" style="width: 14px; height: 14px;"></i>
                <span>Multi-Signal Correlation Engine</span>
              </div>
              <h1 style="margin: 0; font-size: 1.75rem; color: var(--text-primary);">AI Match Center</h1>
              <p style="margin: 6px 0 0; color: var(--text-secondary); font-size: 0.95rem;">
                Cross-modal intelligence matching lost text descriptions (no photo required) with found item photographs and campus locations.
              </p>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <button type="button" class="btn btn-secondary" onclick="renderAdminMatchCenterPage()">
                <i data-lucide="refresh-cw"></i>
                <span>Refresh Engine</span>
              </button>
            </div>
          </div>

          <!-- Match Center Metrics & Controls -->
          <div class="glass-card" style="margin-bottom: 24px; padding: 16px 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary);">Confidence Filter:</span>
                <select id="admin-match-filter-threshold" class="input-glass" style="width: auto;" onchange="handleAdminMatchFilterChange()">
                  <option value="40">All Potential Matches (&ge; 40%)</option>
                  <option value="60">Medium &amp; High Confidence (&ge; 60%)</option>
                  <option value="75">High Confidence Only (&ge; 75%)</option>
                  <option value="85">Strong Probability (&ge; 85%)</option>
                </select>
              </div>

              <div style="display: flex; gap: 10px; align-items: center; flex: 1; max-width: 360px;">
                <input type="text" id="admin-match-search-input" class="input-glass" placeholder="Search by item keywords or landmark..." oninput="handleAdminMatchFilterChange()">
              </div>
            </div>
          </div>

          <!-- Candidate Matches Grid / Cards Container -->
          <div id="admin-matches-cards-container" style="display: flex; flex-direction: column; gap: 18px;">
            <!-- Rendered dynamically by renderAdminMatchCenterPage() -->
          </div>
        </section>
`;

// Replace #admin-page with the 5 new separated sections
const oldAdminPageRegex = /<section id="admin-page" class="page-section">[\s\S]*?<\/section>\s*<!-- ===================================================================\s*PAGE 8: ANALYTICS/i;
const replacementWithAnalytics = fiveSeparatedAdminPages + '\n\n        <!-- ===================================================================\n             PAGE 8: ANALYTICS';

html = html.replace(oldAdminPageRegex, replacementWithAnalytics);

// 4. Modals for Claim Review, Report History, and Status Update
const newModalsCode = `
  <!-- Claim Investigation & Verification Modal (#claim-review-modal) -->
  <div class="modal-overlay" id="claim-review-modal">
    <div class="modal-card" style="max-width: 650px;">
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 38px; height: 38px; border-radius: 50%; background: rgba(245, 158, 11, 0.15); display: flex; align-items: center; justify-content: center; color: #F59E0B;">
            <i data-lucide="shield-check" style="width: 20px; height: 20px;"></i>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-primary);" id="claim-review-modal-title">Claim #CLM-0000</h3>
            <p style="margin: 0; font-size: 0.78rem; color: var(--text-muted);" id="claim-review-modal-sub">Ownership Evidence Evaluation</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" onclick="closeClaimReviewModal()" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>

      <div class="modal-body" style="padding: 20px;" id="claim-review-modal-body">
        <!-- Rendered dynamically via JS -->
      </div>
    </div>
  </div>

  <!-- Report History Audit Modal (#report-history-modal) -->
  <div class="modal-overlay" id="report-history-modal">
    <div class="modal-card" style="max-width: 500px;">
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(20, 184, 166, 0.15); display: flex; align-items: center; justify-content: center; color: var(--teal-bright);">
            <i data-lucide="history" style="width: 18px; height: 18px;"></i>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-primary);" id="report-history-modal-title">Report Lifecycle History</h3>
            <p style="margin: 0; font-size: 0.78rem; color: var(--text-muted);" id="report-history-modal-sub">Audit trail of status transitions</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" onclick="closeReportHistoryModal()" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>

      <div class="modal-body" style="padding: 20px;" id="report-history-modal-body">
        <!-- Rendered dynamically via JS -->
      </div>
    </div>
  </div>

  <!-- Create Claim Modal (#create-claim-modal) -->
  <div class="modal-overlay" id="create-claim-modal">
    <div class="modal-card" style="max-width: 560px;">
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 38px; height: 38px; border-radius: 50%; background: rgba(139, 92, 246, 0.15); display: flex; align-items: center; justify-content: center; color: var(--ai-violet);">
            <i data-lucide="hand" style="width: 20px; height: 20px;"></i>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-primary);">Initiate Item Claim</h3>
            <p style="margin: 0; font-size: 0.78rem; color: var(--text-muted);">Provide distinguishing ownership proof for admin verification</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" onclick="closeCreateClaimModal()" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>

      <div class="modal-body" style="padding: 20px;">
        <div id="create-claim-items-summary" style="background: var(--bg-subtle); border-radius: 8px; padding: 12px 14px; margin-bottom: 16px; border: 1px solid var(--border-subtle);">
          <!-- Lost vs Found item summary -->
        </div>

        <form id="create-claim-modal-form" onsubmit="submitCreateClaimFromModal(event)">
          <input type="hidden" id="create-claim-lost-id" value="">
          <input type="hidden" id="create-claim-found-id" value="">

          <div class="form-group" style="margin-bottom: 14px;">
            <label for="create-claim-secret-proof" style="font-weight: 700; color: var(--text-primary);">
              Private Ownership Proof / Distinguishing Feature *
            </label>
            <textarea id="create-claim-secret-proof" class="input-glass" rows="3" required placeholder="Describe one unique detail not obvious from photos/title (e.g. specific scratch on corner, sticker placement, engraved initials, serial number, lock screen image)..."></textarea>
            <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 4px;">
              Campus Administration reviews this evidence before authorizing release at the Security Desk.
            </span>
          </div>

          <!-- Contact Sharing Choice -->
          <div class="form-group" style="margin-bottom: 18px; padding: 12px 14px; background: var(--bg-subtle); border-radius: 8px; border: 1px solid var(--border-subtle);">
            <label style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary); display: block; margin-bottom: 6px;">
              Contact Sharing Preference:
            </label>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <label class="radio-card" style="margin: 0;">
                <input type="radio" name="claim-contact-share-opt" value="share" checked>
                <span><strong>Share my phone number</strong> with the counterpart for direct coordination</span>
              </label>
              <label class="radio-card" style="margin: 0;">
                <input type="radio" name="claim-contact-share-opt" value="private">
                <span><strong>Keep phone private</strong> — Coordinate solely via Campus Security Desk mediation</span>
              </label>
            </div>
          </div>

          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button type="button" class="btn btn-secondary" onclick="closeCreateClaimModal()">Cancel</button>
            <button type="submit" class="btn btn-accent-teal">
              <i data-lucide="shield-check"></i>
              <span>Submit Claim for Staff Verification</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
`;

if (!html.includes('id="claim-review-modal"')) {
  const modalTarget = `  <div class="modal-overlay" id="item-details-modal">`;
  html = html.replace(modalTarget, newModalsCode + '\n' + modalTarget);
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully updated index.html with separated Manage pages, navigation, and modals!');
