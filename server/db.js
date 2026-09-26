/**
 * LostSeek - Cloud Database Layer (Supabase PostgreSQL)
 * Authoritative production database client.
 */

const { createClient } = require('@supabase/supabase-js');
const { evaluateHeuristicMatch } = require('./matcher.js');

// Load environment variables if running locally
if (process.env.NODE_ENV !== 'production') {
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const key = trimmed.slice(0, idx).trim();
          let val = trimmed.slice(idx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) process.env[key] = val;
        }
      }
    }
  } catch (e) {
    // Ignore local env load error
  }
}

let supabaseInstance = null;

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  return { url, key };
}

function isConfigured() {
  const { url, key } = getSupabaseConfig();
  return !!(url && key && !url.includes('your-project') && !key.includes('your-supabase'));
}

function getSupabase() {
  if (!isConfigured()) {
    console.error('[SERVER ERROR] Supabase PostgreSQL database is not configured. Required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Configure them in .env.local and Vercel Project Settings.');
    const error = new Error('Unable to submit your report right now. Please try again.');
    error.code = 'CONFIG_MISSING';
    throw error;
  }
  if (!supabaseInstance) {
    const { url, key } = getSupabaseConfig();
    supabaseInstance = createClient(url, key, {
      auth: { persistSession: false }
    });
  }
  return supabaseInstance;
}

