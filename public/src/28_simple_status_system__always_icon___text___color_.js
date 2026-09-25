/* ==========================================================================
   SIMPLE STATUS SYSTEM (ALWAYS ICON + TEXT + COLOR)
   ========================================================================== */
function getStatusBadgeHTML(status) {
  const norm = (status || 'Active').toLowerCase();
  if (norm.includes('wait') || norm.includes('pending')) {
    return '<span class="status-pill status-waiting"><i data-lucide="clock"></i> Pending</span>';
  } else if (norm.includes('match') || norm.includes('possible')) {
    return '<span class="status-pill status-possible-match"><i data-lucide="sparkles"></i> Possible Match</span>';
  } else if (norm.includes('claim approved') || norm.includes('approved')) {
    return '<span class="status-pill status-approved"><i data-lucide="check-circle-2"></i> Claim Approved</span>';
  } else if (norm.includes('claim')) {
    return '<span class="status-pill status-claimed"><i data-lucide="hand"></i> Claimed</span>';
  } else if (norm.includes('check') || norm.includes('verif')) {
    return '<span class="status-pill status-checking"><i data-lucide="shield-check"></i> Under Verification</span>';
  } else if (norm.includes('return') || norm.includes('recovered')) {
    return '<span class="status-pill status-returned"><i data-lucide="package-check"></i> Returned</span>';
  } else if (norm.includes('reject')) {
    return '<span class="status-pill status-rejected"><i data-lucide="x-circle"></i> Rejected</span>';
  } else if (norm.includes('closed') || norm.includes('expired')) {
    return '<span class="status-pill status-archived"><i data-lucide="archive"></i> Closed</span>';
  } else {
    return '<span class="status-pill status-looking"><i data-lucide="search"></i> Active</span>';
  }
}
