/* ==========================================================================
   WIZARD & DYNAMIC REPORT FORMS
   ========================================================================== */
function initWizardForms() {
  renderDynamicFields('lost', 'id-card');
  renderDynamicFields('found', 'id-card');
  setupDragAndDrop('lost');
  setupDragAndDrop('found');
}

function selectWizardCategory(type, catKey) {
  const hiddenInput = document.getElementById(`${type}-category-val`);
  if (hiddenInput) hiddenInput.value = catKey;

  const grid = document.getElementById(`${type}-category-grid`);
  if (grid) {
    grid.querySelectorAll('.category-card-pro').forEach(card => {
      if (card.getAttribute('data-cat') === catKey) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });
  }

  renderDynamicFields(type, catKey);
}

function goToWizardStep(type, stepNum) {
  for (let i = 1; i <= 3; i++) {
    const pane = document.getElementById(`${type}-pane-${i}`) || document.getElementById(`${type}-step-${i}`);
    const node = document.getElementById(`${type}-step-node-${i}`) || document.getElementById(`${type}-step-ind-${i}`);
    
    if (pane) {
      pane.style.display = (i === stepNum) ? 'block' : 'none';
      if (i === stepNum) pane.classList.add('fade-in');
    }
    
    if (node) {
      if (i < stepNum) {
        node.className = 'wizard-step-node completed';
      } else if (i === stepNum) {
        node.className = 'wizard-step-node active';
      } else {
        node.className = 'wizard-step-node';
      }
    }
  }

  if (stepNum === 3) {
    generateReportReview(type);
  }

  // Scroll to top of wizard container for smooth mobile experience
  const wizardContainer = document.querySelector(`#report-${type}-page .wizard-container`);
  if (wizardContainer) wizardContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
}

