-- ==============================================================================
-- LostSeek - Production Supabase PostgreSQL Database Schema
-- Run this in your Supabase SQL Editor (https://app.supabase.com/project/_/sql)
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'supervisor', 'director')),
    student_id TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2. REPORTS TABLE (Unified for LOST and FOUND)
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('LOST', 'FOUND', 'lost', 'found')),
    title TEXT NOT NULL,
    item_name TEXT,
    description TEXT,
    category TEXT NOT NULL,
    color TEXT,
    brand TEXT,
    distinguishing_features TEXT,
    location TEXT NOT NULL,
    custom_location TEXT,
    date_time TEXT,
    reporter_id TEXT NOT NULL,
    reporter_name TEXT NOT NULL,
    phone_number TEXT,
    phone_sharing_consent BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    ai_analysis JSONB DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Pending', 'Under Verification', 'Claim Approved', 'Verified', 'Returned', 'Recovered', 'Closed', 'Expired')),
    safety_flag BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Schema Migration for Existing Deployments:
ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT NULL;

-- 3. CLAIMS TABLE
CREATE TABLE IF NOT EXISTS claims (
    id TEXT PRIMARY KEY,
    lost_report_id TEXT REFERENCES reports(id) ON DELETE SET NULL,
    found_report_id TEXT REFERENCES reports(id) ON DELETE SET NULL,
    match_id TEXT,
    claimant_id TEXT NOT NULL,
    claimant_name TEXT NOT NULL,
    item_title TEXT NOT NULL,
    verification_evidence TEXT NOT NULL, -- Private evidence: requires verification
    claim_status TEXT NOT NULL DEFAULT 'Pending' CHECK (claim_status IN ('Pending', 'Under Verification', 'Approved', 'Rejected', 'Completed')),
    admin_notes TEXT,
    handover_location TEXT DEFAULT 'Campus Security Desk (Main Gate)',
    frozen BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 4. MATCHES TABLE
CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    lost_report_id TEXT REFERENCES reports(id) ON DELETE CASCADE,
    found_report_id TEXT REFERENCES reports(id) ON DELETE CASCADE,
    score NUMERIC NOT NULL,
    confidence TEXT NOT NULL,
    signals JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(lost_report_id, found_report_id)
);

-- 5. HELP REQUESTS TABLE (🆘 Need Help? & Complaints Desk)
CREATE TABLE IF NOT EXISTS help_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    reason TEXT NOT NULL CHECK (reason IN (
        'Unresponsive Finder/Claimant',
        'Suspicious Ownership Claim',
        'Harassment or Inappropriate Behavior',
        'Disputed Item Condition/Damage',
        'Wrong Item Handed Over',
        'Other Urgent Safety Concern'
    )),
    details TEXT NOT NULL,
    related_item_id TEXT,
    related_claim_id TEXT,
    is_urgent BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Review', 'Resolved', 'Dismissed')),
    admin_resolution TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 6. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 7. COMMUNITY ALERTS TABLE (Privacy-preserving safe broadcast for lost items)
CREATE TABLE IF NOT EXISTS community_alerts (
    id TEXT PRIMARY KEY,
    report_id TEXT REFERENCES reports(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    safe_description TEXT NOT NULL,
    approximate_area TEXT NOT NULL,
    reported_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SPOTTED', 'FOUND', 'CLOSED', 'EXPIRED')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 8. SIGHTINGS TABLE ("I Saw Something" community sightings)
CREATE TABLE IF NOT EXISTS sightings (
    id TEXT PRIMARY KEY,
    alert_id TEXT REFERENCES community_alerts(id) ON DELETE CASCADE,
    report_id TEXT REFERENCES reports(id) ON DELETE CASCADE,
    observer_id TEXT NOT NULL,
    observer_name TEXT,
    approximate_location TEXT NOT NULL,
    approximate_time TEXT NOT NULL,
    observation TEXT,
    photo_url TEXT,
    picked_up BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_claims_claimant ON claims(claimant_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(claim_status);
CREATE INDEX IF NOT EXISTS idx_matches_reports ON matches(lost_report_id, found_report_id);
CREATE INDEX IF NOT EXISTS idx_help_status ON help_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_community_alerts_status ON community_alerts(status);
CREATE INDEX IF NOT EXISTS idx_community_alerts_report ON community_alerts(report_id);
CREATE INDEX IF NOT EXISTS idx_sightings_alert ON sightings(alert_id);
CREATE INDEX IF NOT EXISTS idx_sightings_report ON sightings(report_id);

-- SEED INITIAL USERS
INSERT INTO users (id, username, name, role, student_id) VALUES
('usr-alex', 'student@campus.edu', 'Alex Rivera', 'student', 'STU-2026-8891'),
('usr-admin', 'admin@campus.edu', 'Vikram Singh', 'admin', 'ADM-FAC-4402'),
('usr-vishnu-p', 'vishnu.prasath', 'Vishnu Prasath', 'student', 'STU-2026-1011'),
('usr-vishnu-v', 'vishnu.varthan', 'Vishnu Varthan', 'student', 'STU-2026-1012'),
('usr-siva', 'sivavaiyapuri', 'Sivavaiyapuri', 'student', 'STU-2026-1013'),
('usr-boobathy', 'boobathy', 'Boobathy', 'student', 'STU-2026-1014'),
('usr-krish', 'krish', 'Krish', 'student', 'STU-2026-1015'),
('usr-girl1', 'girl1', 'Girl1', 'student', 'STU-2026-1016')
ON CONFLICT (username) DO NOTHING;

