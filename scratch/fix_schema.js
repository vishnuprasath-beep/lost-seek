const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'supabase_schema.sql');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/private\.private\./g, 'private.');
content = content.replace(/\$ LANGUAGE plpgsql/g, '$$$$ LANGUAGE plpgsql');
content = content.replace(/RETURNS BOOLEAN AS \$/g, 'RETURNS BOOLEAN AS $$$$');
content = content.replace(/RETURNS TEXT AS \$/g, 'RETURNS TEXT AS $$$$');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed double private and dollar signs');
