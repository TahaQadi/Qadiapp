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
      return;
    }

    const logs = await db.execute(sql`
      SELECT id, level, message, stack, context, timestamp
      FROM error_logs
      ORDER BY timestamp DESC
      LIMIT 50
    `);


    if (logs.rows.length === 0) {
      return;
    }

    logs.rows.forEach((log: any, index: number) => {
      console.log(`\n--- Error Log #${index + 1} ---`);
      console.log(`Level: ${log.level}`);
      console.log(`Message: ${log.message}`);
      console.log(`Timestamp: ${log.timestamp}`);
      
      if (log.context) {
        console.log('\nContext:', JSON.stringify(log.context, null, 2));
      }
      if (log.stack) {
        console.log('\nStack Trace:', log.stack);
      }
      console.log('---\n');
    });
  } catch (error) {
    console.error('❌ Failed to fetch error logs:', error);
  } finally {
    process.exit(0);
  }
}

viewErrorLogs();