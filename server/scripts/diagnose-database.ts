
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function diagnoseDatabase() {
  console.log('🔍 Database Diagnostic Report\n');
  console.log('=================================\n');

  try {
    // 1. Test connection
    console.log('1️⃣  Testing database connection...');
    const connectionTest = await db.execute(sql`SELECT 1 as test`);
    console.log('   ✅ Connection successful\n');

    // 2. Check PostgreSQL version
    console.log('2️⃣  Checking PostgreSQL version...');
    const versionResult = await db.execute(sql`SELECT version()`);
    console.log(`   Version: ${versionResult.rows[0].version}\n`);

    // 3. List all tables
    console.log('3️⃣  Listing all tables...');
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log(`   Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach((row: any) => {
      console.log(`   - ${row.table_name}`);
    });
    console.log('');

    // 4. Check table row counts
    console.log('4️⃣  Checking table row counts...');
    const tables = ['clients', 'products', 'orders', 'ltas', 'notifications', 'users'];
    for (const table of tables) {
      try {
        const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${table}`));
        console.log(`   ${table}: ${countResult.rows[0].count} rows`);
      } catch (error) {
        console.log(`   ${table}: ❌ Table not found or error`);
      }
    }
    console.log('');

    // 5. Check for missing migrations
    console.log('5️⃣  Checking migration status...');
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
    console.log(`   error_logs table: ${migrationStatus.error_logs_exists ? '✅' : '❌'}`);
    console.log(`   order_history table: ${migrationStatus.order_history_exists ? '✅' : '❌'}`);
    console.log(`   order_feedback table: ${migrationStatus.order_feedback_exists ? '✅' : '❌'}`);
    console.log('');

    // 6. Check database size
    console.log('6️⃣  Checking database size...');
    const sizeResult = await db.execute(sql`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);
    console.log(`   Database size: ${sizeResult.rows[0].size}\n`);

    // 7. Check for connection pool info
    console.log('7️⃣  Checking active connections...');
    const connectionsResult = await db.execute(sql`
      SELECT count(*) as active_connections 
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `);
    console.log(`   Active connections: ${connectionsResult.rows[0].active_connections}\n`);

    console.log('=================================');
    console.log('✅ Diagnostic complete!\n');

    // Recommendations
    console.log('📋 Recommendations:');
    if (!migrationStatus.error_logs_exists || !migrationStatus.order_history_exists || !migrationStatus.order_feedback_exists) {
      console.log('   ⚠️  Some tables are missing. Run: npm run db:push');
    } else {
      console.log('   ✅ All expected tables are present');
    }

  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Check if DATABASE_URL environment variable is set');
    console.log('   2. Verify database is accessible');
    console.log('   3. Run migrations: npm run db:push');
  } finally {
    process.exit(0);
  }
}

diagnoseDatabase();
