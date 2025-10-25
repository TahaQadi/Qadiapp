import { documentTriggerService } from './document-triggers';

async function testDocumentTriggers() {
  console.log('🧪 Testing Document Triggers...\n');

  // Test 1: Order Placed Event
  console.log('📦 Testing Order Placed Event...');
  try {
    await documentTriggerService.queueEvent({
      type: 'order_placed',
      data: {
        id: 'test-order-123',
        clientId: 'test-client-456',
        items: JSON.stringify([
          { productId: 'prod-1', nameEn: 'Test Product', quantity: 2, price: '100.00' }
        ]),
        totalAmount: '200.00',
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      clientId: 'test-client-456',
      timestamp: new Date()
    });
    console.log('✅ Order placed event queued successfully');
  } catch (error) {
    console.error('❌ Order placed event failed:', error);
  }

  // Test 2: Order Status Changed Event
  console.log('\n📦 Testing Order Status Changed Event...');
  try {
    await documentTriggerService.queueEvent({
      type: 'order_status_changed',
      data: {
        order: {
          id: 'test-order-123',
          clientId: 'test-client-456',
          status: 'confirmed',
          totalAmount: '200.00',
          createdAt: new Date().toISOString()
        },
        oldStatus: 'pending',
        newStatus: 'confirmed'
      },
      clientId: 'test-client-456',
      timestamp: new Date()
    });
    console.log('✅ Order status changed event queued successfully');
  } catch (error) {
    console.error('❌ Order status changed event failed:', error);
  }

  // Test 3: Price Offer Created Event
  console.log('\n💰 Testing Price Offer Created Event...');
  try {
    await documentTriggerService.queueEvent({
      type: 'price_offer_created',
      data: {
        id: 'test-offer-789',
        clientId: 'test-client-456',
        offerNumber: 'PO-12345',
        items: JSON.stringify([
          { productId: 'prod-1', nameEn: 'Test Product', quantity: 2, price: '100.00' }
        ]),
        total: '200.00',
        status: 'draft',
        createdAt: new Date().toISOString()
      },
      clientId: 'test-client-456',
      timestamp: new Date()
    });
    console.log('✅ Price offer created event queued successfully');
  } catch (error) {
    console.error('❌ Price offer created event failed:', error);
  }

  // Test 4: LTA Contract Signed Event
  console.log('\n📋 Testing LTA Contract Signed Event...');
  try {
    await documentTriggerService.queueEvent({
      type: 'lta_contract_signed',
      data: {
        id: 'test-lta-101',
        clientId: 'test-client-456',
        nameEn: 'Test LTA Contract',
        nameAr: 'عقد اتفاقية طويلة الأجل للاختبار',
        createdAt: new Date().toISOString()
      },
      clientId: 'test-client-456',
      timestamp: new Date()
    });
    console.log('✅ LTA contract signed event queued successfully');
  } catch (error) {
    console.error('❌ LTA contract signed event failed:', error);
  }

  // Wait a moment for processing
  console.log('\n⏳ Waiting for event processing...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Check queue status
  const status = documentTriggerService.getQueueStatus();
  console.log(`\n📊 Queue Status: ${status.queueLength} events in queue, processing: ${status.isProcessing}`);

  console.log('\n✅ Document trigger testing completed!');
}

// Run the test
testDocumentTriggers().catch(console.error);