/* ==========================================================================
   CONTACT PRIVACY DISPLAY SYSTEM
   ========================================================================== */
function renderContactCard(report, roleLabel = 'Finder') {
  if (!report) return '';
  const rawPhone = report.phone || report.phoneNumber || report.phone_number || report.contactPhone || '';
  const phone = String(rawPhone || '').trim();
  const isShared = !!(report.sharePhone ?? report.phoneSharingConsent ?? report.phone_sharing_consent ?? report.phoneShared);
  const hasPhoneRecord = !!(report.hasPhoneProvided || phone);

  // STATE B: User HAS explicitly shared phone number AND current viewer is authorized to receive it
  if (phone && isShared) {
    return `
      <div class="contact-display-card contact-display-shared">
        <div class="contact-details-left">
          <span class="contact-details-tag">✓ Direct Contact Available</span>
          <div class="contact-number-large">📞 ${escapeHTML(phone)}</div>
          <span class="contact-sub-note">The ${roleLabel.toLowerCase()} chose to share this number.</span>
        </div>
        <a href="tel:${escapeHTML(phone)}" class="contact-action-call-btn">
          <i data-lucide="phone-call"></i>
          <span>Contact ${roleLabel}</span>
        </a>
      </div>
    `;
  }
  // STATE A: User has NOT shared phone number (or kept private)
  else if (!isShared && (hasPhoneRecord || phone)) {
    return `
      <div class="contact-display-card contact-display-private">
        <div class="contact-details-left">
          <span class="contact-details-tag">🔒 Private Contact</span>
          <div class="contact-number-large">Phone number kept private</div>
          <span class="contact-sub-note">The ${roleLabel.toLowerCase()} chose to keep their contact details private.</span>
        </div>
        ${appState.user?.role?.toLowerCase() === 'admin' ? '' : `<button type="button" class="contact-admin-help-btn" onclick="openAdminContactHelpModal('${report.id}')">
          <i data-lucide="shield"></i>
          <span>Ask Admin to Help</span>
        </button>`}
      </div>
    `;
  }
  // STATE C: Phone number does not exist
  else {
    return `
      <div class="contact-display-card contact-display-unavailable">
        <div class="contact-details-left">
          <span class="contact-details-tag">ℹ️ Contact Unavailable</span>
          <div class="contact-number-large">No phone number provided</div>
          <span class="contact-sub-note">No phone number was registered for this ${roleLabel.toLowerCase()}.</span>
        </div>
        ${appState.user?.role?.toLowerCase() === 'admin' ? '' : `<button type="button" class="contact-admin-help-btn" onclick="openAdminContactHelpModal('${report.id}')">
          <i data-lucide="shield"></i>
          <span>Ask Admin to Help</span>
        </button>`}
      </div>
    `;
  }
}
