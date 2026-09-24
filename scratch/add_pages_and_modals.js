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

// 1. Settings page Official Contacts editor (visible to Admin)
const settingsContactsCard = `
          <!-- Official Campus Contacts Management (Admin Only) -->
          <div class="glass-card" id="admin-settings-contacts-card" style="margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 32px; height: 32px; border-radius: 6px; background: rgba(20, 184, 166, 0.15); display: flex; align-items: center; justify-content: center; color: var(--teal-bright);">
                  <i data-lucide="phone-call" style="width: 18px; height: 18px;"></i>
                </div>
                <div>
                  <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-primary);">Official Campus Contacts Directory</h3>
                  <p style="margin: 2px 0 0; font-size: 0.78rem; color: var(--text-muted);">Configure contact numbers shown on Student Help &amp; Safety page.</p>
                </div>
              </div>
              <span class="badge badge-verified" id="contacts-admin-only-badge">Staff / Admin Managed</span>
            </div>

            <form id="official-contacts-settings-form" onsubmit="saveOfficialContactsSettings(event)">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 16px;">
                <!-- Campus Office Phone -->
                <div class="form-group">
                  <label for="setting-phone-office">Campus Administration Phone</label>
                  <input type="tel" id="setting-phone-office" class="input-glass" placeholder="Leave blank if unconfigured">
                  <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-top: 3px;">
                    Unconfigured numbers display: "Contact number not configured"
                  </span>
                </div>

                <!-- Campus Security Phone -->
                <div class="form-group">
                  <label for="setting-phone-security">Campus Security Desk Phone</label>
                  <input type="tel" id="setting-phone-security" class="input-glass" placeholder="Leave blank if unconfigured">
                  <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-top: 3px;">
                    Used for 24/7 custody &amp; security desk communications
                  </span>
                </div>

                <!-- Police Station Phone -->
                <div class="form-group">
                  <label for="setting-phone-police">Police Station Phone</label>
                  <input type="tel" id="setting-phone-police" class="input-glass" placeholder="Leave blank if unconfigured">
                  <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-top: 3px;">
                    Tiruchengode Rural Police Station line
                  </span>
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end;">
                <button type="submit" class="btn btn-accent-teal" style="min-width: 160px;">
                  <i data-lucide="save"></i>
                  <span>Save Contacts</span>
                </button>
              </div>
            </form>
          </div>
`;

if (!html.includes('id="admin-settings-contacts-card"')) {
  const settingsTarget = `          <!-- Account & Demo Data Controls -->`;
  html = html.replace(settingsTarget, settingsContactsCard + '\n' + settingsTarget);
}