function renderDynamicFields(type, catKey) {
  const container = document.getElementById(`${type}-dynamic-fields-wrap`) || document.getElementById(`${type}-dynamic-fields`);
  if (!container) return;

  const isLost = (type === 'lost');
  let html = '';

  switch (catKey) {
    case 'id-card':
    case 'id-cards':
      html = `
        <div class="form-group">
          <label for="${type}-id-number">Student / Employee ID Number *</label>
          <input type="text" id="${type}-id-number" class="input-glass" placeholder="e.g. STU-2026-9042" required>
        </div>
        <div class="form-group">
          <label for="${type}-department">Department / Faculty *</label>
          <select id="${type}-department" class="input-glass" required>
            <option value="">Select Department...</option>
            <option value="Computer Science">Computer Science & Engineering</option>
            <option value="Mechanical Eng">Mechanical Engineering</option>
            <option value="Electrical Eng">Electrical & Electronics</option>
            <option value="Business School">School of Business</option>
            <option value="Arts & Humanities">Arts & Humanities</option>
            <option value="Sciences">Natural Sciences</option>
            <option value="Law">School of Law</option>
            <option value="Other">Other</option>
          </select>
        </div>
      `;
      break;

    case 'electronics':
      html = `
        <div class="form-group">
          <label for="${type}-device-type">Device Type *</label>
          <select id="${type}-device-type" class="input-glass" required>
            <option value="Phone">Phone / Smartphone</option>
            <option value="Laptop">Laptop / Notebook</option>
            <option value="Tablet">Tablet / iPad</option>
            <option value="Charger">Charger / Adapter / Power Bank</option>
            <option value="Earbuds">Earbuds / Headphones</option>
            <option value="Smartwatch">Smartwatch / Fitness Band</option>
            <option value="Other">Other Electronic Device</option>
          </select>
        </div>
        <div class="form-group">
          <label for="${type}-brand">Brand / Manufacturer *</label>
          <input type="text" id="${type}-brand" class="input-glass" placeholder="e.g. Apple, Dell, Samsung, Sony" required>
        </div>
        <div class="form-group">
          <label for="${type}-model">Model Name / Number</label>
          <input type="text" id="${type}-model" class="input-glass" placeholder="e.g. iPhone 15 Pro, XPS 13, AirPods Pro 2">
        </div>
        ${isLost ? `
        <div class="form-group">
          <label for="${type}-serial">IMEI / Serial Number (Optional)</label>
          <input type="text" id="${type}-serial" class="input-glass" placeholder="Last 4 digits or Serial">
        </div>` : ''}
      `;
      break;

    case 'wallet':
    case 'wallets':
      html = `
        <div class="form-group">
          <label for="${type}-material">Wallet Material *</label>
          <input type="text" id="${type}-material" class="input-glass" placeholder="e.g. Black Leather, Canvas, Synthetic" required>
        </div>
        <div class="form-group">
          <label for="${type}-num-cards">Number of Cards Inside</label>
          <input type="number" id="${type}-num-cards" class="input-glass" min="0" placeholder="e.g. 3">
        </div>
        ${isLost ? `
        <div class="form-group">
          <label for="${type}-cash-amount">Approximate Cash Amount (Optional)</label>
          <input type="text" id="${type}-cash-amount" class="input-glass" placeholder="e.g. ~$45 (Used for private verification)">
        </div>` : ''}
      `;
      break;

    case 'keys':
      html = `
        <div class="form-group">
          <label for="${type}-key-type">Key Type *</label>
          <select id="${type}-key-type" class="input-glass" required>
            <option value="Room / Dorm">Room / Dorm Key</option>
            <option value="Bike Lock">Bike Lock Key</option>
            <option value="Car Fob">Car Key / Keyless Fob</option>
            <option value="Locker Padlock">Locker Padlock Key</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label for="${type}-num-keys">Number of Keys on Ring</label>
          <input type="number" id="${type}-num-keys" class="input-glass" min="1" value="1">
        </div>
        <div class="form-group col-span-2">
          <label for="${type}-keychain-desc">Keychain / Lanyard Description *</label>
          <input type="text" id="${type}-keychain-desc" class="input-glass" placeholder="e.g. Red lanyard with Marvel charm, metal carabiner" required>
        </div>
      `;
      break;

    case 'bags':
      html = `
        <div class="form-group">
          <label for="${type}-bag-type">Bag Type *</label>
          <select id="${type}-bag-type" class="input-glass" required>
            <option value="Backpack">Backpack</option>
            <option value="Sling Bag">Sling / Crossbody Bag</option>
            <option value="Handbag">Handbag / Tote</option>
            <option value="Laptop Bag">Laptop Sleeve / Briefcase</option>
            <option value="Duffle Bag">Gym / Duffle Bag</option>
          </select>
        </div>
        <div class="form-group">
          <label for="${type}-brand">Brand</label>
          <input type="text" id="${type}-brand" class="input-glass" placeholder="e.g. The North Face, Nike, JanSport">
        </div>
        <div class="form-group col-span-2">
          <label for="${type}-bag-contents">Notable Contents Description *</label>
          <input type="text" id="${type}-bag-contents" class="input-glass" placeholder="e.g. Blue spiral notebook, thermos, calculator" required>
        </div>
      `;
      break;

    case 'documents':
      html = `
        <div class="form-group">
          <label for="${type}-doc-type">Document Type *</label>
          <select id="${type}-doc-type" class="input-glass" required>
            <option value="Textbook">Textbook / Course Book</option>
            <option value="Notebook">Notebook / Lecture Binder</option>
            <option value="Passport">Passport / Official ID</option>
            <option value="Certificate">Certificate / Transcripts</option>
            <option value="Assignment">Assignment / Research Paper</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label for="${type}-doc-name">Name on Document</label>
          <input type="text" id="${type}-doc-name" class="input-glass" placeholder="e.g. Alex Rivera">
        </div>
        <div class="form-group col-span-2">
          <label for="${type}-doc-subject">Subject / Course / Title</label>
          <input type="text" id="${type}-doc-subject" class="input-glass" placeholder="e.g. CS201 Algorithms & Data Structures">
        </div>
      `;
      break;

    case 'clothing':
      html = `
        <div class="form-group">
          <label for="${type}-clothing-type">Clothing Type *</label>
          <input type="text" id="${type}-clothing-type" class="input-glass" placeholder="e.g. Varsity Hoodie, Winter Jacket, Baseball Cap" required>
        </div>
        <div class="form-group">
          <label for="${type}-clothing-size">Size</label>
          <select id="${type}-clothing-size" class="input-glass">
            <option value="M">Medium (M)</option>
            <option value="S">Small (S)</option>
            <option value="L">Large (L)</option>
            <option value="XL">Extra Large (XL)</option>
            <option value="XS">Extra Small (XS)</option>
            <option value="Free Size">Free Size</option>
          </select>
        </div>
        <div class="form-group col-span-2">
          <label for="${type}-brand">Brand / Logo</label>
          <input type="text" id="${type}-brand" class="input-glass" placeholder="e.g. Nike, Champion, Zara, University Crest">
        </div>
      `;
      break;

    case 'misc':
    default:
      html = `
        <div class="form-group col-span-2">
          <label for="${type}-misc-type">Item Sub-Type / Purpose</label>
          <input type="text" id="${type}-misc-type" class="input-glass" placeholder="e.g. Hydro Flask water bottle, Ray-Ban glasses, umbrella">
        </div>
      `;
      break;
  }

  container.innerHTML = html;
}

function setupDragAndDrop(type) {
  const zone = document.getElementById(`${type}-drop-zone`);
  if (!zone) return;

  ['dragenter', 'dragover'].forEach(name => {
    zone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    zone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.remove('dragover');
    });
  });

  zone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelected({ target: { files } }, type);
    }
  });
}

