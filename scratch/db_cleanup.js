require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function cleanupDb() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!url || !key || url.includes('your-project')) {
    console.log("No valid Supabase config found. Skipping DB cleanup.");
    return;
  }
  
  const supabase = createClient(url, key);
  
  // 1. Fetch reports that look like tests
  const { data: reports, error } = await supabase.from('reports').select('*');
  
  if (error) {
    console.error("Error fetching reports:", error.message);
    return;
  }
  
  if (reports) {
    let deletedCount = 0;
    for (const report of reports) {
      const isTest = (report.title && (report.title.toLowerCase().includes('test') || report.title.toLowerCase().includes('demo'))) ||
                     (report.description && (report.description.toLowerCase().includes('test') || report.description.toLowerCase().includes('demo'))) ||
                     (report.id && report.id.includes('demo'));
                     
      if (isTest) {
        console.log(`Deleting test report: ${report.id} - ${report.title}`);
        await supabase.from('reports').delete().eq('id', report.id);
        deletedCount++;
        
        // Also delete associated matches/claims
        await supabase.from('claims').delete().or(`lost_report_id.eq.${report.id},found_report_id.eq.${report.id}`);
        await supabase.from('matches').delete().or(`lost_report_id.eq.${report.id},found_report_id.eq.${report.id}`);
      }
    }
    console.log(`Deleted ${deletedCount} test reports from DB.`);
  }
}

cleanupDb().catch(console.error);
