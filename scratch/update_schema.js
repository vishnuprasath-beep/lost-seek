const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'supabase_schema.sql');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the functions
content = content.replace(
  /CREATE OR REPLACE FUNCTION is_staff\(\).*?\$\$ LANGUAGE plpgsql SECURITY DEFINER;/s,
  `CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_staff() RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'supervisor', 'director');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';`
);

content = content.replace(
  /CREATE OR REPLACE FUNCTION get_legacy_id\(\).*?\$\$ LANGUAGE plpgsql SECURITY DEFINER;/s,
  `CREATE OR REPLACE FUNCTION private.get_legacy_id() RETURNS TEXT AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'legacy_id');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Grant execution rights so policies can evaluate these
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_staff() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.get_legacy_id() TO anon, authenticated, service_role;`
);

// Replace get_legacy_id() and is_staff() in policies
content = content.replace(/get_legacy_id\(\)/g, 'private.get_legacy_id()');
content = content.replace(/is_staff\(\)/g, 'private.is_staff()');

// Replace ON public_tables with ON public.table
const tables = ['users', 'reports', 'claims', 'matches', 'help_requests', 'notifications', 'community_alerts', 'sightings'];
for (const table of tables) {
  const regex = new RegExp(`ON ${table} FOR`, 'g');
  content = content.replace(regex, `ON public.${table} FOR`);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated supabase_schema.sql');