// ---------------------------------------------------------------------------
// 1. REPORTS
// ---------------------------------------------------------------------------
async function getReports(filter = {}, user = null) {
  const supabase = getSupabase();
  let query = supabase.from('reports').select('*').order('created_at', { ascending: false });

  if (filter.id) {
    query = query.eq('id', filter.id);
  }
  if (filter.type) {
    query = query.ilike('type', filter.type);
  }
  if (filter.userId) {
    query = query.eq('reporter_id', filter.userId);
  }
  if (filter.status) {
    query = query.eq('status', filter.status);
  }

  if (filter.limit) {
    const offset = filter.offset || 0;
    query = query.range(offset, offset + filter.limit - 1);
  }

  const { data, error } = await query;
  if (error) throw error;

  const userRole = user ? String(user.role || '').toLowerCase() : '';
  const isAdmin = ['admin', 'supervisor', 'director'].includes(userRole);

  const userIdentifiers = user ? [
    user.username,
    user.id,
    user.studentId,
    user.username && user.username.split('@')[0],
    user.email && user.email.split('@')[0]
  ].filter(Boolean).map(s => String(s).toLowerCase().trim()) : [];

  // For non-admin authenticated students, identify all LOST reports that meaningfully match ANY of their FOUND reports
  const meaningfullyMatchedLostReportIds = new Set();

  if (!isAdmin && userIdentifiers.length > 0) {
    try {
      // Find FOUND reports owned by this calling user
      const orClauses = userIdentifiers.map(uid => `reporter_id.ilike.${uid}`).join(',');
      const { data: userFoundReports } = await supabase
        .from('reports')
        .select('*')
        .ilike('type', 'FOUND')
        .or(orClauses);

      if (userFoundReports && userFoundReports.length > 0) {
        const foundIds = userFoundReports.map(f => f.id);

        // 1. Check existing matches table records
        const { data: dbMatches } = await supabase
          .from('matches')
          .select('lost_report_id, found_report_id, score, confidence')
          .in('found_report_id', foundIds);

        (dbMatches || []).forEach(m => {
          if (Number(m.score) >= 40 || ['High', 'Medium'].includes(m.confidence)) {
            meaningfullyMatchedLostReportIds.add(m.lost_report_id);
          }
        });

        // 2. Corroborate candidate LOST reports in data with heuristic multi-signal matcher
        for (const r of (data || [])) {
          if (r.type && r.type.toUpperCase() === 'LOST' && !meaningfullyMatchedLostReportIds.has(r.id)) {
            for (const f of userFoundReports) {
              const hMatch = evaluateHeuristicMatch(r, f);
              if (hMatch && hMatch.isMatch && hMatch.score >= 40) {
                meaningfullyMatchedLostReportIds.add(r.id);
                break;
              }
            }
          }
        }
      }
    } catch (matchCheckErr) {
      console.warn('Lost report image match check notice:', matchCheckErr.message);
    }
  }

  return (data || []).map(r => {
    const isOwner = userIdentifiers.length > 0 && r.reporter_id && userIdentifiers.includes(String(r.reporter_id).toLowerCase().trim());
    const isMatchedFoundReporter = !isAdmin && !isOwner && meaningfullyMatchedLostReportIds.has(r.id);

    // LOST Report Image Visibility:
    // A. Owner: Always sees own original image
    // B. Admin/Staff: Sees image for verification & administration
    // C. Meaningfully matched FOUND reporter: Allowed to see image for verification
    // D. Unrelated students: Stripped server-side (null)
    const isLost = r.type && r.type.toUpperCase() === 'LOST';
    const canSeeLostImage = !isLost || isAdmin || isOwner || isMatchedFoundReporter;
    const finalImageUrl = canSeeLostImage ? (r.image_url || null) : null;
    const imageSharedForMatch = isLost && isMatchedFoundReporter;

    // Security & Phone Privacy check
    const canSeePhone = !!r.phone_sharing_consent || isAdmin || isOwner;
    const phoneVal = canSeePhone ? (r.phone_number || null) : null;
    const isShared = !!r.phone_sharing_consent;
    const hasPhone = !!(r.phone_number && String(r.phone_number).trim());

    return {
      id: r.id,
      type: r.type.toUpperCase(),
      itemType: r.type.charAt(0).toUpperCase() + r.type.slice(1).toLowerCase(),
      title: r.title || r.item_name,
      itemName: r.item_name || r.title,
      description: r.description,
      category: r.category,
      color: r.color,
      brand: r.brand,
      distinguishingFeatures: r.distinguishing_features,
      location: r.location,
      customLocation: r.custom_location,
      dateTime: r.date_time,
      date: r.date_time,
      reporterId: r.reporter_id,
      reporterName: r.reporter_name,
      // Fully synchronized phone aliases for frontend & API compatibility:
      phone: phoneVal,
      phoneNumber: phoneVal,
      phone_number: phoneVal,
      contactPhone: phoneVal,
      sharePhone: isShared,
      phoneSharingConsent: isShared,
      phone_sharing_consent: isShared,
      hasPhoneProvided: hasPhone,
      imageUrl: finalImageUrl,
      photo: finalImageUrl,
      imageSharedForMatch: imageSharedForMatch,
      aiAnalysis: r.ai_analysis || null,
      ai_analysis: r.ai_analysis || null,
      status: r.status,
      safetyFlag: !!r.safety_flag,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  });
}

async function createReport(reportData, user) {
  const supabase = getSupabase();
  const type = String(reportData.type || reportData.itemType || 'LOST').toUpperCase();
  if (!['LOST', 'FOUND'].includes(type)) {
    throw new Error('Invalid report type. Must be LOST or FOUND.');
  }

  const id = reportData.id || `${type.toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const title = reportData.title || reportData.itemName || 'Untitled Item';
  const category = reportData.category || 'misc';
  const location = reportData.location || 'Campus';
  const aiAnalysis = reportData.aiAnalysis || reportData.ai_analysis || null;

  const validStatuses = ['Active', 'Pending', 'Under Verification', 'Claim Approved', 'Verified', 'Returned', 'Recovered', 'Closed', 'Expired'];
  let status = String(reportData.status || 'Active').trim();
  if (!validStatuses.includes(status)) {
    status = 'Active';
  }

  const reporterId = user ? (user.username || user.loginId || user.id) : (reportData.reporterId || reportData.reporter_id || reportData.userId || reportData.user_id || 'anonymous');
  const reporterName = user ? (user.name || user.username) : (reportData.reporterName || reportData.reporter_name || 'Campus Member');

  const rawPhone = reportData.phone || reportData.phoneNumber || reportData.phone_number || reportData.contactPhone || '';
  const rawConsent = (reportData.sharePhone !== undefined ? reportData.sharePhone : (reportData.phoneSharingConsent !== undefined ? reportData.phoneSharingConsent : (reportData.phone_sharing_consent !== undefined ? reportData.phone_sharing_consent : reportData.phoneShared)));

  const row = {
    id,
    type,
    title,
    item_name: reportData.itemName || title,
    description: reportData.description || '',
    category,
    color: reportData.color || '',
    brand: reportData.brand || '',
    distinguishing_features: reportData.distinguishingFeatures || '',
    location,
    custom_location: reportData.customLocation || '',
    date_time: reportData.dateTime || reportData.date || new Date().toISOString(),
    reporter_id: reporterId,
    reporter_name: reporterName,
    phone_number: String(rawPhone || '').trim(),
    phone_sharing_consent: !!rawConsent,
    image_url: reportData.imageUrl || reportData.photo || null,
    status: status,
    safety_flag: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (aiAnalysis) {
    row.ai_analysis = aiAnalysis;
  }

  try {
    const { data, error } = await supabase.from('reports').insert(row).select().single();
    if (error) {
      // If remote Supabase column ai_analysis does not exist yet, fallback cleanly without failing report creation
      if (error.message && error.message.includes('ai_analysis')) {
        delete row.ai_analysis;
        const retry = await supabase.from('reports').insert(row).select().single();
        if (retry.error) throw retry.error;
        return { ...retry.data, ai_analysis: aiAnalysis, aiAnalysis };
      }
      throw error;
    }
    return data;
  } catch (err) {
    if (err.message && err.message.includes('ai_analysis')) {
      delete row.ai_analysis;
      const retry = await supabase.from('reports').insert(row).select().single();
      if (retry.error) throw retry.error;
      return { ...retry.data, ai_analysis: aiAnalysis, aiAnalysis };
    }
    throw err;
  }
}

async function updateReport(id, updates, user) {
  const supabase = getSupabase();
  const validStatuses = ['Active', 'Pending', 'Under Verification', 'Claim Approved', 'Verified', 'Returned', 'Recovered', 'Closed', 'Expired'];
  const sanitized = { updated_at: new Date().toISOString() };

  for (const key of Object.keys(updates || {})) {
    if (key === 'status') {
      sanitized.status = validStatuses.includes(updates.status) ? updates.status : 'Active';
    }
    if (key === 'safetyFlag' || key === 'safety_flag') sanitized.safety_flag = !!updates[key];
    if (key === 'imageUrl' || key === 'image_url' || key === 'photo') sanitized.image_url = updates[key];
    if (key === 'description') sanitized.description = updates[key];
    if (key === 'title') sanitized.title = updates[key];
    if (key === 'itemName' || key === 'item_name') sanitized.item_name = updates[key];
    if (key === 'location') sanitized.location = updates[key];
    if (key === 'customLocation' || key === 'custom_location') sanitized.custom_location = updates[key];
    if (key === 'category') sanitized.category = updates[key];
    if (key === 'color') sanitized.color = updates[key];
    if (key === 'brand') sanitized.brand = updates[key];
    if (key === 'distinguishingFeatures' || key === 'distinguishing_features') sanitized.distinguishing_features = updates[key];
    if (key === 'aiAnalysis' || key === 'ai_analysis') sanitized.ai_analysis = updates[key];
    if (key === 'phoneNumber' || key === 'phone' || key === 'phone_number') sanitized.phone_number = String(updates[key] || '').trim();
    if (key === 'phoneSharingConsent' || key === 'sharePhone' || key === 'phone_sharing_consent') sanitized.phone_sharing_consent = !!updates[key];
  }

  try {
    const { data, error } = await supabase.from('reports').update(sanitized).eq('id', id).select().single();
    if (error) {
      if (error.message && error.message.includes('ai_analysis')) {
        delete sanitized.ai_analysis;
        const retry = await supabase.from('reports').update(sanitized).eq('id', id).select().single();
        if (retry.error) throw retry.error;
        return retry.data;
      }
      throw error;
    }
    return data;
  } catch (err) {
    if (err.message && err.message.includes('ai_analysis')) {
      delete sanitized.ai_analysis;
      const retry = await supabase.from('reports').update(sanitized).eq('id', id).select().single();
      if (retry.error) throw retry.error;
      return retry.data;
    }
    throw err;
  }
}

async function deleteReport(id, callingUser) {
  const supabase = getSupabase();
  if (!id) throw new Error('Report id is required');

  const { data: rep, error: fetchErr } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !rep) {
    const err = new Error('Report not found');
    err.statusCode = 404;
    throw err;
  }

  // Strict server-side ownership / authorization enforcement
  const callingUsername = callingUser ? (callingUser.username || callingUser.id) : null;
  const callingRole = callingUser ? (callingUser.role || '').toLowerCase() : '';
  const isOwner = callingUsername && (
    rep.reporter_id === callingUsername ||
    rep.reporter_id === callingUser.id ||
    rep.reporter_name === callingUser.name
  );
  const isStaff = ['admin', 'supervisor', 'director'].includes(callingRole);

  if (!isOwner && !isStaff) {
    const err = new Error('Unauthorized: You can only remove reports you created.');
    err.statusCode = 403;
    throw err;
  }

  // Delete from Supabase reports
  const { error: delErr } = await supabase
    .from('reports')
    .delete()
    .eq('id', id);

  if (delErr) {
    // If foreign key constraint blocks deletion, update status to Closed
    const { error: closeErr } = await supabase
      .from('reports')
      .update({ status: 'Closed', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (closeErr) throw closeErr;
  }

  // Close any active community alerts associated with this report
  try {
    await closeCommunityAlertForReport(id, 'CLOSED');
  } catch (e) {}

  return { success: true, message: 'Report removed successfully.', reportId: id };
}

// ---------------------------------------------------------------------------
// 2. CLAIMS
// ---------------------------------------------------------------------------
async function getClaims(filter = {}, user = null) {
  const supabase = getSupabase();
  let query = supabase.from('claims').select('*').order('created_at', { ascending: false });

  if (filter.id) query = query.eq('id', filter.id);
  if (filter.claimantId) query = query.eq('claimant_id', filter.claimantId);
  if (filter.status) query = query.eq('claim_status', filter.status);

  if (filter.limit) {
    const offset = filter.offset || 0;
    query = query.range(offset, offset + filter.limit - 1);
  }

  const { data, error } = await query;
  if (error) throw error;

  const isAdmin = user && ['admin', 'supervisor', 'director'].includes(user.role);

  return (data || []).map(c => {
    const isClaimant = user && (user.username === c.claimant_id || user.id === c.claimant_id);
    const canSeeEvidence = isAdmin || isClaimant;

    let meta = { contact: '', sharePhone: false, notes: c.admin_notes || '' };
    if (c.admin_notes && typeof c.admin_notes === 'string' && c.admin_notes.trim().startsWith('{') && c.admin_notes.trim().endsWith('}')) {
      try {
        const parsed = JSON.parse(c.admin_notes);
        meta = { contact: parsed.contact || '', sharePhone: !!parsed.sharePhone, notes: parsed.notes || '' };
      } catch (e) {
        meta.notes = c.admin_notes;
      }
    }
    const canSeeContact = isAdmin || isClaimant || meta.sharePhone;

    return {
      id: c.id,
      lostReportId: c.lost_report_id,
      foundReportId: c.found_report_id,
      matchId: c.match_id,
      claimantId: c.claimant_id,
      claimantName: c.claimant_name,
      claimantContact: canSeeContact ? (meta.contact || null) : null,
      claimantPhone: canSeeContact ? (meta.contact || null) : null,
      sharePhone: !!meta.sharePhone,
      itemTitle: c.item_title,
      // Mask sensitive private evidence for unauthorized viewers
      verificationEvidence: canSeeEvidence ? c.verification_evidence : '🔒 [Protected: Visible to Admin and Claimant Only]',
      claimStatus: c.claim_status,
      status: c.claim_status,
      adminNotes: meta.notes,
      handoverLocation: c.handover_location,
      frozen: !!c.frozen,
      createdAt: c.created_at,
      updatedAt: c.updated_at
    };
  });
}

async function createClaim(claimData, user) {
  const supabase = getSupabase();
  const id = claimData.id || `claim-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const contact = claimData.claimantContact || claimData.claimantPhone || claimData.phone || (user && user.phone) || '';
  const share = !!(claimData.sharePhone ?? claimData.phoneSharingConsent);
  let adminNotesStr = claimData.adminNotes || '';
  if (contact || share) {
    adminNotesStr = JSON.stringify({ notes: adminNotesStr, contact, sharePhone: share });
  }

  const row = {
    id,
    lost_report_id: claimData.lostReportId || null,
    found_report_id: claimData.foundReportId || null,
    match_id: claimData.matchId || null,
    claimant_id: user ? (user.username || user.id) : (claimData.claimantId || 'anonymous'),
    claimant_name: user ? (user.name || user.username) : (claimData.claimantName || 'Claimant'),
    item_title: claimData.itemTitle || claimData.title || 'Claimed Item',
    verification_evidence: claimData.verificationEvidence || claimData.evidence || 'No evidence provided',
    claim_status: 'Pending',
    admin_notes: adminNotesStr,
    handover_location: claimData.handoverLocation || 'Campus Security Desk (Main Gate)',
    frozen: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('claims').insert(row).select().single();
  if (error) throw error;
  return data;
}

async function updateClaim(id, updates, user) {
  const supabase = getSupabase();
  const isAdmin = user && ['admin', 'supervisor', 'director'].includes(user.role);

  // Status changes: only admin can approve/reject
  const sanitized = { updated_at: new Date().toISOString() };
  if (updates.status || updates.claimStatus) {
    const newStatus = updates.status || updates.claimStatus;
    if (['Approved', 'Rejected', 'Completed', 'Under Verification'].includes(newStatus) && !isAdmin) {
      throw new Error('Unauthorized. Only Admins can modify claim approval status.');
    }
    sanitized.claim_status = newStatus;
  }
  if (updates.adminNotes !== undefined && isAdmin) {
    sanitized.admin_notes = updates.adminNotes;
  }
  if (updates.handoverLocation) {
    sanitized.handover_location = updates.handoverLocation;
  }
  if (updates.frozen !== undefined) {
    sanitized.frozen = !!updates.frozen;
  }

  const { data, error } = await supabase.from('claims').update(sanitized).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// 3. MATCHES
// ---------------------------------------------------------------------------
async function getMatches(filter = {}) {
  const supabase = getSupabase();
  let query = supabase.from('matches').select('*').order('created_at', { ascending: false });

  if (filter.lostReportId) query = query.eq('lost_report_id', filter.lostReportId);
  if (filter.foundReportId) query = query.eq('found_report_id', filter.foundReportId);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(m => ({
    id: m.id,
    lostReportId: m.lost_report_id,
    foundReportId: m.found_report_id,
    score: Number(m.score),
    confidence: m.confidence,
    signals: m.signals || {},
    createdAt: m.created_at
  }));
}

async function createMatch(matchData) {
  const supabase = getSupabase();
  const id = matchData.id || `match-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const row = {
    id,
    lost_report_id: matchData.lostReportId,
    found_report_id: matchData.foundReportId,
    score: matchData.score || 0,
    confidence: matchData.confidence || 'Medium',
    signals: matchData.signals || {},
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('matches').upsert(row, { onConflict: 'lost_report_id,found_report_id' }).select().single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// 4. HELP REQUESTS (🆘 Need Help?)
// ---------------------------------------------------------------------------
async function getHelpRequests(filter = {}, user = null) {
  const supabase = getSupabase();
  let query = supabase.from('help_requests').select('*').order('created_at', { ascending: false });

  if (filter.id) query = query.eq('id', filter.id);
  if (filter.status) query = query.eq('status', filter.status);
  if (filter.isUrgent !== undefined) query = query.eq('is_urgent', filter.isUrgent);

  const isAdmin = user && ['admin', 'supervisor', 'director'].includes(user.role);
  if (!isAdmin && user) {
    query = query.eq('user_id', user.username || user.id);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(h => ({
    id: h.id,
    userId: h.user_id,
    userName: h.user_name,
    role: h.role,
    reason: h.reason,
    details: h.details,
    relatedItemId: h.related_item_id,
    relatedClaimId: h.related_claim_id,
    isUrgent: !!h.is_urgent,
    status: h.status,
    adminResolution: h.admin_resolution,
    createdAt: h.created_at,
    updatedAt: h.updated_at
  }));
}

async function createHelpRequest(helpData, user) {
  const supabase = getSupabase();
  const id = helpData.id || `help-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const isUrgent = !!helpData.isUrgent;

  const validReasons = [
    'Unresponsive Finder/Claimant',
    'Suspicious Ownership Claim',
    'Harassment or Inappropriate Behavior',
    'Disputed Item Condition/Damage',
    'Wrong Item Handed Over',
    'Other Urgent Safety Concern'
  ];
  let reason = helpData.reason;
  if (!validReasons.includes(reason)) {
    if (reason && reason.toLowerCase().includes('suspicious')) {
      reason = 'Suspicious Ownership Claim';
    } else if (reason && reason.toLowerCase().includes('harass')) {
      reason = 'Harassment or Inappropriate Behavior';
    } else if (reason && reason.toLowerCase().includes('damage')) {
      reason = 'Disputed Item Condition/Damage';
    } else if (reason && reason.toLowerCase().includes('wrong')) {
      reason = 'Wrong Item Handed Over';
    } else if (reason && reason.toLowerCase().includes('unresponsive')) {
      reason = 'Unresponsive Finder/Claimant';
    } else {
      reason = 'Other Urgent Safety Concern';
    }
  }

  const row = {
    id,
    user_id: user ? (user.username || user.id) : (helpData.userId || 'anonymous'),
    user_name: user ? (user.name || user.username) : (helpData.userName || 'Campus User'),
    role: user ? user.role : 'student',
    reason,
    details: helpData.details || 'No details provided',
    related_item_id: helpData.relatedItemId || null,
    related_claim_id: helpData.relatedClaimId || null,
    is_urgent: isUrgent,
    status: 'Open',
    admin_resolution: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('help_requests').insert(row).select().single();
  if (error) throw error;

  // If URGENT safety complaint: automatically flag report and freeze handover
  if (isUrgent) {
    if (helpData.relatedItemId) {
      await supabase.from('reports').update({ safety_flag: true, updated_at: new Date().toISOString() }).eq('id', helpData.relatedItemId);
    }
    if (helpData.relatedClaimId) {
      await supabase.from('claims').update({ frozen: true, updated_at: new Date().toISOString() }).eq('id', helpData.relatedClaimId);
    }
    // Create high-priority admin notification
    await supabase.from('notifications').insert({
      id: `notif-urgent-${Date.now()}`,
      user_id: 'admin@campus.edu',
      message: `🚨 URGENT SAFETY ALERT: ${helpData.reason} filed by ${row.user_name}. Associated item/claim has been frozen.`,
      type: 'urgent',
      read: false,
      created_at: new Date().toISOString()
    });
  }

  return data;
}

async function updateHelpRequest(id, updates, user) {
  const supabase = getSupabase();
  const isAdmin = user && ['admin', 'supervisor', 'director'].includes(user.role);
  if (!isAdmin) {
    throw new Error('Unauthorized. Only Admins can resolve or update help tickets.');
  }

  const sanitized = { updated_at: new Date().toISOString() };
  if (updates.status) sanitized.status = updates.status;
  if (updates.adminResolution) sanitized.admin_resolution = updates.adminResolution;

  const { data, error } = await supabase.from('help_requests').update(sanitized).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// 5. NOTIFICATIONS
// ---------------------------------------------------------------------------
async function getNotifications(userId) {
  const supabase = getSupabase();
  let query = supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
  if (userId) {
    query = query.or(`user_id.eq.${userId},user_id.eq.all`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(n => ({
    id: n.id,
    userId: n.user_id,
    message: n.message,
    type: n.type,
    read: !!n.read,
    createdAt: n.created_at
  }));
}

async function createNotification(notifData) {
  const supabase = getSupabase();
  const id = notifData.id || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const row = {
    id,
    user_id: notifData.userId || 'all',
    message: notifData.message,
    type: notifData.type || 'info',
    read: false,
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('notifications').insert(row).select().single();
  if (error) throw error;
  return data;
}

async function clearNotifications(userId) {
  const supabase = getSupabase();
  if (!userId) return { success: true, count: 0 };

  const { data, error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
    .select();

  if (error) throw error;
  return { success: true, count: (data || []).length };
}

async function markAllNotificationsRead(userId) {
  const supabase = getSupabase();
  if (!userId) return { success: true };

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId);

  if (error) throw error;
  return { success: true };
}

// ---------------------------------------------------------------------------
// 6. USERS
// ---------------------------------------------------------------------------
function parseUserMetadata(phone) {
  // Legacy function stub in case it is imported anywhere else, though it shouldn't be.
  return { phone: String(phone || ''), avatarUrl: '', passwordHash: '' };
}

async function getUser(usernameOrId) {
  const supabase = getSupabase();
  const clean = String(usernameOrId || '').trim().toLowerCase();
  if (!clean) return null;

  // Build lookup variations (e.g. 'student' and 'student@campus.edu')
  const variants = new Set([clean]);
  if (clean.includes('@')) {
    variants.add(clean.split('@')[0]);
  } else {
    variants.add(`${clean}@campus.edu`);
  }

  const orClauses = [];
  for (const v of variants) {
    orClauses.push(`username.ilike.${v}`);
    orClauses.push(`student_id.ilike.${v}`);
  }
  orClauses.push(`id.eq.${clean}`);

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(orClauses.join(','))
    .limit(1);

  if (error) {
    console.warn('Supabase getUser warning:', error.message);
    return null;
  }
  if (!data || data.length === 0) return null;

  const u = data[0];
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    studentId: u.student_id,
    phone: u.phone || '',
    avatarUrl: u.avatar_url || '',
    passwordHash: u.password_hash || '',
    createdAt: u.created_at
  };
}

async function createUser(userData) {
  const supabase = getSupabase();
  const id = userData.id || `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const username = String(userData.username).trim().toLowerCase();
  const name = String(userData.name || username).trim();
  const role = userData.role || 'student';
  const studentId = userData.studentId || userData.student_id || `STU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  const rawAvatar = userData.avatarUrl || userData.avatar_url || userData.profilePicture || userData.profilePictureUrl || userData.photoUrl || userData.avatar || '';

  const row = {
    id,
    username,
    name,
    role,
    student_id: studentId,
    phone: userData.phone || '',
    avatar_url: rawAvatar,
    password_hash: userData.passwordHash || '',
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('users').insert(row).select().single();
  if (error) throw error;

  return {
    id: data.id,
    username: data.username,
    name: data.name,
    role: data.role,
    studentId: data.student_id,
    phone: data.phone || '',
    avatarUrl: data.avatar_url || '',
    createdAt: data.created_at
  };
}

async function updateUser(usernameOrId, updates) {
  const supabase = getSupabase();
  let existing = await getUser(usernameOrId);
  if (!existing) {
    const cleanUser = String(usernameOrId).trim().toLowerCase();
    const role = cleanUser.includes('admin') ? 'admin' : (updates.role || 'student');
    const rawAvatar = updates.avatarUrl || updates.avatar_url || updates.profilePicture || updates.profilePictureUrl || updates.photoUrl || updates.avatar || '';
    const created = await createUser({
      username: cleanUser,
      name: updates.name || cleanUser,
      role: role,
      phone: updates.phone || '',
      avatarUrl: rawAvatar,
      passwordHash: updates.passwordHash || ''
    });
    return created;
  }

  const avatarCandidate = updates.avatarUrl !== undefined ? updates.avatarUrl : (updates.avatar_url !== undefined ? updates.avatar_url : (updates.profilePicture !== undefined ? updates.profilePicture : (updates.profilePictureUrl !== undefined ? updates.profilePictureUrl : (updates.photoUrl !== undefined ? updates.photoUrl : updates.avatar))));

  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.studentId !== undefined) dbUpdates.student_id = updates.studentId;
  if (updates.role && ['student', 'admin', 'supervisor', 'director'].includes(updates.role)) {
    dbUpdates.role = updates.role;
  }
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (avatarCandidate !== undefined) dbUpdates.avatar_url = String(avatarCandidate).trim();
  if (updates.passwordHash !== undefined) dbUpdates.password_hash = updates.passwordHash;

  const { data, error } = await supabase
    .from('users')
    .update(dbUpdates)
    .eq('id', existing.id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    username: data.username,
    name: data.name,
    role: data.role,
    studentId: data.student_id,
    phone: data.phone || '',
    avatarUrl: data.avatar_url || '',
    createdAt: data.created_at
  };
}

// ---------------------------------------------------------------------------
// 7. COMMUNITY ALERTS & SIGHTINGS ("I Saw Something")
// ---------------------------------------------------------------------------
const memoryAlerts = new Map();
const memorySightings = new Map();

function sanitizeSafeDescription(rawDescription, category, approximateArea) {
  // Strict privacy rule: Strip phone numbers, emails, serial numbers, names
  let safe = String(rawDescription || '')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
    .replace(/\+?\d[\d\s\-()]{7,}\d/g, '')
    .replace(/\b(SN|S\/N|Serial|IMEI|Passcode|Password|Pin)[:\s]+[A-Za-z0-9\-]+/gi, '')
    .trim();

  if (!safe || safe.length < 5) {
    return `Lost ${category || 'item'} reported near ${approximateArea || 'Campus'}. Have you seen something similar?`;
  }
  // Truncate to safe summary
  if (safe.length > 140) safe = safe.substring(0, 137) + '...';
  return safe;
}

function sanitizeApproximateArea(rawLocation) {
  if (!rawLocation) return 'Campus Grounds';
  // Strip room numbers, desk numbers, locker codes for safe public alert
  return String(rawLocation)
    .replace(/room\s*#?\s*\w+/gi, '')
    .replace(/desk\s*#?\s*\w+/gi, '')
    .replace(/locker\s*#?\s*\w+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim() || 'Campus Grounds';
}

async function createCommunityAlert(data) {
  const supabase = getSupabase();
  const id = data.id || `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const reportId = data.reportId || data.report_id;
  const category = data.category || 'General';
  const approximateArea = sanitizeApproximateArea(data.approximateArea || data.location);
  const safeDescription = sanitizeSafeDescription(data.safeDescription || data.description, category, approximateArea);
  const expiresHours = Number(data.expiresHours) || 72;
  const expiresAt = new Date(Date.now() + expiresHours * 3600 * 1000).toISOString();
  const reportedAt = data.reportedAt || new Date().toISOString();
  const status = data.status || 'ACTIVE';

  const row = {
    id,
    report_id: reportId,
    category,
    safe_description: safeDescription,
    approximate_area: approximateArea,
    reported_at: reportedAt,
    status,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  let savedAlert = null;
  try {
    const { data: inserted, error } = await supabase.from('community_alerts').insert(row).select().single();
    if (error) throw error;
    savedAlert = inserted;
  } catch (err) {
    // Graceful fallback if table is not yet in Supabase schema cache
    savedAlert = row;
    memoryAlerts.set(id, row);
  }

  // Notify eligible campus students using existing notifications system
  // Deduplicated notification: do not notify the reporter themselves, and prevent duplicate sends
  try {
    const reporterUser = data.reporterUser || data.reporter_id;
    const { data: users } = await supabase.from('users').select('id, username').limit(50);
    const eligibleStudents = (users || []).filter(u => u.username !== reporterUser && u.id !== reporterUser);

    for (const student of eligibleStudents) {
      const targetId = student.username || student.id;
      const notifId = `notif-alert-${id}-${targetId}`;
      const safeMsg = `📢 Campus Lost Alert: A ${category} was reported lost near ${approximateArea}. If you spotted something similar, tap "I Saw Something".`;
      
      try {
        await supabase.from('notifications').insert({
          id: notifId,
          user_id: targetId,
          message: safeMsg,
          type: 'alert',
          read: false,
          created_at: new Date().toISOString()
        });
      } catch (e) {}
    }
  } catch (notifErr) {
    console.warn('Community alert student notifications notice:', notifErr.message);
  }

  return {
    id: savedAlert.id,
    reportId: savedAlert.report_id,
    category: savedAlert.category,
    safeDescription: savedAlert.safe_description,
    approximateArea: savedAlert.approximate_area,
    reportedAt: savedAlert.reported_at,
    status: savedAlert.status,
    expiresAt: savedAlert.expires_at,
    createdAt: savedAlert.created_at
  };
}

async function getCommunityAlerts(filter = {}) {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  
  try {
    let query = supabase.from('community_alerts').select('*').order('created_at', { ascending: false }).limit(filter.limit || 50);
    if (filter.status) {
      query = query.eq('status', filter.status);
    }
    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(a => ({
      id: a.id,
      reportId: a.report_id,
      category: a.category,
      safeDescription: a.safe_description,
      approximateArea: a.approximate_area,
      reportedAt: a.reported_at,
      status: (a.expires_at && a.expires_at < now && a.status === 'ACTIVE') ? 'EXPIRED' : a.status,
      expiresAt: a.expires_at,
      createdAt: a.created_at
    }));
  } catch (err) {
    // Resilient fallback: derive safe community alerts from active LOST reports
    const { data: lostReports } = await supabase.from('reports').select('*').eq('type', 'LOST').eq('status', 'Active').order('created_at', { ascending: false }).limit(filter.limit || 50);

    const derived = (lostReports || []).map(r => {
      const area = sanitizeApproximateArea(r.location);
      const safeDesc = sanitizeSafeDescription(r.description, r.category, area);
      const reportedAt = r.created_at || new Date().toISOString();
      const expiresAt = new Date(new Date(reportedAt).getTime() + 72 * 3600 * 1000).toISOString();
      const isExpired = expiresAt < now;

      // Check if memory has a status update for this
      const mem = memoryAlerts.get(`alert-${r.id}`);
      const currentStatus = mem ? mem.status : (isExpired ? 'EXPIRED' : 'ACTIVE');

      return {
        id: `alert-${r.id}`,
        reportId: r.id,
        category: r.category || 'General',
        safeDescription: safeDesc,
        approximateArea: area,
        reportedAt,
        status: currentStatus,
        expiresAt,
        createdAt: r.created_at
      };
    });

    if (filter.status) {
      return derived.filter(a => a.status === filter.status);
    }
    return derived;
  }
}

async function closeCommunityAlertForReport(reportId, newStatus = 'CLOSED') {
  const supabase = getSupabase();
  try {
    await supabase.from('community_alerts').update({
      status: newStatus,
      updated_at: new Date().toISOString()
    }).eq('report_id', reportId);
  } catch (e) {
    // Memory fallback update
    for (const [id, alert] of memoryAlerts.entries()) {
      if (alert.report_id === reportId) {
        alert.status = newStatus;
        alert.updated_at = new Date().toISOString();
      }
    }
  }
}

async function createSighting(sightingData) {
  const supabase = getSupabase();
  const id = sightingData.id || `sight-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const alertId = sightingData.alertId || sightingData.alert_id;
  const reportId = sightingData.reportId || sightingData.report_id;
  const observerId = sightingData.observerId || sightingData.observer_id || 'anonymous_student';
  const observerName = sightingData.observerName || sightingData.observer_name || 'Campus Student';
  const approximateLocation = sightingData.approximateLocation || sightingData.approximate_location || 'Campus Area';
  const approximateTime = sightingData.approximateTime || sightingData.approximate_time || 'Recently';
  const observation = sightingData.observation || '';
  const photoUrl = sightingData.photoUrl || sightingData.photo_url || null;
  const pickedUp = !!sightingData.pickedUp;

  const row = {
    id,
    alert_id: alertId,
    report_id: reportId,
    observer_id: observerId,
    observer_name: observerName,
    approximate_location: approximateLocation,
    approximate_time: approximateTime,
    observation,
    photo_url: photoUrl,
    picked_up: pickedUp,
    created_at: new Date().toISOString()
  };

  let saved = null;
  try {
    const { data, error } = await supabase.from('sightings').insert(row).select().single();
    if (error) throw error;
    saved = data;
  } catch (err) {
    saved = row;
    if (!memorySightings.has(alertId)) memorySightings.set(alertId, []);
    memorySightings.get(alertId).push(row);
  }

  // Update alert status to SPOTTED if currently ACTIVE
  try {
    if (alertId) {
      await supabase.from('community_alerts').update({
        status: 'SPOTTED',
        updated_at: new Date().toISOString()
      }).eq('id', alertId).eq('status', 'ACTIVE');
    }
  } catch (e) {
    if (alertId && memoryAlerts.has(alertId)) {
      const a = memoryAlerts.get(alertId);
      if (a.status === 'ACTIVE') a.status = 'SPOTTED';
    }
  }

  // If a reportId is attached, notify the original lost reporter privately (DIRECT DELIVERY - NO ADMIN NOTIFIED)
  if (reportId) {
    try {
      const { data: rep } = await supabase.from('reports').select('reporter_id, title, category').eq('id', reportId).single();
      const targetOwnerId = rep ? rep.reporter_id : null;
      if (targetOwnerId && targetOwnerId !== 'anonymous' && targetOwnerId !== observerId) {
        const ownerUser = await getUser(targetOwnerId);
        const ownerNotifyIds = new Set([targetOwnerId]);
        if (ownerUser) {
          if (ownerUser.id) ownerNotifyIds.add(ownerUser.id);
          if (ownerUser.username) ownerNotifyIds.add(ownerUser.username);
        }

        for (const uid of ownerNotifyIds) {
          try {
            await supabase.from('notifications').insert({
              id: `notif-sighting-${id}-${uid}`,
              user_id: uid,
              message: `🔎 New Sighting: Someone reported seeing your lost "${rep.title || rep.category}" near ${approximateLocation} (${approximateTime}). Details: "${observation.slice(0, 120)}"`,
              type: 'sighting',
              read: false,
              created_at: new Date().toISOString()
            });
          } catch (singleErr) {
            console.warn('Single sighting notification insert notice:', singleErr.message);
          }
        }
      }
    } catch (notifErr) {
      console.warn('Sighting notification notice:', notifErr.message);
    }
  }

  return {
    id: saved.id,
    alertId: saved.alert_id,
    reportId: saved.report_id,
    approximateLocation: saved.approximate_location,
    approximateTime: saved.approximate_time,
    observation: saved.observation,
    photoUrl: saved.photo_url,
    pickedUp: !!saved.picked_up,
    createdAt: saved.created_at
  };
}

async function getSightings(alertId) {
  const supabase = getSupabase();
  try {
    const { data, error } = await supabase.from('sightings').select('*').eq('alert_id', alertId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(s => ({
      id: s.id,
      alertId: s.alert_id,
      reportId: s.report_id,
      approximateLocation: s.approximate_location,
      approximateTime: s.approximate_time,
      observation: s.observation,
      photoUrl: s.photo_url,
      pickedUp: !!s.picked_up,
      createdAt: s.created_at
    }));
  } catch (e) {
    return memorySightings.get(alertId) || [];
  }
}

async function getReportById(id) {
  const supabase = getSupabase();
  if (!supabase || !id) return null;
  const { data, error } = await supabase.from('reports').select('*').eq('id', id).single();
  if (error || !data) return null;
  return {
    ...data,
    type: data.type || (data.report_type === 'found' ? 'found' : 'lost'),
    title: data.title || data.item_name || 'Campus Item',
    category: data.category || 'General',
    location: data.location || data.campus_location || 'Campus',
    description: data.description || '',
    date: data.date || (data.created_at ? data.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
    status: data.status || 'open',
    reportedBy: data.reported_by || data.reportedby || 'Campus Member',
    userId: data.user_id || data.userId || null,
    userRole: data.user_role || data.userRole || 'student'
  };
}

async function getUserById(id) {
  return await getUser(id);
}

async function getAllUsers(callingUser) {
  const supabase = getSupabase();
  const isAdmin = callingUser && ['admin', 'supervisor', 'director'].includes(String(callingUser.role || '').toLowerCase());
  if (!isAdmin) {
    const err = new Error('Unauthorized: Only administrative staff can list campus users.');
    err.statusCode = 403;
    throw err;
  }
  const { data, error } = await supabase
    .from('users')
    .select('id, username, name, role, student_id, phone, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(u => {
    const meta = parseUserMetadata(u.phone);
    return {
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      studentId: u.student_id,
      phone: meta.phone,
      avatarUrl: meta.avatarUrl,
      createdAt: u.created_at
    };
  });
}

module.exports = {
  getSupabase,
  isConfigured,
  getSupabaseConfig,
  getReports,
  getReportById,
  createReport,
  updateReport,
  getClaims,
  createClaim,
  updateClaim,
  getMatches,
  createMatch,
  getHelpRequests,
  createHelpRequest,
  updateHelpRequest,
  getNotifications,
  createNotification,
  getUser,
  getUserById,
  getAllUsers,
  createUser,
  updateUser,
  createCommunityAlert,
  getCommunityAlerts,
  closeCommunityAlertForReport,
  createSighting,
  getSightings,
  deleteReport,
  clearNotifications,
  markAllNotificationsRead
};


