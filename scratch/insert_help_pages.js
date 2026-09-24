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

const mainEnd = `      </main>`;
html = html.replace(mainEnd, newPagesHTML + '\n      </main>');

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully added help pages before </main>');
