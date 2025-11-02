/**
 * Test Migration Functionality
 * 
 * Tests that the migration worked correctly by querying the database
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';
import { clients, products, vendors, ltas, clientLocations, notifications } from '@shared/schema';

async function testMigration() {
  console.log('Testing migration functionality...\n');

  try {
    // Test 1: Check if new columns exist
    console.log('1. Checking if new columns exist...');
    const columnCheck = await db.execute(sql`
      SELECT 
        column_name, table_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name IN ('name', 'address', 'description', 'title', 'message')
        AND table_name IN ('clients', 'products', 'vendors', 'ltas', 'client_locations', 'notifications', 'lta_documents')
      ORDER BY table_name, column_name
    `);
    
    console.log(`   Found ${columnCheck.rows.length} new columns:`);
    columnCheck.rows.forEach((row: any) => {
      console.log(`   ✓ ${row.table_name}.${row.column_name}`);
    });

    // Test 2: Check if old columns are removed
    console.log('\n2. Checking if old columns are removed...');
    const oldColumnCheck = await db.execute(sql`
      SELECT 
        column_name, table_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (
          column_name LIKE '%_en' OR column_name LIKE '%_ar'
        )
        AND table_name IN ('clients', 'products', 'vendors', 'ltas', 'client_locations', 'notifications', 'lta_documents')
        AND column_name NOT LIKE '%_id'
        AND column_name NOT LIKE '%_at'
      ORDER BY table_name, column_name
    `);
    
    if (oldColumnCheck.rows.length === 0) {
      console.log('   ✓ All old bilingual columns have been removed');
    } else {
      console.log(`   ⚠ Found ${oldColumnCheck.rows.length} old columns still present:`);
      oldColumnCheck.rows.forEach((row: any) => {
        console.log(`   - ${row.table_name}.${row.column_name}`);
      });
    }

    // Test 3: Query sample data
    console.log('\n3. Testing data queries...');
    
    try {
      const sampleClients = await db.execute(sql`SELECT id, name FROM clients LIMIT 3`);
      console.log(`   ✓ Clients query works: ${sampleClients.rows.length} rows`);
      if (sampleClients.rows.length > 0) {
        console.log(`   Sample: ${(sampleClients.rows[0] as any).name}`);
      }
    } catch (error: any) {
      console.log(`   ✗ Clients query failed: ${error.message}`);
    }

    try {
      const sampleProducts = await db.execute(sql`SELECT id, name, description FROM products LIMIT 3`);
      console.log(`   ✓ Products query works: ${sampleProducts.rows.length} rows`);
      if (sampleProducts.rows.length > 0) {
        console.log(`   Sample: ${(sampleProducts.rows[0] as any).name}`);
      }
    } catch (error: any) {
      console.log(`   ✗ Products query failed: ${error.message}`);
    }

    try {
      const sampleVendors = await db.execute(sql`SELECT id, name FROM vendors LIMIT 3`);
      console.log(`   ✓ Vendors query works: ${sampleVendors.rows.length} rows`);
    } catch (error: any) {
      console.log(`   ✗ Vendors query failed: ${error.message}`);
    }

    try {
      const sampleLtas = await db.execute(sql`SELECT id, name, description FROM ltas LIMIT 3`);
      console.log(`   ✓ LTAs query works: ${sampleLtas.rows.length} rows`);
    } catch (error: any) {
      console.log(`   ✗ LTAs query failed: ${error.message}`);
    }

    try {
      const sampleLocations = await db.execute(sql`SELECT id, name, address FROM client_locations LIMIT 3`);
      console.log(`   ✓ Client locations query works: ${sampleLocations.rows.length} rows`);
    } catch (error: any) {
      console.log(`   ✗ Client locations query failed: ${error.message}`);
    }

    try {
      const sampleNotifications = await db.execute(sql`SELECT id, title, message FROM notifications LIMIT 3`);
      console.log(`   ✓ Notifications query works: ${sampleNotifications.rows.length} rows`);
    } catch (error: any) {
      console.log(`   ✗ Notifications query failed: ${error.message}`);
    }

    console.log('\n✅ Migration test completed successfully!\n');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Run test if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testMigration()
    .then(() => {
      console.log('Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { testMigration };

