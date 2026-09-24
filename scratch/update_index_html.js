const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Add Student Nav link for Help & Safety
const studentNavTarget = `          <!-- ACCOUNT ▾ -->
          <div class="nav-group" id="nav-group-student-account">`;

const studentNavReplacement = `          <!-- SAFETY & SUPPORT -->
          <div class="nav-group" id="nav-group-student-safety">
            <a href="#help-safety" class="nav-link" data-page="help-safety-page">
              <i data-lucide="shield-alert"></i>
              <span>Help &amp; Safety</span>
            </a>
          </div>

          <!-- ACCOUNT ▾ -->
          <div class="nav-group" id="nav-group-student-account">`;

if (!html.includes('data-page="help-safety-page"')) {
  html = html.replace(studentNavTarget, studentNavReplacement);
}

// 2. Add Admin Nav link for Help & Complaints
const adminNavTarget = `              <a href="#admin-claims" class="nav-link" data-page="admin-page" onclick="filterAdminTableTab('claims')">
                <i data-lucide="shield-check"></i>
                <span>Claims</span>
              </a>`;

const adminNavReplacement = `              <a href="#admin-claims" class="nav-link" data-page="admin-page" onclick="filterAdminTableTab('claims')">
                <i data-lucide="shield-check"></i>
                <span>Claims</span>
              </a>
              <a href="#admin-help" class="nav-link" data-page="admin-help-page">
                <i data-lucide="shield-alert"></i>
                <span>Help &amp; Complaints</span>
                <span class="nav-badge" id="sidebar-admin-help-badge" style="display:none;">0</span>
              </a>`;

if (!html.includes('data-page="admin-help-page"')) {
  html = html.replace(adminNavTarget, adminNavReplacement);
}

// 3. Reusable options for KSRCE Campus locations
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

// 4. Update lost-location
const lostLocationTarget = `<select id="lost-location" class="input-glass" required>
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
                      <option value="Other">Other / Unknown</option>
                    </select>`;

const lostLocationReplacement = `<select id="lost-location" class="input-glass" required onchange="handleLocationSelectChange(this, 'lost-location-other-wrap')">
                      <option value="">Select Campus Location...</option>${KSRCE_OPTGROUPS}
                    </select>
                    <div id="lost-location-other-wrap" style="display: none; margin-top: 8px;">
                      <input type="text" id="lost-location-other" class="input-glass" placeholder="Specify landmark or campus area...">
                    </div>`;

html = html.replace(lostLocationTarget, lostLocationReplacement);

// 5. Update found-location
const foundLocationTarget = `<select id="found-location" class="input-glass" required>
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
                      <option value="Other">Other / Unknown</option>
                    </select>`;

const foundLocationReplacement = `<select id="found-location" class="input-glass" required onchange="handleLocationSelectChange(this, 'found-location-other-wrap')">
                      <option value="">Select Campus Location...</option>${KSRCE_OPTGROUPS}
                    </select>
                    <div id="found-location-other-wrap" style="display: none; margin-top: 8px;">
                      <input type="text" id="found-location-other" class="input-glass" placeholder="Specify landmark or campus area...">
                    </div>`;

html = html.replace(foundLocationTarget, foundLocationReplacement);

// 6. Update ifound-location
const ifoundLocationTarget = `<select id="ifound-location" class="select-glass" required>
                  <option value="">-- Select location on campus --</option>
                  <option value="Library">Library (Reading Hall &amp; Floors)</option>
                  <option value="Cafeteria">Campus Cafeteria &amp; Food Court</option>
                  <option value="Lab Complex">Lab Complex &amp; Engineering Wing</option>
                  <option value="Main Building">Main Administrative Building</option>
                  <option value="Sports Ground">Sports Ground &amp; Gym</option>
                  <option value="Parking Area">Campus Parking Lot / Bike Stand</option>
                  <option value="Auditorium">Main Auditorium</option>
                  <option value="Hostel Block A">Hostel Block A</option>
                  <option value="Hostel Block B">Hostel Block B</option>
                </select>`;

const ifoundLocationReplacement = `<select id="ifound-location" class="select-glass" required onchange="handleLocationSelectChange(this, 'ifound-location-other-wrap')">
                  <option value="">-- Select location on campus --</option>${KSRCE_OPTGROUPS}
                </select>
                <div id="ifound-location-other-wrap" style="display: none; margin-top: 8px;">
                  <input type="text" id="ifound-location-other" class="input-glass" placeholder="Specify landmark or campus area...">
                </div>`;

html = html.replace(ifoundLocationTarget, ifoundLocationReplacement);

// 7. Update find-filter-location
const findFilterTarget = `<select id="find-filter-location" class="input-glass filter-select" onchange="handleFindItemSearch()">
                <option value="">All Locations</option>
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
              </select>`;

const findFilterReplacement = `<select id="find-filter-location" class="input-glass filter-select" onchange="handleFindItemSearch()">
                <option value="">All Campus Locations</option>${KSRCE_OPTGROUPS}
              </select>`;

html = html.replace(findFilterTarget, findFilterReplacement);

// 8. Update admin-filter-location
const adminFilterTarget = `<select id="admin-filter-location" class="input-glass filter-select" onchange="filterAdminReportsTable()">
                  <option value="">All Locations</option>
                  <option value="Library">Library</option>
                  <option value="Cafeteria">Cafeteria</option>
                  <option value="Main Building">Main Building</option>
                  <option value="Hostel Block A">Hostel Block A</option>
                  <option value="Hostel Block B">Hostel Block B</option>
                  <option value="Sports Ground">Sports Ground</option>
                  <option value="Lab Complex">Lab Complex</option>
                  <option value="Parking Area">Parking Area</option>
                </select>`;

const adminFilterReplacement = `<select id="admin-filter-location" class="input-glass filter-select" onchange="filterAdminReportsTable()">
                  <option value="">All Campus Locations</option>${KSRCE_OPTGROUPS}
                </select>`;

html = html.replace(adminFilterTarget, adminFilterReplacement);

// 9. Update admin-photo-location
const adminPhotoTarget = `<select id="admin-photo-location" class="select-glass">
                  <option value="">All Locations</option>
                  <option value="Library">Library</option>
                  <option value="Cafeteria">Cafeteria</option>
                  <option value="Lab Complex">Lab Complex</option>
                  <option value="Main Building">Main Building</option>
                  <option value="Sports Ground">Sports Ground</option>
                  <option value="Parking Area">Parking Area</option>
                  <option value="Auditorium">Auditorium</option>
                </select>`;

const adminPhotoReplacement = `<select id="admin-photo-location" class="select-glass">
                  <option value="">All Campus Locations</option>${KSRCE_OPTGROUPS}
                </select>`;

html = html.replace(adminPhotoTarget, adminPhotoReplacement);

// 10. Update placeholder in admin-contact-help-modal
const placeholderTarget = `<div style="margin-top: 4px;">📞 <strong>Desk Helpline:</strong> ext. 4402 / (011) 2988-1000</div>`;
const placeholderReplacement = `<div style="margin-top: 4px;" id="admin-bridge-helpline-display">📞 <strong>Desk Helpline:</strong> <span class="contact-unconfigured-text">Contact number not configured</span></div>`;
html = html.replace(placeholderTarget, placeholderReplacement);

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully updated index.html with navigation, locations, and clean contact placeholders.');