// 2. Add Help & Safety Page (#help-safety-page) and Admin Help Page (#admin-help-page)
const newPagesHTML = `
        <!-- ===================================================================
             PAGE: HELP & SAFETY (#help-safety-page)
             =================================================================== -->
        <section id="help-safety-page" class="page-section" style="display: none;">
          <div class="page-header-row" style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(20, 184, 166, 0.12); color: var(--teal-bright); padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; margin-bottom: 8px;">
                <i data-lucide="shield-alert" style="width: 14px; height: 14px;"></i>
                <span>Campus Safety &amp; Support</span>
              </div>
              <h1 style="margin: 0; font-size: 1.75rem; color: var(--text-primary);">Help, Safety &amp; Dispute Escalation</h1>
              <p style="margin: 6px 0 0; color: var(--text-secondary); font-size: 0.95rem;">
                Official verified campus directory, safety policies, dispute resolution &amp; direct security escalation.
              </p>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <button type="button" class="btn btn-outline" style="border-color: rgba(239, 68, 68, 0.4); color: #F87171;" onclick="document.getElementById('complaint-form-anchor').scrollIntoView({behavior:'smooth'})">
                <i data-lucide="alert-octagon"></i>
                <span>File Complaint</span>
              </button>
            </div>
          </div>

          <!-- Official Campus Contacts Grid -->
          <div style="margin-bottom: 28px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                <i data-lucide="phone-call" style="color: var(--teal-bright); width: 20px; height: 20px;"></i>
                <span>Official Campus Contacts</span>
              </h3>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Zero invented numbers • Verified KSRCE directory</span>
            </div>

            <div class="contacts-directory-grid">
              <!-- Campus Administration & Student Affairs -->
              <div class="contact-card glass-card" id="card-contact-office">
                <div class="contact-card-top">
                  <div class="contact-icon-wrap" style="background: rgba(20, 184, 166, 0.15); color: var(--teal-bright);">
                    <i data-lucide="building-2"></i>
                  </div>
                  <div>
                    <h4 style="margin: 0; font-size: 1.05rem; color: var(--text-primary);">Campus Administration</h4>
                    <span style="font-size: 0.75rem; color: var(--teal-bright); font-weight: 600;">Student Affairs &amp; Property Custody</span>
                  </div>
                </div>
                <div class="contact-card-body">
                  <div class="contact-info-row">
                    <i data-lucide="map-pin"></i>
                    <span>Administrative Block, 1st Floor, Room 102</span>
                  </div>
                  <div class="contact-info-row">
                    <i data-lucide="clock"></i>
                    <span>Mon - Fri, 9:00 AM - 5:00 PM</span>
                  </div>
                  <div class="contact-info-row">
                    <i data-lucide="mail"></i>
                    <a href="mailto:lostfound@ksrce.ac.in" style="color: var(--teal-bright); text-decoration: none;">lostfound@ksrce.ac.in</a>
                  </div>
                  <div class="contact-info-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-subtle);">
                    <i data-lucide="phone"></i>
                    <span id="contact-office-phone-display" class="contact-phone-display">Contact number not configured</span>
                  </div>
                </div>
              </div>

              <!-- Campus Security & Custody Desk -->
              <div class="contact-card glass-card" id="card-contact-security">
                <div class="contact-card-top">
                  <div class="contact-icon-wrap" style="background: rgba(59, 130, 246, 0.15); color: #60A5FA;">
                    <i data-lucide="shield-check"></i>
                  </div>
                  <div>
                    <h4 style="margin: 0; font-size: 1.05rem; color: var(--text-primary);">Campus Security &amp; Custody Desk</h4>
                    <span style="font-size: 0.75rem; color: #60A5FA; font-weight: 600;">24/7 Custody Lockers &amp; Safe Handover</span>
                  </div>
                </div>
                <div class="contact-card-body">
                  <div class="contact-info-row">
                    <i data-lucide="map-pin"></i>
                    <span>Main Gate Security Post &amp; Admin Reception</span>
                  </div>
                  <div class="contact-info-row">
                    <i data-lucide="clock"></i>
                    <span>24/7 Security Coverage &amp; Custody Lockers</span>
                  </div>
                  <div class="contact-info-row">
                    <i data-lucide="package-check"></i>
                    <span>Physical verification &amp; locker drop-off</span>
                  </div>
                  <div class="contact-info-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-subtle);">
                    <i data-lucide="phone"></i>
                    <span id="contact-security-phone-display" class="contact-phone-display">Contact number not configured</span>
                  </div>
                </div>
              </div>

              <!-- Tiruchengode Rural Police Station -->
              <div class="contact-card glass-card" id="card-contact-police">
                <div class="contact-card-top">
                  <div class="contact-icon-wrap" style="background: rgba(239, 68, 68, 0.15); color: #F87171;">
                    <i data-lucide="badge-alert"></i>
                  </div>
                  <div>
                    <h4 style="margin: 0; font-size: 1.05rem; color: var(--text-primary);">Tiruchengode Police Station</h4>
                    <span style="font-size: 0.75rem; color: #F87171; font-weight: 600;">Law Enforcement Jurisdiction</span>
                  </div>
                </div>
                <div class="contact-card-body">
                  <div class="contact-info-row">
                    <i data-lucide="map-pin"></i>
                    <span>Tiruchengode - Erode Main Road, Tamil Nadu</span>
                  </div>
                  <div class="contact-info-row">
                    <i data-lucide="navigation"></i>
                    <span>Approx. 3.5 km from campus main gate</span>
                  </div>
                  <div class="contact-info-row">
                    <i data-lucide="file-text"></i>
                    <span>FIR registration &amp; ID theft reporting</span>
                  </div>
                  <div class="contact-info-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-subtle);">
                    <i data-lucide="phone"></i>
                    <span id="contact-police-phone-display" class="contact-phone-display">Contact number not configured</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Safe Campus Handover Protocol & Guidelines -->
          <div class="glass-card" style="margin-bottom: 28px; border-left: 4px solid var(--teal-bright);">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
              <i data-lucide="shield" style="width: 22px; height: 22px; color: var(--teal-bright);"></i>
              <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-primary);">Campus Handover &amp; Safety Protocol</h3>
            </div>
            <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.5;">
              To protect all students against disputes, extortion, and theft, LostSeek enforces clear safe handover rules:
            </p>
            <div class="safety-guidelines-grid">
              <div class="guideline-item">
                <div class="guideline-num">1</div>
                <div>
                  <strong style="color: var(--text-primary); font-size: 0.9rem;">Never Meet in Isolated Places</strong>
                  <p style="margin: 2px 0 0; font-size: 0.8rem; color: var(--text-muted);">
                    Always conduct property handovers at the Campus Security Desk or the Administrative Block Reception.
                  </p>
                </div>
              </div>
              <div class="guideline-item">
                <div class="guideline-num">2</div>
                <div>
                  <strong style="color: var(--text-primary); font-size: 0.9rem;">Deposit High-Value Items in Custody</strong>
                  <p style="margin: 2px 0 0; font-size: 0.8rem; color: var(--text-muted);">
                    Laptops, smartphones, wallets, and government IDs should be deposited at the Security Desk Lockers for official logging.
                  </p>
                </div>
              </div>
              <div class="guideline-item">
                <div class="guideline-num">3</div>
                <div>
                  <strong style="color: var(--text-primary); font-size: 0.9rem;">Never Pay "Finders Fees" or Ransom</strong>
                  <p style="margin: 2px 0 0; font-size: 0.8rem; color: var(--text-muted);">
                    LostSeek is 100% free and institutional. Anyone demanding money before returning an item violates campus discipline.
                  </p>
                </div>
              </div>
              <div class="guideline-item">
                <div class="guideline-num">4</div>
                <div>
                  <strong style="color: var(--text-primary); font-size: 0.9rem;">Keep Serial Numbers &amp; Proof of Ownership</strong>
                  <p style="margin: 2px 0 0; font-size: 0.8rem; color: var(--text-muted);">
                    Admins require verifiable proof (purchase bill, serial number, student ID, secret identifier) prior to release.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Complaint / Escalation Form -->
          <div class="glass-card" id="complaint-form-anchor">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(239, 68, 68, 0.15); display: flex; align-items: center; justify-content: center; color: #F87171;">
                  <i data-lucide="alert-triangle" style="width: 20px; height: 20px;"></i>
                </div>
                <div>
                  <h3 style="margin: 0; font-size: 1.2rem; color: var(--text-primary);">Report an Issue or File Formal Complaint</h3>
                  <p style="margin: 2px 0 0; font-size: 0.8rem; color: var(--text-muted);">
                    Disputes, fraudulent claims, unreturned items, or inappropriate conduct will be investigated by Campus Administration.
                  </p>
                </div>
              </div>
              <span class="badge badge-urgent">🛡️ Confidential Investigation</span>
            </div>

            <form id="student-complaint-form" onsubmit="handleComplaintSubmit(event)">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 16px;">
                <div class="form-group">
                  <label for="complaint-type">Complaint / Issue Category *</label>
                  <select id="complaint-type" class="input-glass" required>
                    <option value="">Select Issue Category...</option>
                    <option value="Fake / Fraudulent Claim">Fake / Fraudulent Claim on My Item</option>
                    <option value="Refusal to Return Found Item">Finder Refusing to Return Item</option>
                    <option value="Suspicious Finder / Demanding Money">Demanding Money / Ransom / "Finder's Fee"</option>
                    <option value="Harassment or Inappropriate Behavior">Harassment or Inappropriate Conduct</option>
                    <option value="Unresponsive Counterpart">Counterpart Unresponsive for &gt;48 Hours</option>
                    <option value="Stolen Item Suspected">Suspected Stolen Item (Not Simply Lost)</option>
                    <option value="Other Safety Issue">Other Campus Dispute / Safety Issue</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="complaint-urgency">Urgency / Severity Level *</label>
                  <select id="complaint-urgency" class="input-glass" required>
                    <option value="Normal">Normal (Administrative mediation)</option>
                    <option value="High">High (Immediate intervention requested)</option>
                    <option value="Critical (Safety Risk)">Critical (Safety Risk / Threat / Extortion)</option>
                  </select>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 16px;">
                <div class="form-group">
                  <label for="complaint-related-item">Related Item (If Applicable)</label>
                  <select id="complaint-related-item" class="input-glass">
                    <option value="">Not item-specific / General campus issue</option>
                    <!-- Populated dynamically with student active reports -->
                  </select>
                </div>

                <div class="form-group">
                  <label for="complaint-involved-role">Involved Person / Role</label>
                  <select id="complaint-involved-role" class="input-glass">
                    <option value="Finder">Finder of the item</option>
                    <option value="Claimant">Claimant / Alleged Owner</option>
                    <option value="Unknown Person">Unknown Student / External Person</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 16px;">
                <div class="form-group">
                  <label for="complaint-location">Incident Campus Location *</label>
                  <select id="complaint-location" class="input-glass" required onchange="handleLocationSelectChange(this, 'complaint-location-other-wrap')">
                    <option value="">Select Incident Location...</option>
                    ${KSRCE_OPTGROUPS}
                  </select>
                  <div id="complaint-location-other-wrap" style="display: none; margin-top: 8px;">
                    <input type="text" id="complaint-location-other" class="input-glass" placeholder="Specify landmark or campus location...">
                  </div>
                </div>

                <div class="form-group">
                  <label for="complaint-contact-phone">Your Contact Number (For Admin Follow-up)</label>
                  <input type="tel" id="complaint-contact-phone" class="input-glass" placeholder="e.g. 9876543210 (Optional)">
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 20px;">
                <label for="complaint-description">Incident Description &amp; Supporting Details *</label>
                <textarea id="complaint-description" class="input-glass" rows="4" required placeholder="Describe clearly what occurred, timestamps, what was said or demanded, and any witnesses or details that assist the administration in resolving this issue..."></textarea>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="lock" style="width: 14px; height: 14px;"></i>
                  <span>Submissions are logged directly in the Admin Help &amp; Complaints Console with timestamped audit.</span>
                </div>
                <button type="submit" class="btn btn-accent-teal" style="min-width: 220px;">
                  <i data-lucide="shield-alert"></i>
                  <span>Submit to Campus Administration</span>
                </button>
              </div>
            </form>
          </div>
        </section>

        <!-- ===================================================================
             PAGE: ADMIN HELP & COMPLAINTS DESK (#admin-help-page)
             =================================================================== -->
        <section id="admin-help-page" class="page-section" style="display: none;">
          <div class="page-header-row" style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(239, 68, 68, 0.12); color: #F87171; padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; margin-bottom: 8px;">
                <i data-lucide="shield-alert" style="width: 14px; height: 14px;"></i>
                <span>Staff Investigation Desk</span>
              </div>
              <h1 style="margin: 0; font-size: 1.75rem; color: var(--text-primary);">Help Desk &amp; Student Complaints</h1>
              <p style="margin: 6px 0 0; color: var(--text-secondary); font-size: 0.95rem;">
                Triage student safety escalations, urgent item disputes, extortion reports, and mediate safe campus handovers.
              </p>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <button type="button" class="btn btn-secondary" onclick="renderAdminHelpDesk()">
                <i data-lucide="refresh-cw"></i>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <!-- Quick Metrics Bar -->
          <div class="admin-help-metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 24px;">
            <div class="glass-card stat-card">
              <div class="stat-label">Total Tickets</div>
              <div class="stat-value" id="admin-help-metric-total">0</div>
              <div class="stat-sub">All logged requests</div>
            </div>
            <div class="glass-card stat-card" style="border-top: 3px solid #EF4444;">
              <div class="stat-label" style="color: #F87171;">Urgent / Critical</div>
              <div class="stat-value" id="admin-help-metric-urgent" style="color: #F87171;">0</div>
              <div class="stat-sub">Needs fast attention</div>
            </div>
            <div class="glass-card stat-card" style="border-top: 3px solid #F59E0B;">
              <div class="stat-label" style="color: #FBBF24;">New / Unassigned</div>
              <div class="stat-value" id="admin-help-metric-new" style="color: #FBBF24;">0</div>
              <div class="stat-sub">Pending triage</div>
            </div>
            <div class="glass-card stat-card" style="border-top: 3px solid #3B82F6;">
              <div class="stat-label" style="color: #60A5FA;">In Review</div>
              <div class="stat-value" id="admin-help-metric-in-review" style="color: #60A5FA;">0</div>
              <div class="stat-sub">Active mediation</div>
            </div>
            <div class="glass-card stat-card" style="border-top: 3px solid #10B981;">
              <div class="stat-label" style="color: #34D399;">Handled / Closed</div>
              <div class="stat-value" id="admin-help-metric-resolved" style="color: #34D399;">0</div>
              <div class="stat-sub">Safely resolved</div>
            </div>
          </div>

          <!-- Filter Tabs & Controls -->
          <div class="glass-card" style="margin-bottom: 24px; padding: 16px 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
              <div class="admin-help-tabs-wrap" id="admin-help-tabs" style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button type="button" class="btn btn-sm admin-help-tab active" data-tab="all" onclick="filterAdminHelpDeskTab('all', this)">All</button>
                <button type="button" class="btn btn-sm btn-secondary admin-help-tab" data-tab="new" onclick="filterAdminHelpDeskTab('new', this)">New</button>
                <button type="button" class="btn btn-sm btn-secondary admin-help-tab" data-tab="urgent" onclick="filterAdminHelpDeskTab('urgent', this)">Urgent</button>
                <button type="button" class="btn btn-sm btn-secondary admin-help-tab" data-tab="open" onclick="filterAdminHelpDeskTab('open', this)">In Review</button>
                <button type="button" class="btn btn-sm btn-secondary admin-help-tab" data-tab="handled" onclick="filterAdminHelpDeskTab('handled', this)">Handled</button>
                <button type="button" class="btn btn-sm btn-secondary admin-help-tab" data-tab="closed" onclick="filterAdminHelpDeskTab('closed', this)">Closed</button>
              </div>

              <div style="display: flex; gap: 10px; align-items: center; flex: 1; max-width: 380px;">
                <input type="text" id="admin-help-search-input" class="input-glass" placeholder="Search by student, item or ID..." oninput="handleAdminHelpSearch()">
              </div>
            </div>
          </div>

          <!-- Tickets Table Container -->
          <div class="glass-card" style="padding: 0; overflow: hidden;">
            <div class="admin-table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Date</th>
                    <th>Urgency</th>
                    <th>Category / Reason</th>
                    <th>Student Details</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th style="text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody id="admin-help-table-tbody">
                  <!-- Populated dynamically by renderAdminHelpDesk() -->
                </tbody>
              </table>
            </div>
          </div>
        </section>
`;

