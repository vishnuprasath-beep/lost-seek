/* ==========================================================================
   CLAIM CREATION, OWNERSHIP VERIFICATION & REVIEW WORKFLOW
   ========================================================================== */

function openCreateClaimModal(lostId, foundId) {
  const lost = appState.lostReports.find(r => r.id === lostId);
  const found = appState.foundReports.find(r => r.id === foundId);
  if (!lost || !found) {
    showToast('Cannot initiate claim: reports not found.', 'warning');
    return;
  }

  const modal = document.getElementById('create-claim-modal');
  if (!modal) return;

  document.getElementById('create-claim-lost-id').value = lostId;
  document.getElementById('create-claim-found-id').value = foundId;
  document.getElementById('create-claim-secret-proof').value = '';

  const summary = document.getElementById('create-claim-items-summary');
  if (summary) {
    summary.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: #F87171;">Lost Property</span>
          <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">${escapeHTML(lost.title)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">📍 ${escapeHTML(lost.location)}</div>
        </div>
        <div style="font-size: 1.2rem; color: var(--teal-bright); font-weight: 800;">↕</div>
        <div>
          <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--teal-bright);">Found Property</span>
          <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">${escapeHTML(found.title)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">📍 ${escapeHTML(found.location)}</div>
        </div>
      </div>
    `;
  }

  modal.classList.add('show');
}

function closeCreateClaimModal() {
  const modal = document.getElementById('create-claim-modal');
  if (modal) modal.classList.remove('show');
}

function submitCreateClaimFromModal(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  const lostId = document.getElementById('create-claim-lost-id')?.value;
  const foundId = document.getElementById('create-claim-found-id')?.value;
  const secretProof = document.getElementById('create-claim-secret-proof')?.value.trim();
  const shareOpt = document.querySelector('input[name="claim-contact-share-opt"]:checked')?.value || 'share';
  const sharePhone = (shareOpt === 'share');

  if (!secretProof) {
    showToast('Please provide a distinguishing ownership proof.', 'warning');
    return;
  }

  const lost = appState.lostReports.find(r => r.id === lostId);
  const found = appState.foundReports.find(r => r.id === foundId);
  if (!lost || !found) return;

  const matches = findMatches(lost, 'lost');
  const targetMatch = matches.find(m => m.found.id === foundId) || { score: 85, matchReasons: ['Category and location correlation'] };

  const claimId = generateId('claim');
  const newClaim = {
    id: claimId,
    lostReportId: lostId,
    foundReportId: foundId,
    itemTitle: lost.title,
    claimantName: appState.user?.name || lost.reporterName || 'Student Claimant',
    claimantId: appState.user?.studentId || 'STU-2026',
    claimantContact: lost.phone || lost.phoneNumber || lost.phone_number || (appState.user && (appState.user.phone || appState.user.phoneNumber)) || '',
    sharePhone: sharePhone,
    finderName: found.finderName || 'Finder',
    matchScore: targetMatch.score,
    matchReasons: targetMatch.matchReasons || ['Strong multi-signal correlation'],
    unmatchedReasons: targetMatch.unmatchedReasons || [],
    verificationEvidence: secretProof,
    verificationNotes: '',
    status: 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!appState.claims) appState.claims = [];
  appState.claims.unshift(newClaim);

  // Update report statuses
  lost.status = 'Claim Submitted';
  found.status = 'Claim Submitted';

  // Add lifecycle history events
  if (!lost.history) lost.history = [];
  lost.history.push({
    action: 'Claim Submitted',
    timestamp: new Date().toISOString(),
    author: newClaim.claimantName,
    note: `Claim #${claimId} submitted with secret ownership proof.`
  });

  if (!found.history) found.history = [];
  found.history.push({
    action: 'Claim Submitted',
    timestamp: new Date().toISOString(),
    author: newClaim.claimantName,
    note: `Claim #${claimId} submitted by claimant.`
  });

  // Notifications
  appState.notifications.unshift({
    id: generateId('notif'),
    message: `🤝 Claim #${claimId} submitted for "${lost.title}". Proof logged for Campus Administration verification.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  appState.notifications.unshift({
    id: generateId('notif'),
    message: `📋 New Claim #${claimId} requires review: ${newClaim.claimantName} claimed "${found.title}".`,
    read: false,
    createdAt: new Date().toISOString()
  });

  saveData();
  renderNotifications();
  closeCreateClaimModal();

  showToast(`Claim #${claimId} created and sent for Admin verification! 🛡️`, 'success');

  // Navigate to claims page if admin, or my reports if student
  const isAdmin = appState.user && appState.user.role && appState.user.role.toLowerCase() === 'admin';
  if (isAdmin) {
    showPage('admin-claims-page');
  } else {
    showPage('my-reports-page');
  }
}

