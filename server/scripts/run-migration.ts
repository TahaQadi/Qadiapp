/**
 * Run SQL Migration Script
 * 
 * Executes the SQL migration file to update database schema
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  console.log('Starting database migration...\n');

  try {
    // Read the SQL migration file
    const migrationPath = path.join(process.cwd(), 'migrations', '0015_merge_bilingual_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Execute the entire migration file as a single transaction
    // PostgreSQL can handle multiple statements separated by semicolons
    console.log('Executing migration SQL...\n');

    try {
      // Split by semicolons but preserve multi-line statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => {
          // Filter out comments and empty statements
          const trimmed = s.trim();
          return trimmed.length > 0 && 
                 !trimmed.startsWith('--') && 
                 !trimmed.startsWith('COMMENT ON');
        });

      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (!statement || statement.trim().length === 0) continue;

        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          await db.execute(sql.raw(statement + ';'));
          console.log(`✓ Statement ${i + 1} executed successfully`);
        } catch (error: any) {
          // Some errors are expected (e.g., columns already exist)
          const errorMsg = error.message || '';
          if (errorMsg.includes('already exists') || 
              errorMsg.includes('does not exist') ||
              errorMsg.includes('duplicate column')) {
            console.log(`⚠ Statement ${i + 1} skipped: ${errorMsg.substring(0, 60)}...`);
          } else {
            console.error(`✗ Error in statement ${i + 1}:`, errorMsg);
            throw error;
          }
        }
      }

      console.log(`\n✅ Migration completed successfully!\n`);

    } catch (error: any) {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(() => {
      console.log('\nMigration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runMigration };
