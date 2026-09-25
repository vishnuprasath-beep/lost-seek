/* ==========================================================================
   CLAIM & DYNAMIC VERIFICATION FLOW
   ========================================================================== */
function getVerificationQuestion(category) {
  const cat = (category || '').toLowerCase().replace(/s$/, '');
  switch (cat) {
    case 'wallet':
      return "How much cash was approximately inside?";
    case 'electronics':
      return "What is the lock screen wallpaper, or describe any case/sticker?";
    case 'keys':
      return "Describe the keychain and number of keys";
    case 'bags':
    case 'bag':
      return "Name one specific item inside the bag";
    case 'id-card':
      return "What is your student ID number or department?";
    default:
      return "Describe one unique detail about this item";
  }
}

function openClaimModal(lostId, foundId, title, category = 'misc') {
  const modal = document.getElementById('claim-modal');
  const titleEl = document.getElementById('modal-item-title');
  const lostInput = document.getElementById('claim-lost-id');
  const foundInput = document.getElementById('claim-found-id');
  const promptEl = document.getElementById('claim-verification-prompt');
  const answerInput = document.getElementById('claim-answer');

  const question = getVerificationQuestion(category);

  if (titleEl) titleEl.textContent = `Claim Item: ${title}`;
  if (lostInput) lostInput.value = lostId;
  if (foundInput) foundInput.value = foundId;
  if (promptEl) promptEl.textContent = question;
  if (answerInput) {
    answerInput.value = '';
    answerInput.placeholder = `e.g. ${question}...`;
  }
  if (modal) modal.classList.add('show');
}

function closeClaimModal() {
  const modal = document.getElementById('claim-modal');
  if (modal) modal.classList.remove('show');
}

function submitClaimVerification(e) {
  e.preventDefault();

  const lostId = document.getElementById('claim-lost-id').value;
  const foundId = document.getElementById('claim-found-id').value;
  const answer = document.getElementById('claim-answer').value.trim();

  const newClaim = {
    id: generateId('claim'),
    lostReportId: lostId,
    foundReportId: foundId,
    claimantName: appState.user?.name || 'Alex Rivera',
    matchScore: 92,
    status: 'Pending Admin Review',
    verificationAnswer: answer,
    createdAt: new Date().toISOString()
  };

  appState.claims.unshift(newClaim);

  // Update report statuses
  const lost = appState.lostReports.find(r => r.id === lostId);
  if (lost) lost.status = 'Claimed';

  const found = appState.foundReports.find(r => r.id === foundId);
  if (found) found.status = 'Claimed';

  appState.notifications.unshift({
    id: generateId('notif'),
    message: `⏳ Claim submitted for verification! Desk security is reviewing your details.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  saveData();
  renderAllViews();
  closeClaimModal();
  showToast('Claim submitted! Admin will verify shortly. 🔐', 'success');
}
