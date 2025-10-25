
import { db } from '../db';
import { orders, priceOffers, priceRequests, orderHistory, orderModifications, orderFeedback } from '../../shared/schema';

async function clearOrdersAndPrices() {
  console.log('🗑️  Clearing orders, price offers, and price requests...\n');

  try {
    // Clear order-related tables first (due to foreign key constraints)
    console.log('Clearing order history...');
    const deletedHistory = await db.delete(orderHistory).execute();
    console.log(`✅ Cleared ${deletedHistory.rowCount || 0} order history records`);

    console.log('Clearing order modifications...');
    const deletedModifications = await db.delete(orderModifications).execute();
    console.log(`✅ Cleared ${deletedModifications.rowCount || 0} order modifications`);

    console.log('Clearing order feedback...');
    const deletedFeedback = await db.delete(orderFeedback).execute();
    console.log(`✅ Cleared ${deletedFeedback.rowCount || 0} order feedback records`);

    console.log('Clearing orders...');
    const deletedOrders = await db.delete(orders).execute();
    console.log(`✅ Cleared ${deletedOrders.rowCount || 0} orders`);

    // Clear price offers
    console.log('Clearing price offers...');
    const deletedOffers = await db.delete(priceOffers).execute();
    console.log(`✅ Cleared ${deletedOffers.rowCount || 0} price offers`);

    // Clear price requests
    console.log('Clearing price requests...');
    const deletedRequests = await db.delete(priceRequests).execute();
    console.log(`✅ Cleared ${deletedRequests.rowCount || 0} price requests`);

    console.log('\n✅ All orders, price offers, and price requests have been cleared!');
    console.log('💡 Note: Clients, products, and LTAs remain unchanged.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    process.exit(1);
  }
}

clearOrdersAndPrices();
