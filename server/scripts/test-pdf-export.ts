#!/usr/bin/env tsx

import { db } from '../db.js';
import { orders, clients, ltas } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { DocumentUtils } from '../document-utils.js';

async function testPdfExport() {
  console.log('🧪 Testing PDF Export...\n');
  
  try {
    // Get the order
    const orderList = await db.select().from(orders);
    
    if (orderList.length === 0) {
      console.log('❌ No orders found in database');
      process.exit(1);
    }
    
    const order = orderList[0];
    console.log(`📦 Testing with order: ${order.id.slice(0, 8)}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Total: ${order.totalAmount}`);
    
    // Get items
    const items = JSON.parse(order.items);
    console.log(`   Items: ${items.length}\n`);
    
    // Get client
    const client = order.clientId ? await db.select().from(clients).where(eq(clients.id, order.clientId)).then(r => r[0]) : null;
    console.log(`👤 Client: ${client?.nameAr || 'N/A'}\n`);
    
    // Get LTA
    const lta = order.ltaId ? await db.select().from(ltas).where(eq(ltas.id, order.ltaId)).then(r => r[0]) : null;
    console.log(`📋 LTA: ${lta?.nameAr || 'N/A'}\n`);
    
    // Calculate total
    const itemsTotal = items.reduce((sum: number, item: any) => sum + (item.quantity * parseFloat(item.price)), 0);
    
    console.log('🔧 Generating PDF with variables:');
    console.log('─'.repeat(60));
    
    const variables = [
      { key: 'orderId', value: order.id },
      { key: 'orderDate', value: new Date(order.createdAt).toLocaleDateString('ar-SA') },
      { key: 'clientName', value: client?.nameAr || client?.nameEn || 'عميل' },
      { key: 'deliveryAddress', value: client?.address || 'لم يحدد' },
      { key: 'clientPhone', value: client?.phone || '' },
      { key: 'paymentMethod', value: 'تحويل بنكي' },
      { key: 'reference', value: lta?.referenceNumber || '' },
      { key: 'items', value: items },
      { key: 'totalAmount', value: itemsTotal.toFixed(2) },
      { key: 'deliveryDays', value: '5-7' }
    ];
    
    variables.forEach(v => {
      if (v.key !== 'items') {
        console.log(`  ${v.key}: ${v.value}`);
      } else {
        console.log(`  ${v.key}: ${items.length} items`);
      }
    });
    
    console.log('─'.repeat(60));
    console.log('\n📄 Calling DocumentUtils.generateDocument...\n');
    
    // Generate PDF
    const documentResult = await DocumentUtils.generateDocument({
      templateCategory: 'order',
      variables,
      clientId: client?.id,
      metadata: { orderId: order.id }
    });
    
    if (!documentResult.success) {
      console.log(`\n❌ PDF Generation Failed!`);
      console.log(`   Error: ${documentResult.error}\n`);
      process.exit(1);
    }
    
    console.log(`\n✅ PDF Generated Successfully!`);
    console.log(`   Document ID: ${documentResult.documentId}`);
    console.log(`   File Name: ${documentResult.fileName}\n`);
    
  } catch (error) {
    console.error('\n❌ Error during test:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
  
  process.exit(0);
}

testPdfExport();

