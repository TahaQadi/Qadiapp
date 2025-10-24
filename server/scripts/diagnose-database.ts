
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function diagnoseDatabase() {

  try {
    // 1. Test connection
    const connectionTest = await db.execute(sql`SELECT 1 as test`);

    // 2. Check PostgreSQL version
    const versionResult = await db.execute(sql`SELECT version()`);

    // 3. List all tables
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    tablesResult.rows.forEach((row: any) => {
    });

    // 4. Check table row counts
    const tables = ['clients', 'products', 'orders', 'ltas', 'notifications', 'users'];
    for (const table of tables) {
      try {
        const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${table}`));
      } catch (error) {
      }
    }

    // 5. Check for missing migrations
    const migrationCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'error_logs'
      ) as error_logs_exists,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'order_history'
      ) as order_history_exists,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'order_feedback'
      ) as order_feedback_exists
    `);
    const migrationStatus = migrationCheck.rows[0];

    // 6. Check database size
    const sizeResult = await db.execute(sql`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);

    // 7. Check for connection pool info
    const connectionsResult = await db.execute(sql`
      SELECT count(*) as active_connections 
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `);


    // Recommendations
    if (!migrationStatus.error_logs_exists || !migrationStatus.order_history_exists || !migrationStatus.order_feedback_exists) {
    } else {
    }

  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error);
  } finally {
    process.exit(0);
  }
}

diagnoseDatabase();
