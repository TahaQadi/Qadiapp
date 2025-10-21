
import { errorLogger } from '../error-logger';

async function viewErrorLogs() {
  try {
    console.log('📋 Fetching recent error logs from database...\n');
    
    const logs = await errorLogger.getRecentErrors(50);
    const stats = await errorLogger.getErrorStats();

    if (logs.length === 0) {
      console.log('✅ No errors found! Your application is running smoothly.\n');
      return;
    }

    console.log(`Found ${logs.length} error(s):\n`);
    console.log('─'.repeat(80));

    logs.forEach((log, index) => {
      const timestamp = new Date(log.timestamp).toLocaleString();
      const severity = log.level.toUpperCase();
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
      
      console.log('─'.repeat(80));
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Total errors: ${stats.total}`);
    
    if (stats.byLevel.error > 0) console.log(`   🔴 Errors: ${stats.byLevel.error}`);
    if (stats.byLevel.warning > 0) console.log(`   🟡 Warnings: ${stats.byLevel.warning}`);
    if (stats.byLevel.info > 0) console.log(`   🔵 Info: ${stats.byLevel.info}`);
    console.log(`   📅 Last 24h: ${stats.recentCount24h}`);
    
    console.log('\n💡 Tip: Review recent errors to identify patterns and fix issues.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to fetch error logs:', error);
    console.error('\n💡 Make sure your DATABASE_URL is set and the error_logs table exists.');
    console.error('   Run "DB - Migrate" workflow first if needed.\n');
    process.exit(1);
  }
}

viewErrorLogs();
