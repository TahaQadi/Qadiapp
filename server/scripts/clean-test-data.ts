#!/usr/bin/env tsx

import { db } from '../db.js';
import { 
  clients,
  ltas,
  ltaClients,
  ltaProducts,
  orders,
  orderModifications,
  orderHistory,
  orderFeedback,
  priceOffers,
  priceRequests,
  documents,
  documentAccessLogs,
  notifications,
  companyUsers,
  clientDepartments,
  clientLocations,
  orderTemplates,
  clientPricing,
  pushSubscriptions,
  passwordResetTokens,
} from '../../shared/schema.js';
import { eq, and, ne, inArray, or } from 'drizzle-orm';
import { hashPassword } from '../auth.js';

const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

async function cleanTestData() {
  console.log('🧹 Cleaning test data...\n');
  console.log('='.repeat(60));
  console.log('This will:');
  console.log('  • Delete all LTAs');
  console.log('  • Delete all clients except admin@admin.com');
  console.log('  • Delete all orders');
  console.log('  • Delete all price offers');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Step 1: Find or create admin account
    console.log('📋 Step 1: Checking admin account...');
    const existingClients = await db.select().from(clients);
    const adminClient = existingClients.find(c => c.email === ADMIN_EMAIL || c.username === ADMIN_USERNAME);
    
    let adminClientId: string;
    
    if (adminClient) {
      console.log(`   ✅ Found admin account: ${adminClient.email || adminClient.username}`);
      adminClientId = adminClient.id;
      
      // Update to ensure correct email, username, and admin status
      const needsUpdate = adminClient.email !== ADMIN_EMAIL || adminClient.username !== ADMIN_USERNAME || !adminClient.isAdmin;
      if (needsUpdate) {
        console.log('   ⚠️  Updating admin account to admin@admin.com...');
        await db.update(clients)
          .set({ 
            email: ADMIN_EMAIL,
            username: ADMIN_USERNAME,
            isAdmin: true 
          })
          .where(eq(clients.id, adminClientId));
        console.log('   ✅ Admin account updated');
      }
    } else {
      console.log(`   ⚠️  Admin account not found, creating admin@admin.com...`);
      const hashedPassword = await hashPassword(ADMIN_PASSWORD);
      const [newAdmin] = await db.insert(clients).values({
        username: ADMIN_USERNAME,
        password: hashedPassword,
        name: 'Administrator',
        email: ADMIN_EMAIL,
        phone: '+1111111111',
        isAdmin: true,
      }).returning();
      
      adminClientId = newAdmin.id;
      console.log(`   ✅ Created admin account: ${newAdmin.email || newAdmin.username}`);
    }
    
    console.log('');

    // Step 2: Delete all orders and related data first (since they reference LTAs)
    console.log('🗑️  Step 2: Deleting all orders...');
    const existingOrders = await db.select().from(orders);
    console.log(`   📊 Found ${existingOrders.length} orders`);
    
    if (existingOrders.length > 0) {
      // Delete order-related documents
      const orderDocs = await db.select().from(documents).where(eq(documents.documentType, 'order'));
      if (orderDocs.length > 0) {
        console.log(`   🔹 Deleting ${orderDocs.length} order documents...`);
        for (const doc of orderDocs) {
          await db.delete(documentAccessLogs).where(eq(documentAccessLogs.documentId, doc.id));
        }
        await db.delete(documents).where(eq(documents.documentType, 'order'));
        console.log('   ✅ Order documents deleted');
      }
      
      // Delete order feedback
      const existingOrderFeedback = await db.select().from(orderFeedback);
      if (existingOrderFeedback.length > 0) {
        console.log(`   🔹 Deleting ${existingOrderFeedback.length} order feedback entries...`);
        await db.delete(orderFeedback);
        console.log('   ✅ Order feedback deleted');
      }
      
      // Delete order history
      const existingOrderHistory = await db.select().from(orderHistory);
      if (existingOrderHistory.length > 0) {
        console.log(`   🔹 Deleting ${existingOrderHistory.length} order history entries...`);
        await db.delete(orderHistory);
        console.log('   ✅ Order history deleted');
      }
      
      // Delete order modifications
      const existingOrderModifications = await db.select().from(orderModifications);
      if (existingOrderModifications.length > 0) {
        console.log(`   🔹 Deleting ${existingOrderModifications.length} order modifications...`);
        await db.delete(orderModifications);
        console.log('   ✅ Order modifications deleted');
      }
      
      // Delete orders
      await db.delete(orders);
      console.log(`   ✅ Deleted ${existingOrders.length} orders`);
    } else {
      console.log('   ℹ️  No orders found');
    }
    console.log('');

    // Step 3: Delete all price offers and related data
    console.log('🗑️  Step 3: Deleting all price offers...');
    const existingPriceOffers = await db.select().from(priceOffers);
    console.log(`   📊 Found ${existingPriceOffers.length} price offers`);
    
    if (existingPriceOffers.length > 0) {
      // Delete documents related to price offers
      const priceOfferDocs = await db.select().from(documents).where(eq(documents.documentType, 'price_offer'));
      if (priceOfferDocs.length > 0) {
        console.log(`   🔹 Deleting ${priceOfferDocs.length} price offer documents...`);
        for (const doc of priceOfferDocs) {
          await db.delete(documentAccessLogs).where(eq(documentAccessLogs.documentId, doc.id));
        }
        await db.delete(documents).where(eq(documents.documentType, 'price_offer'));
        console.log('   ✅ Price offer documents deleted');
      }
      
      // Delete price offers
      await db.delete(priceOffers);
      console.log(`   ✅ Deleted ${existingPriceOffers.length} price offers`);
    } else {
      console.log('   ℹ️  No price offers found');
    }
    console.log('');

    // Step 4: Delete all price requests
    console.log('🗑️  Step 4: Deleting all price requests...');
    const existingPriceRequests = await db.select().from(priceRequests);
    console.log(`   📊 Found ${existingPriceRequests.length} price requests`);
    
    if (existingPriceRequests.length > 0) {
      await db.delete(priceRequests);
      console.log(`   ✅ Deleted ${existingPriceRequests.length} price requests`);
    } else {
      console.log('   ℹ️  No price requests found');
    }
    console.log('');

    // Step 5: Delete all LTAs (must delete relationships first)
    console.log('🗑️  Step 5: Deleting all LTAs...');
    const existingLtas = await db.select().from(ltas);
    console.log(`   📊 Found ${existingLtas.length} LTAs`);
    
    if (existingLtas.length > 0) {
      // Delete LTA relationships first
      const existingLtaClients = await db.select().from(ltaClients);
      const existingLtaProducts = await db.select().from(ltaProducts);
      
      if (existingLtaClients.length > 0) {
        console.log(`   🔹 Deleting ${existingLtaClients.length} LTA client relationships...`);
        await db.delete(ltaClients);
        console.log('   ✅ LTA client relationships deleted');
      }
      
      if (existingLtaProducts.length > 0) {
        console.log(`   🔹 Deleting ${existingLtaProducts.length} LTA product relationships...`);
        await db.delete(ltaProducts);
        console.log('   ✅ LTA product relationships deleted');
      }
      
      // Now delete LTAs
      await db.delete(ltas);
      console.log(`   ✅ Deleted ${existingLtas.length} LTAs`);
    } else {
      console.log('   ℹ️  No LTAs found');
    }
    console.log('');

    // Step 6: Delete all clients except admin
    console.log('🗑️  Step 6: Deleting all clients except admin...');
    const clientsToDelete = existingClients.filter(c => c.id !== adminClientId);
    console.log(`   📊 Found ${clientsToDelete.length} clients to delete`);
    
    if (clientsToDelete.length > 0) {
      const clientIdsToDelete = clientsToDelete.map(c => c.id);
      
      // Delete related data first
      console.log('   🔹 Deleting related data...');
      
      // Delete company users
      const companyUsersToDelete = await db.select().from(companyUsers)
        .where(inArray(companyUsers.companyId, clientIdsToDelete));
      if (companyUsersToDelete.length > 0) {
        await db.delete(companyUsers).where(inArray(companyUsers.companyId, clientIdsToDelete));
        console.log(`      ✅ Deleted ${companyUsersToDelete.length} company users`);
      }
      
      // Delete client departments
      const departmentsToDelete = await db.select().from(clientDepartments)
        .where(inArray(clientDepartments.clientId, clientIdsToDelete));
      if (departmentsToDelete.length > 0) {
        await db.delete(clientDepartments).where(inArray(clientDepartments.clientId, clientIdsToDelete));
        console.log(`      ✅ Deleted ${departmentsToDelete.length} client departments`);
      }
      
      // Delete client locations
      const locationsToDelete = await db.select().from(clientLocations)
        .where(inArray(clientLocations.clientId, clientIdsToDelete));
      if (locationsToDelete.length > 0) {
        await db.delete(clientLocations).where(inArray(clientLocations.clientId, clientIdsToDelete));
        console.log(`      ✅ Deleted ${locationsToDelete.length} client locations`);
      }
      
      // Delete order templates
      const templatesToDelete = await db.select().from(orderTemplates)
        .where(inArray(orderTemplates.clientId, clientIdsToDelete));
      if (templatesToDelete.length > 0) {
        await db.delete(orderTemplates).where(inArray(orderTemplates.clientId, clientIdsToDelete));
        console.log(`      ✅ Deleted ${templatesToDelete.length} order templates`);
      }
      
      // Delete client pricing
      const pricingToDelete = await db.select().from(clientPricing)
        .where(inArray(clientPricing.clientId, clientIdsToDelete));
      if (pricingToDelete.length > 0) {
        await db.delete(clientPricing).where(inArray(clientPricing.clientId, clientIdsToDelete));
        console.log(`      ✅ Deleted ${pricingToDelete.length} client pricing entries`);
      }
      
      // Delete push subscriptions
      const subscriptionsToDelete = await db.select().from(pushSubscriptions)
        .where(inArray(pushSubscriptions.userId, clientIdsToDelete));
      if (subscriptionsToDelete.length > 0) {
        await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.userId, clientIdsToDelete));
        console.log(`      ✅ Deleted ${subscriptionsToDelete.length} push subscriptions`);
      }
      
      // Delete password reset tokens
      const tokensToDelete = await db.select().from(passwordResetTokens);
      if (tokensToDelete.length > 0) {
        await db.delete(passwordResetTokens);
        console.log(`      ✅ Deleted ${tokensToDelete.length} password reset tokens`);
      }
      
      // Delete notifications
      const notificationsToDelete = await db.select().from(notifications)
        .where(inArray(notifications.clientId, clientIdsToDelete));
      if (notificationsToDelete.length > 0) {
        await db.delete(notifications).where(inArray(notifications.clientId, clientIdsToDelete));
        console.log(`      ✅ Deleted ${notificationsToDelete.length} notifications`);
      }
      
      // Delete clients
      await db.delete(clients).where(ne(clients.id, adminClientId));
      console.log(`   ✅ Deleted ${clientsToDelete.length} clients`);
    } else {
      console.log('   ℹ️  No clients to delete');
    }
    console.log('');

    // Final verification
    console.log('🔍 Verifying cleanup...\n');
    console.log('─'.repeat(60));
    
    const remainingLtas = await db.select().from(ltas);
    const remainingClients = await db.select().from(clients);
    const remainingOrders = await db.select().from(orders);
    const remainingPriceOffers = await db.select().from(priceOffers);
    const remainingPriceRequests = await db.select().from(priceRequests);
    
    console.log('Remaining Data:');
    console.log(`  📋 LTAs: ${remainingLtas.length}`);
    console.log(`  👥 Clients: ${remainingClients.length} (should be 1)`);
    console.log(`  📦 Orders: ${remainingOrders.length}`);
    console.log(`  💰 Price Offers: ${remainingPriceOffers.length}`);
    console.log(`  📝 Price Requests: ${remainingPriceRequests.length}`);
    console.log('─'.repeat(60));
    
    if (remainingClients.length === 1 && remainingClients[0].id === adminClientId) {
      console.log('\n✅ SUCCESS! Test data cleaned successfully!\n');
      console.log('📊 Summary:');
      console.log(`   • Deleted ${existingLtas.length} LTAs`);
      console.log(`   • Deleted ${clientsToDelete.length} clients`);
      console.log(`   • Deleted ${existingOrders.length} orders`);
      console.log(`   • Deleted ${existingPriceOffers.length} price offers`);
      console.log(`   • Deleted ${existingPriceRequests.length} price requests`);
      console.log(`   • Kept admin account: ${remainingClients[0].email || remainingClients[0].username}`);
      console.log('');
    } else {
      console.log(`\n⚠️  Warning: Expected 1 client (admin), found ${remainingClients.length}`);
      if (remainingClients.length > 0) {
        remainingClients.forEach(c => {
          console.log(`   • ${c.email || c.username} (${c.isAdmin ? 'admin' : 'client'})`);
        });
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
  
  process.exit(0);
}

cleanTestData();

