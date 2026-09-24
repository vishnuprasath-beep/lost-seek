const fs = require('fs');

const schema = fs.readFileSync('supabase_schema.sql', 'utf8');
const dbJs = fs.readFileSync('api/db.js', 'utf8');

console.log('--- SUPABASE SCHEMA ROLES ---');
const schemaRoleMatch = schema.match(/CHECK \(role IN \(([^)]+)\)\)/g);
console.log('Schema checks:', schemaRoleMatch);

console.log('\n--- API/DB.JS ROLE CHECKS ---');
const dbLines = dbJs.split('\n');
dbLines.forEach((l, idx) => {
  if (l.includes('supervisor') || l.includes('director') || l.includes('role')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
