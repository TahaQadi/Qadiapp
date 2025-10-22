
import { db } from '../db';
import { orderFeedback, issueReports, orders, clients } from '../../shared/schema';
import { eq } from 'drizzle-orm';

async function testFeedbackEndpoints() {
  console.log('🧪 Testing Feedback Split Features...\n');

  try {
    // 1. Create test data
    console.log('1️⃣ Creating test data...');
    const [client] = await db.insert(clients).values({
      nameEn: 'Test Client',
      nameAr: 'عميل تجريبي',
      username: 'test_feedback_' + Date.now(),
      password: 'test123',
      isAdmin: false,
    }).returning();

    const [order] = await db.insert(orders).values({
      clientId: client.id,
      items: JSON.stringify([]),
      totalAmount: '100.00',
      status: 'delivered',
    }).returning();

    const [feedback] = await db.insert(orderFeedback).values({
      orderId: order.id,
      clientId: client.id,
      rating: 5,
      wouldRecommend: true,
      comments: 'Excellent service!',
    }).returning();

    const [issue] = await db.insert(issueReports).values({
      userId: client.id,
      userType: 'client',
      issueType: 'bug',
      severity: 'medium',
      title: 'Test Bug Report',
      description: 'This is a test bug report',
      browserInfo: 'Chrome 120',
      screenSize: '1920x1080',
      status: 'open',
    }).returning();

    console.log('✅ Test data created');
    console.log(`   - Client ID: ${client.id}`);
    console.log(`   - Order ID: ${order.id}`);
    console.log(`   - Feedback ID: ${feedback.id}`);
    console.log(`   - Issue ID: ${issue.id}\n`);

    // 2. Test admin response
    console.log('2️⃣ Testing admin response to feedback...');
    const [updatedFeedback] = await db
      .update(orderFeedback)
      .set({
        adminResponse: 'Thank you for your positive feedback! We appreciate your business.',
        adminResponseAt: new Date(),
        respondedBy: client.id,
      })
      .where(eq(orderFeedback.id, feedback.id))
      .returning();

    console.log('✅ Admin response added');
    console.log(`   - Response: ${updatedFeedback.adminResponse}`);
    console.log(`   - Responded at: ${updatedFeedback.adminResponseAt}\n`);

    // 3. Test priority update
    console.log('3️⃣ Testing issue priority updates...');
    
    const priorities = ['low', 'medium', 'high', 'critical'] as const;
    for (const priority of priorities) {
      const [updated] = await db
        .update(issueReports)
        .set({ priority })
        .where(eq(issueReports.id, issue.id))
        .returning();
      
      console.log(`   ✓ Updated priority to: ${updated.priority}`);
    }
    console.log('✅ All priority levels tested\n');

    // 4. Test querying with new fields
    console.log('4️⃣ Testing queries with new fields...');
    
    const feedbackWithResponse = await db
      .select()
      .from(orderFeedback)
      .where(eq(orderFeedback.id, feedback.id))
      .limit(1);
    
    console.log('✅ Feedback query successful');
    console.log(`   - Has admin response: ${!!feedbackWithResponse[0].adminResponse}`);
    
    const criticalIssues = await db
      .select()
      .from(issueReports)
      .where(eq(issueReports.priority, 'critical'));
    
    console.log(`✅ Priority query successful`);
    console.log(`   - Critical issues found: ${criticalIssues.length}\n`);

    // Cleanup
    console.log('5️⃣ Cleaning up test data...');
    await db.delete(orderFeedback).where(eq(orderFeedback.id, feedback.id));
    await db.delete(issueReports).where(eq(issueReports.id, issue.id));
    await db.delete(orders).where(eq(orders.id, order.id));
    await db.delete(clients).where(eq(clients.id, client.id));
    console.log('✅ Cleanup complete\n');

    console.log('🎉 All tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testFeedbackEndpoints().then(() => {
  console.log('\n✨ Testing complete');
  process.exit(0);
});
