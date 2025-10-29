#!/usr/bin/env tsx

import { db } from '../db.js';
import { orders } from '../../shared/schema.js';

async function checkOrders() {
  try {
    const result = await db.select().from(orders);
    console.log(`📊 Orders in database: ${result.length}`);
    
    if (result.length > 0) {
      console.log('\nRecent orders:');
      result.slice(0, 3).forEach((order: any) => {
        console.log(`  • ${order.id.slice(0, 8)} - ${order.status} - ${order.totalAmount}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkOrders();

