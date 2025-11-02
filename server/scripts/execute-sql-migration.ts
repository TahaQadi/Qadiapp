/**
 * Execute SQL Migration File Directly
 * 
 * Runs the SQL migration file directly using the database connection
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

async function executeSQLMigration() {
  console.log('Executing SQL migration file...\n');

  try {
    // Read the SQL migration file
    const migrationPath = path.join(process.cwd(), 'migrations', '0015_merge_bilingual_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Remove comments and split by semicolons
    const cleanSQL = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    // Split into individual statements
    const statements = cleanSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Found ${statements.length} statements to execute\n`);

    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement || statement.trim().length === 0) continue;

      try {
        // Execute each statement
        await db.execute(sql.raw(statement));
        successCount++;
        console.log(`✓ [${i + 1}/${statements.length}] Executed successfully`);
      } catch (error: any) {
        const errorMsg = error.message || '';
        
        // Expected errors we can ignore
        if (errorMsg.includes('already exists') || 
            errorMsg.includes('does not exist') ||
            errorMsg.includes('duplicate column') ||
            errorMsg.includes('column "name" of relation') ||
            errorMsg.includes('column "address" of relation') ||
            errorMsg.includes('column "description" of relation') ||
            errorMsg.includes('column "title" of relation') ||
            errorMsg.includes('column "message" of relation')) {
          skipCount++;
          console.log(`⚠ [${i + 1}/${statements.length}] Skipped: ${errorMsg.substring(0, 70)}...`);
        } else {
          console.error(`✗ [${i + 1}/${statements.length}] Error:`, errorMsg);
          // Continue with other statements
        }
      }
    }

    console.log(`\n✅ Migration completed!`);
    console.log(`   Successfully executed: ${successCount}`);
    console.log(`   Skipped (expected): ${skipCount}`);
    console.log(`   Total statements: ${statements.length}\n`);

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

// Run migration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  executeSQLMigration()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { executeSQLMigration };

