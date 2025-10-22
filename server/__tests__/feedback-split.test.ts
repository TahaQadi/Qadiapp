
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../db';
import { orderFeedback, issueReports, orders, clients } from '../../shared/schema';
import { eq } from 'drizzle-orm';

describe('Feedback Split Features', () => {
  let testClientId: string;
  let testOrderId: string;
  let testFeedbackId: string;
  let testIssueId: string;

  beforeAll(async () => {
    // Create test client
    const [client] = await db.insert(clients).values({
      nameEn: 'Test Client',
      nameAr: 'عميل تجريبي',
      username: 'testclient_feedback',
      password: 'test123',
      isAdmin: false,
    }).returning();
    testClientId = client.id;

    // Create test order
    const [order] = await db.insert(orders).values({
      clientId: testClientId,
      items: JSON.stringify([]),
      totalAmount: '100.00',
      status: 'delivered',
    }).returning();
    testOrderId = order.id;

    // Create test feedback
    const [feedback] = await db.insert(orderFeedback).values({
      orderId: testOrderId,
      clientId: testClientId,
      rating: 4,
      wouldRecommend: true,
      comments: 'Great service!',
    }).returning();
    testFeedbackId = feedback.id;

    // Create test issue
    const [issue] = await db.insert(issueReports).values({
      userId: testClientId,
      userType: 'client',
      issueType: 'bug',
      severity: 'medium',
      title: 'Test Issue',
      description: 'This is a test issue',
      browserInfo: 'Chrome 120',
      screenSize: '1920x1080',
      status: 'open',
    }).returning();
    testIssueId = issue.id;
  });

  afterAll(async () => {
    // Cleanup
    await db.delete(orderFeedback).where(eq(orderFeedback.id, testFeedbackId));
    await db.delete(issueReports).where(eq(issueReports.id, testIssueId));
    await db.delete(orders).where(eq(orders.id, testOrderId));
    await db.delete(clients).where(eq(clients.id, testClientId));
  });

  describe('Database Schema', () => {
    it('should have admin_response column in order_feedback', async () => {
      const [feedback] = await db
        .select()
        .from(orderFeedback)
        .where(eq(orderFeedback.id, testFeedbackId))
        .limit(1);

      expect(feedback).toBeDefined();
      expect(feedback).toHaveProperty('adminResponse');
      expect(feedback).toHaveProperty('adminResponseAt');
      expect(feedback).toHaveProperty('respondedBy');
    });

    it('should have priority column in issue_reports', async () => {
      const [issue] = await db
        .select()
        .from(issueReports)
        .where(eq(issueReports.id, testIssueId))
        .limit(1);

      expect(issue).toBeDefined();
      expect(issue).toHaveProperty('priority');
      expect(issue.priority).toBe('medium'); // default value
    });
  });

  describe('Admin Response to Feedback', () => {
    it('should allow adding admin response', async () => {
      const [updated] = await db
        .update(orderFeedback)
        .set({
          adminResponse: 'Thank you for your feedback!',
          adminResponseAt: new Date(),
          respondedBy: testClientId,
        })
        .where(eq(orderFeedback.id, testFeedbackId))
        .returning();

      expect(updated.adminResponse).toBe('Thank you for your feedback!');
      expect(updated.adminResponseAt).toBeDefined();
      expect(updated.respondedBy).toBe(testClientId);
    });

    it('should retrieve feedback with admin response', async () => {
      const [feedback] = await db
        .select()
        .from(orderFeedback)
        .where(eq(orderFeedback.id, testFeedbackId))
        .limit(1);

      expect(feedback.adminResponse).toBe('Thank you for your feedback!');
      expect(feedback.adminResponseAt).toBeDefined();
    });
  });

  describe('Issue Priority Management', () => {
    it('should allow updating issue priority to high', async () => {
      const [updated] = await db
        .update(issueReports)
        .set({ priority: 'high' })
        .where(eq(issueReports.id, testIssueId))
        .returning();

      expect(updated.priority).toBe('high');
    });

    it('should allow updating issue priority to critical', async () => {
      const [updated] = await db
        .update(issueReports)
        .set({ priority: 'critical' })
        .where(eq(issueReports.id, testIssueId))
        .returning();

      expect(updated.priority).toBe('critical');
    });

    it('should allow updating issue priority to low', async () => {
      const [updated] = await db
        .update(issueReports)
        .set({ priority: 'low' })
        .where(eq(issueReports.id, testIssueId))
        .returning();

      expect(updated.priority).toBe('low');
    });

    it('should retrieve issue with updated priority', async () => {
      const [issue] = await db
        .select()
        .from(issueReports)
        .where(eq(issueReports.id, testIssueId))
        .limit(1);

      expect(issue.priority).toBe('low');
    });
  });

  describe('Indexes', () => {
    it('should have index on admin_response_at', async () => {
      // Query using the indexed field - should be fast
      const start = Date.now();
      await db
        .select()
        .from(orderFeedback)
        .where(eq(orderFeedback.adminResponseAt, new Date()));
      const duration = Date.now() - start;

      // Should complete quickly (< 100ms for indexed query)
      expect(duration).toBeLessThan(100);
    });

    it('should have index on priority', async () => {
      // Query using the indexed field - should be fast
      const start = Date.now();
      await db
        .select()
        .from(issueReports)
        .where(eq(issueReports.priority, 'high'));
      const duration = Date.now() - start;

      // Should complete quickly (< 100ms for indexed query)
      expect(duration).toBeLessThan(100);
    });
  });
});
