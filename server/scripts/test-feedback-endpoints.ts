
import { db } from '../db';
import { orderFeedback, issueReports, orders, clients } from '../../shared/schema';
import { eq } from 'drizzle-orm';

async function testFeedbackEndpoints() {

  try {
    // 1. Create test data
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


    // 2. Test admin response
    const [updatedFeedback] = await db
      .update(orderFeedback)
      .set({
        adminResponse: 'Thank you for your positive feedback! We appreciate your business.',
        adminResponseAt: new Date(),
        respondedBy: client.id,
      })
      .where(eq(orderFeedback.id, feedback.id))
      .returning();


    // 3. Test priority update
    
    const priorities = ['low', 'medium', 'high', 'critical'] as const;
    for (const priority of priorities) {
      const [updated] = await db
        .update(issueReports)
        .set({ priority })
        .where(eq(issueReports.id, issue.id))
        .returning();
      
    }

    // 4. Test querying with new fields
    
    const feedbackWithResponse = await db
      .select()
      .from(orderFeedback)
      .where(eq(orderFeedback.id, feedback.id))
      .limit(1);
    
    
    const criticalIssues = await db
      .select()
      .from(issueReports)
      .where(eq(issueReports.priority, 'critical'));
    

    // Cleanup
    await db.delete(orderFeedback).where(eq(orderFeedback.id, feedback.id));
    await db.delete(issueReports).where(eq(issueReports.id, issue.id));
    await db.delete(orders).where(eq(orders.id, order.id));
    await db.delete(clients).where(eq(clients.id, client.id));


  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testFeedbackEndpoints().then(() => {
  process.exit(0);
});