function triggerPhotoPick(type, mode = 'gallery') {
  let input = null;
  if (mode === 'camera') {
    input = document.getElementById(`${type}-camera-input`);
  } else if (mode === 'gallery') {
    input = document.getElementById(`${type}-gallery-input`);
  }
  if (!input) {
    input = document.getElementById(`${type}-file-input`);
  }
  if (input) {
    input.click();
  }
}



function syncColorInput(type) {
  const picker = document.getElementById(`${type}-color-picker`);
  const text = document.getElementById(`${type}-color-text`);
  if (picker && text) {
    text.value = picker.value;
  }
}


function generateReportReview(type) {
  const container = document.getElementById(`${type}-review-summary`) || document.getElementById(`${type}-review-summary-content`);
  if (!container) return;

  const catKey = document.getElementById(`${type}-category-val`)?.value || 'misc';
  const cat = CATEGORY_MAP[catKey] || { label: 'Item', icon: '📦' };
  const title = document.getElementById(`${type}-title`)?.value.trim() || 'Untitled Item';
  const color = document.getElementById(`${type}-color-val`)?.value.trim() || document.getElementById(`${type}-color-text`)?.value.trim() || 'Not specified';
  let location = document.getElementById(`${type}-location`)?.value || 'Campus';
  if (location === 'Other') {
    const customLoc = document.getElementById(`${type}-location-other`)?.value.trim();
    if (customLoc) location = customLoc;
  }
  const date = document.getElementById(`${type}-date`)?.value || new Date().toISOString();
  const desc = document.getElementById(`${type}-desc`)?.value.trim() || document.getElementById(`${type}-description`)?.value.trim() || 'None provided';
  const photoUrl = document.getElementById(`${type}-photo-url`)?.value || '';
  const phone = document.getElementById(`${type}-phone`)?.value.trim() || '';
  const sharePhone = !!document.getElementById(`${type}-share-phone`)?.checked;

  let contactHTML = '';
  if (phone) {
    if (sharePhone) {
      contactHTML = `
        <div style="display: flex; align-items: center; gap: 8px; color: var(--teal-bright); font-size: 0.85rem; font-weight: 600;">
          <i data-lucide="phone-call" style="width: 15px; height: 15px;"></i>
          <span>${escapeHTML(phone)} (Direct contact permitted)</span>
        </div>
      `;
    } else {
      contactHTML = `
        <div style="display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 0.85rem;">
          <i data-lucide="shield" style="width: 15px; height: 15px; color: var(--color-warning);"></i>
          <span>Phone provided but kept private (Admin mediation)</span>
        </div>
      `;
    }
  } else {
    contactHTML = `
      <div style="font-size: 0.85rem; color: var(--text-muted);">
        No phone provided (Admin mediation fallback)
      </div>
    `;
  }

  container.innerHTML = `
    <div style="display: flex; gap: 16px; flex-wrap: wrap;">
      ${photoUrl ? `
        <div style="flex-shrink: 0;">
          <img src="${photoUrl}" alt="Photo" style="width: 88px; height: 88px; object-fit: cover; border-radius: 8px; border: 1.5px solid var(--teal-bright);">
        </div>
      ` : ''}
      <div style="flex: 1; min-width: 220px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span style="font-size: 1.2rem;">${cat.icon}</span>
          <strong style="font-size: 1.05rem; color: var(--text-primary);">${escapeHTML(title)}</strong>
        </div>
        <div style="font-size: 0.83rem; color: var(--text-secondary); margin-bottom: 4px;">
          <strong>Category:</strong> ${escapeHTML(cat.label)} • <strong>Color:</strong> ${escapeHTML(color)}
        </div>
        <div style="font-size: 0.83rem; color: var(--text-secondary); margin-bottom: 6px;">
          <strong>Location:</strong> ${escapeHTML(location)} • <strong>Date:</strong> ${formatDateTime(date)}
        </div>
        <div style="font-size: 0.83rem; color: var(--text-muted); margin-bottom: 10px; line-height: 1.4;">
          <strong>Description:</strong> ${escapeHTML(desc)}
        </div>
        <div style="padding-top: 8px; border-top: 1px solid var(--border-subtle);">
          <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 4px;">Contact Preference</span>
          ${contactHTML}
        </div>
      </div>
    </div>
  `;

  if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
}