function openClaimReviewModal(claimId) {
  const claim = (appState.claims || []).find(c => c.id === claimId);
  if (!claim) return;

  const lost = appState.lostReports.find(r => r.id === claim.lostReportId) || { title: claim.itemTitle || 'Lost Item' };
  const found = appState.foundReports.find(r => r.id === claim.foundReportId) || { title: 'Found Property' };

  const modal = document.getElementById('claim-review-modal');
  const body = document.getElementById('claim-review-modal-body');
  if (!modal || !body) return;

  document.getElementById('claim-review-modal-title').textContent = `Claim #${claim.id}`;
  document.getElementById('claim-review-modal-sub').textContent = `Filed ${formatDateTime(claim.createdAt)} (${getTimeAgo(claim.createdAt)})`;

  const lostCat = CATEGORY_MAP[lost.category] || { label: 'Item', icon: '📦' };
  const foundCat = CATEGORY_MAP[found.category] || { label: 'Item', icon: '📦' };

  body.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px;">
      <!-- Lost Item Pane -->
      <div style="background: var(--bg-subtle); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
        <span class="badge badge-searching" style="font-size: 0.7rem;">🔴 Lost Report</span>
        <h4 style="margin: 6px 0 2px; font-size: 1rem; color: var(--text-primary);">${escapeHTML(lost.title)}</h4>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 6px;">📍 ${escapeHTML(lost.location || 'Campus')} • 📅 ${formatDateTime(lost.date || lost.createdAt)}</div>
        <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4;">${escapeHTML(lost.description || 'No description')}</div>
      </div>

      <!-- Found Item Pane -->
      <div style="background: var(--bg-subtle); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
        <span class="badge badge-matched" style="font-size: 0.7rem;">🟢 Found Property</span>
        <h4 style="margin: 6px 0 2px; font-size: 1rem; color: var(--text-primary);">${escapeHTML(found.title)}</h4>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 6px;">📍 ${escapeHTML(found.location || 'Campus')} • 📦 ${escapeHTML(found.custody || 'Security Desk')}</div>
        <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4;">${escapeHTML(found.description || 'No description')}</div>
      </div>
    </div>

    <!-- AI Match Confidence & Reasons -->
    <div class="explainable-reasons-box" style="margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--ai-violet);">AI Matching Confidence</span>
        <span class="badge badge-matched" style="font-weight: 800; font-size: 0.85rem;">${claim.matchScore || 85}% Correlation</span>
      </div>
      <div class="explainable-reasons-list">
        ${(claim.matchReasons || []).map(r => `<span class="reason-chip-matched">${r}</span>`).join('')}
        ${(claim.unmatchedReasons || []).map(r => `<span class="reason-chip-unmatched">${r}</span>`).join('')}
      </div>
    </div>

    <!-- Private Secret Verification Proof -->
    <div style="margin-bottom: 18px;">
      <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--color-warning); display: block; margin-bottom: 4px;">
        🔒 Private Distinguishing Proof (Submitted by Claimant)
      </span>
      <div class="claim-evidence-box">
        <strong>Claimant Stated:</strong> "${escapeHTML(claim.verificationEvidence || 'No distinguishing proof entered.')}"
      </div>
    </div>

    <!-- Claimant & Finder Info -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 0.82rem; background: var(--bg-subtle); padding: 12px 14px; border-radius: 8px; margin-bottom: 18px; border: 1px solid var(--border-subtle);">
      <div>
        <span style="color: var(--text-muted); display: block;">Claimant:</span>
        <strong style="color: var(--text-primary);">${escapeHTML(claim.claimantName)} (${escapeHTML(claim.claimantId)})</strong>
        <div style="color: var(--text-muted); margin-top: 2px;">${(claim.sharePhone || claim.phoneSharingConsent) && (claim.claimantContact || claim.claimantPhone || claim.phone) ? '📞 ' + escapeHTML(claim.claimantContact || claim.claimantPhone || claim.phone) : ((claim.claimantContact || claim.claimantPhone || claim.phone) ? '🔒 Contact Private' : 'ℹ️ No phone provided')}</div>
      </div>
      <div>
        <span style="color: var(--text-muted); display: block;">Finder &amp; Custody:</span>
        <strong style="color: var(--text-primary);">${escapeHTML(claim.finderName || found.finderName || 'Finder')}</strong>
        <div style="color: var(--text-muted); margin-top: 2px;">Custody: ${escapeHTML(found.custody || 'Campus Security Desk')}</div>
      </div>
    </div>

    <!-- Status & Admin Actions -->
    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid var(--border-subtle); flex-wrap: wrap; gap: 10px;">
      <button type="button" class="btn btn-outline" style="border-color: rgba(239, 68, 68, 0.4); color: #F87171;" onclick="closeClaimReviewModal(); openItemHelpModal('${claim.lostReportId}', '${escapeHTML(lost.title)}', '${escapeHTML(lost.location)}')">
        <i data-lucide="shield-alert"></i>
        <span>🆘 Need Help?</span>
      </button>

      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        ${claim.status !== 'Rejected' ? `
          <button type="button" class="btn btn-secondary btn-sm" style="color: #F87171;" onclick="updateClaimStatus('${claim.id}', 'Rejected')">
            <i data-lucide="x-circle"></i>
            <span>Reject</span>
          </button>
        ` : ''}
        ${claim.status === 'Pending' ? `
          <button type="button" class="btn btn-secondary btn-sm" onclick="updateClaimStatus('${claim.id}', 'Under Verification')">
            <i data-lucide="help-circle"></i>
            <span>Request More Proof</span>
          </button>
        ` : ''}
        ${claim.status !== 'Approved' && claim.status !== 'Completed' ? `
          <button type="button" class="btn btn-accent-teal btn-sm" onclick="updateClaimStatus('${claim.id}', 'Approved')">
            <i data-lucide="check-circle-2"></i>
            <span>Approve Claim</span>
          </button>
        ` : ''}
        ${claim.status === 'Approved' ? `
          <button type="button" class="btn btn-primary btn-sm" onclick="closeClaimReviewModal(); openAdminHandoverModal('${claim.foundReportId}', 'found')">
            <i data-lucide="package-check"></i>
            <span>Authorize Safe Handover</span>
          </button>
        ` : ''}
      </div>
    </div>
  `;

  modal.classList.add('show');
  if (window.lucide) window.lucide.createIcons();
}

function closeClaimReviewModal() {
  const modal = document.getElementById('claim-review-modal');
  if (modal) modal.classList.remove('show');
}

function updateClaimStatus(claimId, newStatus) {
  const claim = (appState.claims || []).find(c => c.id === claimId);
  if (!claim) return;

  claim.status = newStatus;
  claim.updatedAt = new Date().toISOString();

  const lost = appState.lostReports.find(r => r.id === claim.lostReportId);
  const found = appState.foundReports.find(r => r.id === claim.foundReportId);

  if (newStatus === 'Approved') {
    if (lost) lost.status = 'Claim Approved';
    if (found) found.status = 'Claim Approved';
  } else if (newStatus === 'Completed') {
    if (lost) lost.status = 'Recovered';
    if (found) found.status = 'Returned';
  } else if (newStatus === 'Rejected') {
    if (lost) lost.status = 'Active';
    if (found) found.status = 'Active';
  }

  // Audit history
  const historyEvent = {
    action: `Claim ${newStatus}`,
    timestamp: new Date().toISOString(),
    author: appState.user?.name || 'Campus Administrator',
    note: `Claim #${claimId} status updated to ${newStatus}.`
  };

  if (lost && !lost.history) lost.history = [];
  if (lost) lost.history.push(historyEvent);
  if (found && !found.history) found.history = [];
  if (found) found.history.push(historyEvent);

  // Cloud persistence for claim update
  fetch(API_BASE + '/api/claims?id=' + encodeURIComponent(claimId), {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status: newStatus })
  }).then(r => r.json()).then(d => {
    if (d.success) updateSyncIndicator('synced', 'Cloud Synced');
  }).catch(e => console.warn('Cloud claim update error:', e));

  // Notification
  appState.notifications.unshift({
    id: generateId('notif'),
    message: `🛡️ Claim #${claimId} update: Status changed to "${newStatus}" by Campus Security.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  saveData();
  renderNotifications();
  renderAdminClaimsPage(currentClaimFilterTab);
  closeClaimReviewModal();

  showToast(`Claim #${claimId} marked ${newStatus}!`, 'success');
}
