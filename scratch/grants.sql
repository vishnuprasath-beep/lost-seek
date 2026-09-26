-- ==============================================================================
-- 10. POSTGRESQL GRANTS (Defense in Depth)
-- Ensure strict privileges independent of RLS
-- ==============================================================================

-- Revoke all default privileges from public
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- SERVICE_ROLE: Full access
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ANON: Minimal access (Only read public data)
GRANT SELECT ON users TO anon;
GRANT SELECT ON reports TO anon;
GRANT SELECT ON community_alerts TO anon;
GRANT SELECT ON sightings TO anon;
-- (No access to claims, matches, help_requests, notifications for anon)

-- AUTHENTICATED: Standard app operations
GRANT SELECT, INSERT, UPDATE, DELETE ON reports TO authenticated;
GRANT SELECT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON claims TO authenticated;
GRANT SELECT ON matches TO authenticated;
GRANT SELECT, INSERT, UPDATE ON help_requests TO authenticated;
GRANT SELECT ON notifications TO authenticated;
GRANT SELECT ON community_alerts TO authenticated;
GRANT SELECT, INSERT ON sightings TO authenticated;

-- STORAGE POLICIES
-- In Supabase, storage policies are managed in the storage.objects table.
-- You must manually execute these in the SQL editor:
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'lostseek-images');
-- CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'lostseek-images');
