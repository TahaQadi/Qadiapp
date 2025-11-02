/**
 * Migration Script: Merge Bilingual Fields to Single Entry
 * 
 * This script migrates existing bilingual data (nameEn/nameAr, addressEn/addressAr, etc.)
 * to single entry fields, preferring Arabic values and falling back to English.
 * 
 * Run this script BEFORE applying the database migration:
 * tsx server/scripts/migrate-bilingual-fields.ts
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';

async function migrateBilingualFields() {
  console.log('Starting bilingual fields migration...\n');

  try {
    // Check if old columns exist before migrating
    const checkColumn = async (table: string, column: string): Promise<boolean> => {
      try {
        const result = await db.execute(sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = ${table} AND column_name = ${column}
        `);
        return result.rows.length > 0;
      } catch {
        return false;
      }
    };

    // ============================================
    // CLIENTS TABLE
    // ============================================
    const clientsHasOldColumns = await checkColumn('clients', 'name_ar');
    if (clientsHasOldColumns) {
      console.log('Migrating clients table...');
      await db.execute(sql`
        UPDATE clients 
        SET name = COALESCE(NULLIF(TRIM(name_ar), ''), NULLIF(TRIM(name_en), ''), 'Unnamed')
        WHERE name IS NULL OR name = ''
      `);
      console.log('✓ Clients migrated\n');
    } else {
      console.log('⚠ Clients table already migrated (name_ar column not found)\n');
    }

    // ============================================
    // COMPANY_USERS TABLE
    // ============================================
    const companyUsersHasOldColumns = await checkColumn('company_users', 'name_ar');
    if (companyUsersHasOldColumns) {
      console.log('Migrating company_users table...');
      await db.execute(sql`
        UPDATE company_users 
        SET name = COALESCE(NULLIF(TRIM(name_ar), ''), NULLIF(TRIM(name_en), ''), 'Unnamed')
        WHERE name IS NULL OR name = ''
      `);
      console.log('✓ Company users migrated\n');
    } else {
      console.log('⚠ Company users table already migrated (name_ar column not found)\n');
    }

    // ============================================
    // CLIENT_LOCATIONS TABLE
    // ============================================
    const locationsHasOldColumns = await checkColumn('client_locations', 'name_ar');
    if (locationsHasOldColumns) {
      console.log('Migrating client_locations table...');
      await db.execute(sql`
        UPDATE client_locations 
        SET 
          name = COALESCE(NULLIF(TRIM(name_ar), ''), NULLIF(TRIM(name_en), ''), 'Unnamed'),
          address = COALESCE(NULLIF(TRIM(address_ar), ''), NULLIF(TRIM(address_en), ''), 'No address')
        WHERE name IS NULL OR name = '' OR address IS NULL OR address = ''
      `);
      console.log('✓ Client locations migrated\n');
    } else {
      console.log('⚠ Client locations table already migrated (name_ar column not found)\n');
    }

    // ============================================
    // VENDORS TABLE
    // ============================================
    const vendorsHasOldColumns = await checkColumn('vendors', 'name_ar');
    if (vendorsHasOldColumns) {
      console.log('Migrating vendors table...');
      await db.execute(sql`
        UPDATE vendors 
        SET name = COALESCE(NULLIF(TRIM(name_ar), ''), NULLIF(TRIM(name_en), ''), 'Unnamed')
        WHERE name IS NULL OR name = ''
      `);
      console.log('✓ Vendors migrated\n');
    } else {
      console.log('⚠ Vendors table already migrated (name_ar column not found)\n');
    }

    // ============================================
    // PRODUCTS TABLE
    // ============================================
    const productsHasOldColumns = await checkColumn('products', 'name_ar');
    if (productsHasOldColumns) {
      console.log('Migrating products table...');
      await db.execute(sql`
        UPDATE products 
        SET 
          name = COALESCE(NULLIF(TRIM(name_ar), ''), NULLIF(TRIM(name_en), ''), 'Unnamed'),
          description = COALESCE(NULLIF(TRIM(description_ar), ''), NULLIF(TRIM(description_en), ''), NULL)
        WHERE name IS NULL OR name = ''
      `);
      console.log('✓ Products migrated\n');
    } else {
      console.log('⚠ Products table already migrated (name_ar column not found)\n');
    }

    // ============================================
    // LTAS TABLE
    // ============================================
    const ltasHasOldColumns = await checkColumn('ltas', 'name_ar');
    if (ltasHasOldColumns) {
      console.log('Migrating ltas table...');
      await db.execute(sql`
        UPDATE ltas 
        SET 
          name = COALESCE(NULLIF(TRIM(name_ar), ''), NULLIF(TRIM(name_en), ''), 'Unnamed'),
          description = COALESCE(NULLIF(TRIM(description_ar), ''), NULLIF(TRIM(description_en), ''), NULL)
        WHERE name IS NULL OR name = ''
      `);
      console.log('✓ LTAs migrated\n');
    } else {
      console.log('⚠ LTAs table already migrated (name_ar column not found)\n');
    }

    console.log('✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run the SQL migration: migrations/0015_merge_bilingual_fields.sql');
    console.log('2. Or use drizzle-kit push to apply schema changes');
    console.log('3. Update all code references to use new field names');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateBilingualFields()
    .then(() => {
      console.log('\nMigration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { migrateBilingualFields };