async function finalizeReportSubmit(type) {
  const isFound = (String(type).toLowerCase() === 'found');
  const catKey = document.getElementById(`${type}-category-val`)?.value || 'misc';
  const isUrgent = (catKey === 'id-card' || catKey === 'id-cards' || catKey === 'electronics');

  const title = document.getElementById(`${type}-title`)?.value.trim() || 'Campus Item';
  const color = document.getElementById(`${type}-color-val`)?.value.trim() || document.getElementById(`${type}-color-text`)?.value.trim() || '';
  const brand = document.getElementById(`${type}-brand`)?.value?.trim() || '';
  let location = document.getElementById(`${type}-location`)?.value || 'Campus';
  if (location === 'Other') {
    const customLoc = document.getElementById(`${type}-location-other`)?.value.trim();
    if (customLoc) location = customLoc;
  }
  const date = document.getElementById(`${type}-date`)?.value || new Date().toISOString();
  const desc = document.getElementById(`${type}-desc`)?.value.trim() || document.getElementById(`${type}-description`)?.value.trim() || '';
  const photo = document.getElementById(`${type}-photo-url`)?.value || '';
  const phone = document.getElementById(`${type}-phone`)?.value.trim() || '';
  const sharePhone = !!(phone && document.getElementById(`${type}-share-phone`)?.checked);

  // Find the submit button in pane 3 to show loading state
  const pane3 = document.getElementById(`${type}-pane-3`);
  const submitBtn = pane3?.querySelector('.btn-accent-teal') || pane3?.querySelector('button[onclick*="finalizeReportSubmit"]');
  const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> <span>Submitting to Cloud...</span>';
    if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
  }

  try {
    // 1. Upload photo to real cloud storage if Data URL is present
    let cloudImgUrl = photo;
    if (photo && photo.startsWith('data:')) {
      if (submitBtn) {
        submitBtn.innerHTML = '<i data-lucide="upload-cloud" class="spin"></i> <span>Uploading Image...</span>';
        if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
      }
      try {
        cloudImgUrl = await uploadImageToCloud(photo, `${type}-report.jpg`);
      } catch (uploadErr) {
        console.warn('Image upload fallback warning:', uploadErr);
      }
    }

    // 2. Construct clean report payload adhering to Supabase check constraints
    const reportPayload = {
      id: generateId(type),
      type: isFound ? 'FOUND' : 'LOST',
      itemType: isFound ? 'Found' : 'Lost',
      category: catKey,
      title: title,
      itemName: title,
      color: color,
      brand: brand,
      location: location,
      date: date,
      dateTime: date,
      description: desc,
      photo: cloudImgUrl || null,
      imageUrl: cloudImgUrl || null,
      priority: isUrgent ? 'urgent' : 'normal',
      status: 'Active',
      phone: phone,
      phoneNumber: phone,
      sharePhone: sharePhone,
      phoneSharingConsent: sharePhone,
      reporterId: appState.user ? (appState.user.username || appState.user.loginId || appState.user.id) : 'student',
      reporterName: appState.user ? appState.user.name : 'Campus Student',
      createdAt: new Date().toISOString()
    };

    if (isFound) {
      reportPayload.custody = document.getElementById('found-custody')?.value || 'With Me';
      reportPayload.finderName = appState.user?.name || 'Campus Student';
      reportPayload.lostReports = appState.lostReports || [];
    }

    if (submitBtn) {
      submitBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> <span>Saving Report...</span>';
      if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
    }

    // 3. Perform real POST to serverless reports endpoint
    const apiRes = await fetch(API_BASE + '/api/reports', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reportPayload)
    });

    const apiData = await apiRes.json();
    if (!apiRes.ok || !apiData.success || !apiData.report) {
      const errMsg = apiData.message || `Server responded with HTTP ${apiRes.status}`;
      throw new Error(errMsg);
    }

    // 4. Update local state with real Supabase returned row
    const createdReport = apiData.report;
    if (isFound) {
      appState.foundReports = [createdReport, ...(appState.foundReports || []).filter(r => r.id !== createdReport.id)];
    } else {
      appState.lostReports = [createdReport, ...(appState.lostReports || []).filter(r => r.id !== createdReport.id)];
    }

    saveData();
    renderAllViews();

    // 5. Trigger cloud sync to pull matches, notifications & cross-account updates
    syncWithCloud(false).catch(e => console.warn('Post-submit sync warning:', e));

    showToast(`Report published to campus registry! ${isFound ? '📦' : '📝'}`, 'success');

    // 6. Reset wizard form cleanly
    const form = document.getElementById(`${type}-details-form`);
    if (form) form.reset();
    clearWizardPhoto(type);
    goToWizardStep(type, 1);

    // Navigate to my reports page immediately
    showPage('my-reports-page');

  } catch (err) {
    console.error('Report submission failed:', err);
    showToast(`Failed to submit report: ${err.message}`, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHTML || (isFound ? '<i data-lucide="check"></i> <span>Submit Found Report</span>' : '<i data-lucide="check"></i> <span>Submit Lost Report</span>');
      if (window.lucide) if(window.optimizedCreateIcons) window.optimizedCreateIcons(); else if (window.lucide) window.lucide.createIcons();
    }
  }
}

