/**
 * Test API Endpoints After Migration
 * 
 * Tests that API endpoints work correctly with single fields
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';
import { storage } from '../storage';

async function testAPIEndpoints() {
  console.log('Testing API endpoint functionality...\n');

  try {
    // Test 1: Create a test client
    console.log('1. Testing client creation...');
    try {
      const testClient = await storage.createClient({
        username: 'test_migration_' + Date.now(),
        password: 'test123456',
        name: 'Test Migration Client',
        email: 'testmigration@example.com',
        phone: '+1234567890',
        isAdmin: false,
      });
      console.log(`   ✓ Client created: ${testClient.name} (ID: ${testClient.id})`);
      
      // Test reading it back
      const retrievedClient = await storage.getClient(testClient.id);
      if (retrievedClient && retrievedClient.name === testClient.name) {
        console.log(`   ✓ Client retrieval works: ${retrievedClient.name}`);
      } else {
        console.log(`   ✗ Client retrieval failed`);
      }
      
      // Clean up
      await storage.deleteClient(testClient.id);
      console.log(`   ✓ Test client cleaned up`);
    } catch (error: any) {
      console.log(`   ✗ Client creation failed: ${error.message}`);
    }

    // Test 2: Create a test product
    console.log('\n2. Testing product creation...');
    try {
      const testProduct = await storage.createProduct({
        sku: 'TEST-MIG-' + Date.now(),
        name: 'Test Migration Product',
        description: 'Test product for migration verification',
        category: 'test',
        unitType: 'piece',
        unit: 'pcs',
        sellingPricePiece: '10.00',
      });
      console.log(`   ✓ Product created: ${testProduct.name} (SKU: ${testProduct.sku})`);
      
      // Test reading it back
      const retrievedProduct = await storage.getProduct(testProduct.id);
      if (retrievedProduct && retrievedProduct.name === testProduct.name) {
        console.log(`   ✓ Product retrieval works: ${retrievedProduct.name}`);
      } else {
        console.log(`   ✗ Product retrieval failed`);
      }
      
      // Clean up
      await storage.deleteProduct(testProduct.id);
      console.log(`   ✓ Test product cleaned up`);
    } catch (error: any) {
      console.log(`   ✗ Product creation failed: ${error.message}`);
    }

    // Test 3: Create a test vendor
    console.log('\n3. Testing vendor creation...');
    try {
      const testVendor = await storage.createVendor({
        vendorNumber: 'V-TEST-' + Date.now(),
        name: 'Test Migration Vendor',
        contactEmail: 'vendor@test.com',
        contactPhone: '+9876543210',
      });
      console.log(`   ✓ Vendor created: ${testVendor.name} (Number: ${testVendor.vendorNumber})`);
      
      // Test reading it back
      const retrievedVendor = await storage.getVendor(testVendor.id);
      if (retrievedVendor && retrievedVendor.name === testVendor.name) {
        console.log(`   ✓ Vendor retrieval works: ${retrievedVendor.name}`);
      } else {
        console.log(`   ✗ Vendor retrieval failed`);
      }
      
      // Clean up
      await storage.deleteVendor(testVendor.id);
      console.log(`   ✓ Test vendor cleaned up`);
    } catch (error: any) {
      console.log(`   ✗ Vendor creation failed: ${error.message}`);
    }

    // Test 4: Create a test LTA
    console.log('\n4. Testing LTA creation...');
    try {
      const testLta = await storage.createLta({
        name: 'Test Migration LTA',
        description: 'Test LTA for migration verification',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'active',
      });
      console.log(`   ✓ LTA created: ${testLta.name} (ID: ${testLta.id})`);
      
      // Test reading it back
      const retrievedLta = await storage.getLta(testLta.id);
      if (retrievedLta && retrievedLta.name === testLta.name) {
        console.log(`   ✓ LTA retrieval works: ${retrievedLta.name}`);
      } else {
        console.log(`   ✗ LTA retrieval failed`);
      }
      
      // Clean up
      await storage.deleteLta(testLta.id);
      console.log(`   ✓ Test LTA cleaned up`);
    } catch (error: any) {
      console.log(`   ✗ LTA creation failed: ${error.message}`);
    }

    // Test 5: Create a test notification
    console.log('\n5. Testing notification creation...');
    try {
      // Get a client for notification
      const clients = await storage.getClients();
      if (clients.length > 0) {
        const testNotification = await storage.createNotification({
          clientId: clients[0].id,
          type: 'system',
          title: 'Test Migration Notification',
          message: 'This is a test notification to verify migration',
        });
        console.log(`   ✓ Notification created: ${testNotification.title}`);
        
        // Test reading it back
        const retrievedNotification = await storage.getNotification(testNotification.id);
        if (retrievedNotification && retrievedNotification.title === testNotification.title) {
          console.log(`   ✓ Notification retrieval works: ${retrievedNotification.title}`);
        } else {
          console.log(`   ✗ Notification retrieval failed`);
        }
        
        // Clean up
        await storage.deleteNotification(testNotification.id);
        console.log(`   ✓ Test notification cleaned up`);
      } else {
        console.log(`   ⚠ No clients found, skipping notification test`);
      }
    } catch (error: any) {
      console.log(`   ✗ Notification creation failed: ${error.message}`);
    }

    console.log('\n✅ All API endpoint tests completed!\n');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Run test if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAPIEndpoints()
    .then(() => {
      console.log('API test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { testAPIEndpoints };

