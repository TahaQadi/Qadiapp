#!/usr/bin/env tsx

import { db } from '../db.js';
import { orders } from '../../shared/schema.js';

async function deleteAllOrders() {
  console.log('🗑️  Deleting all orders...\n');
  
  try {
    // Get count before deletion
    const existingOrders = await db.select().from(orders);
    const count = existingOrders.length;
    
    if (count === 0) {
      console.log('ℹ️  No orders found in database.');
      process.exit(0);
    }
    
    console.log(`📊 Found ${count} orders in database`);
    console.log('─'.repeat(60));
    
    // Show first few orders
    existingOrders.slice(0, 5).forEach((order: any) => {
      console.log(`  • Order ${order.id.slice(0, 8)} - ${order.status} - ${order.totalAmount}`);
    });
    
    if (count > 5) {
      console.log(`  ... and ${count - 5} more orders`);
    }
    
    console.log('─'.repeat(60));
    console.log('\n⚠️  Deleting all orders...\n');
    
    // Delete all orders
    await db.delete(orders);
    
    // Verify deletion
    const remaining = await db.select().from(orders);
    
    if (remaining.length === 0) {
      console.log(`✅ Successfully deleted ${count} orders!`);
      console.log('✅ Orders table is now empty.\n');
    } else {
      console.log(`⚠️  Warning: ${remaining.length} orders still remain.`);
    }
    
  } catch (error) {
    console.error('❌ Error deleting orders:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

deleteAllOrders();

