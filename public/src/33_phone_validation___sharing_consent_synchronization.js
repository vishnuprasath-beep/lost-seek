/* ==========================================================================
   PHONE VALIDATION & SHARING CONSENT SYNCHRONIZATION
   ========================================================================== */
function validatePhoneNumber(phoneStr) {
  if (!phoneStr) return false;
  const cleaned = phoneStr.replace(/[^\d+]/g, '');
  return cleaned.length >= 7 && cleaned.length <= 15;
}

function handlePhoneInputChanged(type) {
  const phoneInput = document.getElementById(`${type}-phone`);
  const checkbox = document.getElementById(`${type}-share-phone`);
  const label = document.getElementById(`${type}-share-phone-label`);
  const note = document.getElementById(`${type}-consent-note`);
  const hint = document.getElementById(`${type}-phone-hint`);

  if (!phoneInput || !checkbox) return;

  const rawVal = phoneInput.value.trim();

  if (rawVal === '') {
    checkbox.checked = false;
    checkbox.disabled = true;
    if (label) {
      label.style.opacity = '0.6';
      label.style.cursor = 'not-allowed';
    }
    if (note) {
      note.textContent = 'Enter a phone number above to enable the sharing checkbox.';
      note.style.color = 'var(--text-muted)';
    }
    if (hint) {
      hint.textContent = 'Optional. Enter a number if you wish to allow direct phone contact.';
      hint.style.color = 'var(--text-muted)';
    }
    return;
  }

  const isValid = validatePhoneNumber(rawVal);

  if (!isValid) {
    checkbox.checked = false;
    checkbox.disabled = true;
    if (label) {
      label.style.opacity = '0.6';
      label.style.cursor = 'not-allowed';
    }
    if (note) {
      note.textContent = 'Enter a valid phone number (7-15 digits) to enable sharing.';
      note.style.color = 'var(--color-warning)';
    }
    if (hint) {
      hint.textContent = '⚠️ Please enter a reasonable phone number (7-15 digits).';
      hint.style.color = 'var(--color-warning)';
    }
  } else {
    checkbox.disabled = false;
    if (label) {
      label.style.opacity = '1';
      label.style.cursor = 'pointer';
    }
    if (note) {
      note.textContent = checkbox.checked
        ? '✓ Consented: Your number will be shown directly to the relevant matched finder/owner.'
        : 'If left unchecked, your number is kept private and campus admins will facilitate collection.';
      note.style.color = checkbox.checked ? 'var(--teal-bright)' : 'var(--text-muted)';
    }
    if (hint) {
      hint.textContent = '✓ Valid phone format. Choose below whether to share it directly.';
      hint.style.color = 'var(--color-success)';
    }
  }
}



function handleFileSelected(e, type) {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showToast('Image size exceeds 5MB. Please choose a smaller photo.', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    const dataUrl = evt.target.result;
    const hidden = document.getElementById(`${type}-photo-url`);
    const preview = document.getElementById(`${type}-photo-preview`) || document.getElementById(`${type}-preview-container`);
    const box = document.getElementById(`${type}-photo-box`);
    const dropZone = document.getElementById(`${type}-drop-zone`);

    if (hidden) hidden.value = dataUrl;
    if (preview) preview.style.display = 'block';

    const targetBox = box || preview;
    targetBox.innerHTML = `
      <div style="display: flex; align-items: center; gap: 14px; background: var(--bg-card); padding: 12px; border-radius: 8px; border: 1px solid var(--border-card);">
        <img src="${dataUrl}" alt="Thumbnail" style="width: 64px; height: 64px; object-fit: cover; border-radius: 6px; border: 1px solid var(--teal-bright);">
        <div style="flex: 1;">
          <div style="font-size: 0.88rem; font-weight: 600; color: var(--text-primary);">${escapeHTML(file.name)}</div>
          <span style="font-size: 0.75rem; color: var(--teal-bright); font-weight: 600;">✓ Photo Attached</span>
        </div>
        <button type="button" class="btn btn-sm btn-secondary" onclick="clearWizardPhoto('${type}')" title="Remove Photo">
          <i data-lucide="trash-2"></i>
          <span>Remove</span>
        </button>
      </div>
    `;

    if (dropZone) dropZone.style.display = 'none';
    if (window.lucide) window.lucide.createIcons();
    showToast('Photo attached successfully! 📷', 'success');
  };
  reader.readAsDataURL(file);
}

function clearWizardPhoto(type) {
  const hidden = document.getElementById(`${type}-photo-url`);
  const preview = document.getElementById(`${type}-photo-preview`) || document.getElementById(`${type}-preview-container`);
  const fileInput = document.getElementById(`${type}-file-input`);
  const camInput = document.getElementById(`${type}-camera-input`);
  const galInput = document.getElementById(`${type}-gallery-input`);
  const dropZone = document.getElementById(`${type}-drop-zone`);

  if (hidden) hidden.value = '';
  if (fileInput) fileInput.value = '';
  if (camInput) camInput.value = '';
  if (galInput) galInput.value = '';
  if (preview) {
    preview.style.display = 'none';
    preview.innerHTML = '';
  }
  if (dropZone) dropZone.style.display = 'block';
  showToast('Photo removed', 'info');
}


