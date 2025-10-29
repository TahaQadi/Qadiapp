#!/usr/bin/env tsx

import { db } from '../db.js';
import { 
  orders, 
  orderModifications, 
  orderHistory, 
  orderFeedback,
  documents, 
  documentAccessLogs,
  notifications
} from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

async function deleteOrderRelatedData() {
  console.log('🗑️  Comprehensive Order Data Cleanup...\n');
  
  try {
    // Count existing data
    console.log('📊 Analyzing database...\n');
    
    const existingOrders = await db.select().from(orders);
    const existingOrderModifications = await db.select().from(orderModifications);
    const existingOrderHistory = await db.select().from(orderHistory);
    const existingOrderFeedback = await db.select().from(orderFeedback);
    const orderDocuments = await db.select().from(documents).where(eq(documents.documentType, 'order'));
    
    console.log('Current Data Count:');
    console.log('─'.repeat(60));
    console.log(`  📦 Orders: ${existingOrders.length}`);
    console.log(`  ✏️  Order Modifications: ${existingOrderModifications.length}`);
    console.log(`  📜 Order History: ${existingOrderHistory.length}`);
    console.log(`  ⭐ Order Feedback: ${existingOrderFeedback.length}`);
    console.log(`  📄 Order Documents: ${orderDocuments.length}`);
    console.log('─'.repeat(60));
    
    const totalItems = existingOrders.length + existingOrderModifications.length + 
                      existingOrderHistory.length + existingOrderFeedback.length + 
                      orderDocuments.length;
    
    if (totalItems === 0) {
      console.log('\n✅ Database is already clean - no order-related data found!\n');
      process.exit(0);
    }
    
    console.log(`\n⚠️  Total items to delete: ${totalItems}\n`);
    
    // Step 1: Delete document access logs for order documents
    if (orderDocuments.length > 0) {
      console.log('🔹 Step 1: Deleting document access logs...');
      for (const doc of orderDocuments) {
        await db.delete(documentAccessLogs).where(eq(documentAccessLogs.documentId, doc.id));
      }
      console.log('   ✅ Document access logs deleted');
    }
    
    // Step 2: Delete order documents
    if (orderDocuments.length > 0) {
      console.log('🔹 Step 2: Deleting order documents...');
      await db.delete(documents).where(eq(documents.documentType, 'order'));
      console.log(`   ✅ ${orderDocuments.length} order documents deleted`);
    }
    
    // Step 3: Delete order feedback
    if (existingOrderFeedback.length > 0) {
      console.log('🔹 Step 3: Deleting order feedback...');
      await db.delete(orderFeedback);
      console.log(`   ✅ ${existingOrderFeedback.length} feedback entries deleted`);
    }
    
    // Step 4: Delete order history
    if (existingOrderHistory.length > 0) {
      console.log('🔹 Step 4: Deleting order history...');
      await db.delete(orderHistory);
      console.log(`   ✅ ${existingOrderHistory.length} history entries deleted`);
    }
    
    // Step 5: Delete order modifications
    if (existingOrderModifications.length > 0) {
      console.log('🔹 Step 5: Deleting order modifications...');
      await db.delete(orderModifications);
      console.log(`   ✅ ${existingOrderModifications.length} modifications deleted`);
    }
    
    // Step 6: Delete order-related notifications
    console.log('🔹 Step 6: Deleting order-related notifications...');
    const orderNotificationTypes = [
      'order_created',
      'order_status_changed',
      'order_modification_requested',
      'order_modification_reviewed'
    ];
    
    let notificationCount = 0;
    for (const notificationType of orderNotificationTypes) {
      const deleted = await db.delete(notifications)
        .where(eq(notifications.type, notificationType));
      // Note: delete() doesn't return count, so we'll just confirm
    }
    console.log('   ✅ Order notifications deleted');
    
    // Step 7: Delete orders (should be empty by now due to cascades)
    if (existingOrders.length > 0) {
      console.log('🔹 Step 7: Deleting orders...');
      await db.delete(orders);
      console.log(`   ✅ ${existingOrders.length} orders deleted`);
    }
    
    // Verify cleanup
    console.log('\n🔍 Verifying cleanup...\n');
    
    const remainingOrders = await db.select().from(orders);
    const remainingOrderMods = await db.select().from(orderModifications);
    const remainingOrderHistory = await db.select().from(orderHistory);
    const remainingOrderFeedback = await db.select().from(orderFeedback);
    const remainingOrderDocs = await db.select().from(documents).where(eq(documents.documentType, 'order'));
    
    console.log('Remaining Data:');
    console.log('─'.repeat(60));
    console.log(`  📦 Orders: ${remainingOrders.length}`);
    console.log(`  ✏️  Order Modifications: ${remainingOrderMods.length}`);
    console.log(`  📜 Order History: ${remainingOrderHistory.length}`);
    console.log(`  ⭐ Order Feedback: ${remainingOrderFeedback.length}`);
    console.log(`  📄 Order Documents: ${remainingOrderDocs.length}`);
    console.log('─'.repeat(60));
    
    const remainingTotal = remainingOrders.length + remainingOrderMods.length + 
                          remainingOrderHistory.length + remainingOrderFeedback.length + 
                          remainingOrderDocs.length;
    
    if (remainingTotal === 0) {
      console.log('\n✅ SUCCESS! All order-related data has been deleted!\n');
      console.log('📊 Summary:');
      console.log(`   • Deleted ${existingOrders.length} orders`);
      console.log(`   • Deleted ${existingOrderModifications.length} order modifications`);
      console.log(`   • Deleted ${existingOrderHistory.length} history entries`);
      console.log(`   • Deleted ${existingOrderFeedback.length} feedback entries`);
      console.log(`   • Deleted ${orderDocuments.length} documents`);
      console.log(`   • Cleaned up order notifications`);
      console.log(`\n   Total items deleted: ${totalItems}\n`);
    } else {
      console.log(`\n⚠️  Warning: ${remainingTotal} items still remain.\n`);
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

deleteOrderRelatedData();

