
import { db } from '../db';
import { errorLogs } from '../../shared/schema';
import { desc } from 'drizzle-orm';

async function viewErrorLogs() {
  try {
    console.log('📋 Fetching recent error logs from database...\n');
    
    const logs = await db
      .select()
      .from(errorLogs)
      .orderBy(desc(errorLogs.timestamp))
      .limit(50);

    if (logs.length === 0) {
      console.log('✅ No errors found! Your application is running smoothly.\n');
      return;
    }

    console.log(`Found ${logs.length} error(s):\n`);
    console.log('─'.repeat(80));

    logs.forEach((log, index) => {
      const timestamp = new Date(log.timestamp).toLocaleString();
      const severity = log.severity.toUpperCase();
      const severityEmoji = severity === 'ERROR' ? '🔴' : severity === 'WARNING' ? '🟡' : '🔵';
      
      console.log(`\n${severityEmoji} Error #${index + 1} [${severity}]`);
      console.log(`⏰ Time: ${timestamp}`);
      console.log(`📝 Message: ${log.message}`);
      
      if (log.stack) {
        console.log(`📚 Stack trace:\n${log.stack.split('\n').slice(0, 5).join('\n')}`);
      }
      
      if (log.context) {
        console.log(`🔍 Context: ${JSON.stringify(log.context, null, 2)}`);
      }
      
      if (log.userId) {
        console.log(`👤 User ID: ${log.userId}`);
      }
      
      console.log('─'.repeat(80));
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Total errors: ${logs.length}`);
    
    const errorCount = logs.filter(l => l.severity === 'error').length;
    const warningCount = logs.filter(l => l.severity === 'warning').length;
    const infoCount = logs.filter(l => l.severity === 'info').length;
    
    if (errorCount > 0) console.log(`   🔴 Errors: ${errorCount}`);
    if (warningCount > 0) console.log(`   🟡 Warnings: ${warningCount}`);
    if (infoCount > 0) console.log(`   🔵 Info: ${infoCount}`);
    
    console.log('\n💡 Tip: Review recent errors to identify patterns and fix issues.\n');
    
  } catch (error) {
    console.error('❌ Failed to fetch error logs:', error);
    process.exit(1);
  }
}

viewErrorLogs();
