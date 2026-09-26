-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on all tables
-- ==============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sightings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin/staff
CREATE OR REPLACE FUNCTION is_staff() RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'supervisor', 'director');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get legacy user ID from Supabase Auth JWT
CREATE OR REPLACE FUNCTION get_legacy_id() RETURNS TEXT AS $$
BEGIN
  RETURN (auth.jwt() -> 'user_metadata' ->> 'legacy_id');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- Users Table Policies
-- ------------------------------------------------------------------------------
-- Anyone can read basic user info (needed for directory/display)
CREATE POLICY "Public profiles are viewable by everyone." ON users FOR SELECT USING (true);
-- Users can update their own row (or staff can)
CREATE POLICY "Users can update own profile." ON users FOR UPDATE USING (id = get_legacy_id() OR is_staff());
-- Only staff can insert/delete users directly
CREATE POLICY "Staff can manage users." ON users FOR ALL USING (is_staff());

-- ------------------------------------------------------------------------------
-- Reports Table Policies
-- ------------------------------------------------------------------------------
-- Reports are public to view
CREATE POLICY "Reports are viewable by everyone." ON reports FOR SELECT USING (true);
-- Users can insert their own reports
CREATE POLICY "Users can create reports." ON reports FOR INSERT WITH CHECK (reporter_id = get_legacy_id() OR is_staff());
-- Users can update/delete their own reports
CREATE POLICY "Users can update own reports." ON reports FOR UPDATE USING (reporter_id = get_legacy_id() OR is_staff());
CREATE POLICY "Users can delete own reports." ON reports FOR DELETE USING (reporter_id = get_legacy_id() OR is_staff());

-- ------------------------------------------------------------------------------
-- Claims Table Policies
-- ------------------------------------------------------------------------------
-- Claimants and Staff can view claims
CREATE POLICY "Claimants and staff can view claims." ON claims FOR SELECT USING (claimant_id = get_legacy_id() OR is_staff());
-- Users can create claims
CREATE POLICY "Users can create claims." ON claims FOR INSERT WITH CHECK (claimant_id = get_legacy_id() OR is_staff());
-- Only staff can update/delete claims
CREATE POLICY "Only staff can update claims." ON claims FOR UPDATE USING (is_staff());
CREATE POLICY "Only staff can delete claims." ON claims FOR DELETE USING (is_staff());

-- ------------------------------------------------------------------------------
-- Matches Table Policies
-- ------------------------------------------------------------------------------
-- Matches are viewable by the reporters of the lost/found items or staff
CREATE POLICY "Matches viewable by involved parties or staff." ON matches FOR SELECT USING (
  EXISTS (SELECT 1 FROM reports WHERE reports.id = lost_report_id AND reports.reporter_id = get_legacy_id()) OR
  EXISTS (SELECT 1 FROM reports WHERE reports.id = found_report_id AND reports.reporter_id = get_legacy_id()) OR
  is_staff()
);
CREATE POLICY "Staff can manage matches." ON matches FOR ALL USING (is_staff());

-- ------------------------------------------------------------------------------
-- Help Requests & Notifications
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view own help requests." ON help_requests FOR SELECT USING (user_id = get_legacy_id() OR is_staff());
CREATE POLICY "Users can create help requests." ON help_requests FOR INSERT WITH CHECK (user_id = get_legacy_id() OR is_staff());
CREATE POLICY "Staff can update help requests." ON help_requests FOR UPDATE USING (is_staff());

CREATE POLICY "Users can view own notifications." ON notifications FOR SELECT USING (user_id = get_legacy_id() OR is_staff());
CREATE POLICY "System/Staff can manage notifications." ON notifications FOR ALL USING (is_staff());

-- ------------------------------------------------------------------------------
-- Community Alerts & Sightings
-- ------------------------------------------------------------------------------
CREATE POLICY "Alerts are viewable by everyone." ON community_alerts FOR SELECT USING (true);
CREATE POLICY "Staff can manage alerts." ON community_alerts FOR ALL USING (is_staff());

CREATE POLICY "Sightings are viewable by everyone." ON sightings FOR SELECT USING (true);
CREATE POLICY "Users can create sightings." ON sightings FOR INSERT WITH CHECK (observer_id = get_legacy_id() OR is_staff());
CREATE POLICY "Staff can manage sightings." ON sightings FOR ALL USING (is_staff());
