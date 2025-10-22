import { db } from '../db';
import { sql } from 'drizzle-orm';

async function viewErrorLogs() {
  try {
    // First check if the error_logs table exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'error_logs'
      );
    `);

    const tableExists = tableCheck.rows[0]?.exists;

    if (!tableExists) {
      console.log('\n⚠️  Error logs table does not exist yet.');
      console.log('💡 Run database migrations to create it: npm run db:push');
      return;
    }

    const logs = await db.execute(sql`
      SELECT id, level, message, stack, context, timestamp
      FROM error_logs
      ORDER BY timestamp DESC
      LIMIT 50
    `);

    console.log('\n📋 Recent Error Logs:\n');

    if (logs.rows.length === 0) {
      console.log('✅ No errors found!');
      return;
    }

    logs.rows.forEach((log: any, index: number) => {
      console.log(`\n${index + 1}. [${log.level.toUpperCase()}] ${new Date(log.timestamp).toLocaleString()}`);
      console.log(`   Message: ${log.message}`);
      if (log.context) {
        console.log(`   Context: ${JSON.stringify(log.context, null, 2)}`);
      }
      if (log.stack) {
        console.log(`   Stack: ${log.stack.substring(0, 200)}...`);
      }
      console.log('   ---');
    });
  } catch (error) {
    console.error('❌ Failed to fetch error logs:', error);
    console.log('\n💡 Try running: npm run db:push');
  } finally {
    process.exit(0);
  }
}

viewErrorLogs();