if (!html.includes('id="help-safety-page"')) {
  const alertsPageEnd = `        </section>

        <!-- ===================================================================
             PAGE: PROFILE (#profile-page)`;
  
  // Place after alerts-page (or at end of main content before closing main tag)
  const mainEndTarget = `      </div>
    </main>`;

  html = html.replace(mainEndTarget, newPagesHTML + '\n      </div>\n    </main>');
}

// 3. Modals: #item-help-modal, #admin-help-details-modal, #item-details-modal
const newModalsHTML = `
  <!-- Fast-Action Urgent Assistance Modal (#item-help-modal) -->
  <div class="modal-overlay" id="item-help-modal">
    <div class="modal-card" style="max-width: 520px;">
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 38px; height: 38px; border-radius: 50%; background: rgba(239, 68, 68, 0.15); display: flex; align-items: center; justify-content: center; color: #F87171;">
            <i data-lucide="shield-alert" style="width: 20px; height: 20px;"></i>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-primary);">Request Urgent Assistance</h3>
            <p style="margin: 0; font-size: 0.78rem; color: var(--text-muted);">Direct Campus Security &amp; Admin Mediation</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" onclick="closeItemHelpModal()" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>

      <div class="modal-body" style="padding: 20px;">
        <!-- Pre-filled Item Badge -->
        <div style="background: var(--bg-subtle); border-radius: 8px; padding: 12px 14px; margin-bottom: 18px; border: 1px solid var(--border-subtle);">
          <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--teal-bright);">Flagged Property</div>
          <div style="font-weight: 700; font-size: 1.05rem; color: var(--text-primary);" id="item-help-modal-item-title">Item Title</div>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
            📍 <span id="item-help-modal-item-location">Campus</span>
          </div>
        </div>

        <form id="item-help-form" onsubmit="submitItemHelpRequest(event)">
          <input type="hidden" id="item-help-report-id" value="">

          <label style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary); display: block; margin-bottom: 8px;">
            Select Reason for Requesting Assistance: *
          </label>
          <div class="urgent-reasons-list" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
            <label class="radio-card">
              <input type="radio" name="item-help-reason" value="Someone made a suspicious claim on this item" required>
              <span>Someone made a suspicious claim on this item</span>
            </label>
            <label class="radio-card">
              <input type="radio" name="item-help-reason" value="The finder / owner is unresponsive">
              <span>The finder / owner is unresponsive (&gt;48 hours)</span>
            </label>
            <label class="radio-card">
              <input type="radio" name="item-help-reason" value="I suspect this item was stolen, not lost">
              <span>I suspect this item was stolen, not lost</span>
            </label>
            <label class="radio-card">
              <input type="radio" name="item-help-reason" value="Someone is demanding money for return">
              <span>Someone is demanding money / ransom for return</span>
            </label>
            <label class="radio-card">
              <input type="radio" name="item-help-reason" value="Item contains sensitive / personal data">
              <span>Item contains sensitive identity or personal data</span>
            </label>
            <label class="radio-card">
              <input type="radio" name="item-help-reason" value="Other safety or dispute issue">
              <span>Other safety or dispute issue</span>
            </label>
          </div>

          <div class="form-group" style="margin-bottom: 16px;">
            <label for="item-help-note" style="font-size: 0.85rem; font-weight: 600;">Additional Details (Optional)</label>
            <textarea id="item-help-note" class="input-glass" rows="2" placeholder="Briefly describe what happened or why you need immediate intervention..."></textarea>
          </div>

          <div style="background: rgba(239, 68, 68, 0.08); border-radius: 8px; padding: 10px 12px; margin-bottom: 18px; border: 1px solid rgba(239, 68, 68, 0.2); font-size: 0.78rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
            <i data-lucide="bell-ring" style="width: 16px; height: 16px; color: #F87171; flex-shrink: 0;"></i>
            <span>This dispatches an immediate high-priority ticket to Campus Security and freezes unverified handovers.</span>
          </div>

          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button type="button" class="btn btn-secondary" onclick="closeItemHelpModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" style="background: #DC2626; border-color: #DC2626; color: #FFFFFF;">
              <i data-lucide="shield-alert"></i>
              <span>Send Urgent Help Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Admin Help Ticket Details Modal (#admin-help-details-modal) -->
  <div class="modal-overlay" id="admin-help-details-modal">
    <div class="modal-card" style="max-width: 620px;">
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 38px; height: 38px; border-radius: 50%; background: rgba(20, 184, 166, 0.15); display: flex; align-items: center; justify-content: center; color: var(--teal-bright);">
            <i data-lucide="shield" style="width: 20px; height: 20px;"></i>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-primary);" id="admin-help-modal-ticket-id">Ticket #HELP-0000</h3>
            <p style="margin: 0; font-size: 0.78rem; color: var(--text-muted);" id="admin-help-modal-created-time">--</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" onclick="closeAdminHelpDetailsModal()" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>

      <div class="modal-body" style="padding: 20px;">
        <!-- Ticket Meta Summary -->
        <div style="background: var(--bg-subtle); border-radius: 8px; padding: 14px; margin-bottom: 16px; border: 1px solid var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
            <span class="badge badge-urgent" id="admin-help-modal-urgency-badge">Normal</span>
            <span class="status-pill status-checking" id="admin-help-modal-status-pill">
              <i data-lucide="clock"></i> New
            </span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.83rem;">
            <div>
              <span style="color: var(--text-muted); display: block;">Student:</span>
              <strong id="admin-help-modal-student-name" style="color: var(--text-primary);">--</strong>
              <div id="admin-help-modal-student-contact" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">--</div>
            </div>
            <div>
              <span style="color: var(--text-muted); display: block;">Location / Target:</span>
              <strong id="admin-help-modal-location" style="color: var(--text-primary);">--</strong>
              <div id="admin-help-modal-item-title" style="font-size: 0.75rem; color: var(--teal-bright); margin-top: 2px;">--</div>
            </div>
          </div>

          <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border-subtle);">
            <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); display: block;">Issue / Reason</span>
            <div id="admin-help-modal-reason" style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary); margin-top: 2px;">--</div>
          </div>

          <div style="margin-top: 10px;">
            <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); display: block;">Description / Evidence</span>
            <p id="admin-help-modal-description" style="margin: 4px 0 0; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; white-space: pre-wrap;">--</p>
          </div>
        </div>

        <!-- Internal Notes Log -->
        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px; font-size: 0.88rem; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
            <i data-lucide="notebook-pen" style="width: 15px; height: 15px; color: var(--teal-bright);"></i>
            <span>Staff Internal Investigation Notes</span>
          </h4>
          <div id="admin-help-modal-notes-list" style="max-height: 140px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px;">
            <!-- Rendered dynamically -->
          </div>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="admin-help-new-note-input" class="input-glass" placeholder="Add timestamped internal note (e.g. Spoke with finder, item held at desk)..." style="font-size: 0.82rem;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="addAdminHelpInternalNote()">Add Note</button>
          </div>
        </div>

        <!-- Status Management Actions -->
        <div style="padding-top: 14px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 0.78rem; font-weight: 600; color: var(--text-muted);">Change Status:</span>
            <select id="admin-help-modal-status-select" class="input-glass" style="padding: 4px 10px; font-size: 0.82rem;" onchange="updateAdminHelpStatus(this.value)">
              <option value="New">New</option>
              <option value="In Review">In Review</option>
              <option value="Handled">Handled</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-secondary" onclick="closeAdminHelpDetailsModal()">Close</button>
            <button type="button" class="btn btn-primary" id="admin-help-view-item-btn" style="display: none;" onclick="viewRelatedReportFromHelpModal()">
              <i data-lucide="external-link"></i>
              <span>View Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Item Details Modal (#item-details-modal) -->
  <div class="modal-overlay" id="item-details-modal">
    <div class="modal-card" style="max-width: 560px;">
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span id="item-details-modal-type-badge" class="badge badge-searching">Lost Item</span>
          <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-primary);" id="item-details-modal-title">Item Details</h3>
        </div>
        <button type="button" class="modal-close-btn" onclick="closeReportDetailsModal()" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>

      <div class="modal-body" style="padding: 20px;" id="item-details-modal-body">
        <!-- Rendered dynamically by openReportDetailsModal(reportId) -->
      </div>
    </div>
  </div>
`;

if (!html.includes('id="item-help-modal"')) {
  const toastContainerTarget = `  <div class="toast-container" id="toast-container"></div>`;
  html = html.replace(toastContainerTarget, toastContainerTarget + '\n' + newModalsHTML);
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully inserted new pages and modals into index.html');
