import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { storage } from '../storage';
import { db } from '../db';
import { issueReports } from '../../shared/schema';
import type { InsertIssueReport } from '../../shared/feedback-schema';
import { eq } from 'drizzle-orm';
import { createTestData, cleanupTestData, type TestData } from './test-fixtures';

describe('Issue Reports Integration Tests', () => {
  let testData: TestData;
  let testIssueId: string;

  beforeAll(async () => {
    testData = await createTestData();
  });

  afterAll(async () => {
    await cleanupTestData(testData);
  });

  describe('Issue Report Submission', () => {
    it('should submit an issue report with all fields', async () => {
      const issueData: InsertIssueReport = {
        userId: testData.client.id,
        userType: 'client',
        orderId: testData.order.id,
        issueType: 'bug',
        severity: 'high',
        title: 'Application crashes on checkout',
        description: 'The application crashes when trying to complete checkout process',
        steps: '1. Add items to cart, 2. Click checkout, 3. Application crashes',
        expectedBehavior: 'Checkout should proceed to confirmation page',
        actualBehavior: 'Application crashes with error message',
        browserInfo: 'Chrome 120.0.0.0',
        screenSize: '1920x1080',
      };

      const issue = await db.insert(issueReports).values({
        ...issueData,
        status: 'open',
      }).returning();

      expect(issue[0]).toBeDefined();
      expect(issue[0].userId).toBe(testData.client.id);
      expect(issue[0].userType).toBe('client');
      expect(issue[0].issueType).toBe('bug');
      expect(issue[0].severity).toBe('high');
      expect(issue[0].status).toBe('open');
      expect(issue[0].priority).toBe('medium'); // default

      testIssueId = issue[0].id;
    });

    it('should submit an issue report with minimal required fields', async () => {
      const issueData: InsertIssueReport = {
        userId: testData.client.id,
        userType: 'client',
        issueType: 'other',
        severity: 'low',
        title: 'Minor UI issue',
        description: 'Small UI inconsistency on the dashboard',
        browserInfo: 'Firefox 119.0',
        screenSize: '1366x768',
      };

      const issue = await db.insert(issueReports).values({
        ...issueData,
        status: 'open',
      }).returning();

      expect(issue[0]).toBeDefined();
      expect(issue[0].orderId).toBeNull();
      expect(issue[0].steps).toBeNull();

      // Cleanup
      await db.delete(issueReports).where(eq(issueReports.id, issue[0].id));
    });

    it('should support different issue types', async () => {
      const types = ['bug', 'feature_request', 'confusion', 'other'] as const;

      for (const type of types) {
        const issueData: InsertIssueReport = {
          userId: testData.client.id,
          userType: 'client',
          issueType: type,
          severity: 'medium',
          title: `Issue of type: ${type}`,
          description: `Testing issue type ${type}`,
          browserInfo: 'Edge 119.0',
          screenSize: '1920x1080',
        };

        const [issue] = await db.insert(issueReports).values({
          ...issueData,
          status: 'open',
        }).returning();

        expect(issue.issueType).toBe(type);

        // Cleanup
        await db.delete(issueReports).where(eq(issueReports.id, issue.id));
      }
    });

    it('should support different severity levels', async () => {
      const severities = ['low', 'medium', 'high', 'critical'] as const;

      for (const severity of severities) {
        const issueData: InsertIssueReport = {
          userId: testData.client.id,
          userType: 'client',
          issueType: 'bug',
          severity,
          title: `Issue with severity: ${severity}`,
          description: `Testing severity level ${severity}`,
          browserInfo: 'Safari 17.0',
          screenSize: '1440x900',
        };

        const [issue] = await db.insert(issueReports).values({
          ...issueData,
          status: 'open',
        }).returning();

        expect(issue.severity).toBe(severity);

        // Cleanup
        await db.delete(issueReports).where(eq(issueReports.id, issue.id));
      }
    });
  });

  describe('Issue Priority Management', () => {
    it('should have default priority of medium', async () => {
      const issueData: InsertIssueReport = {
        userId: testData.client.id,
        userType: 'client',
        issueType: 'bug',
        severity: 'medium',
        title: 'Default priority test',
        description: 'Testing default priority',
        browserInfo: 'Chrome 120',
        screenSize: '1920x1080',
      };

      const [issue] = await db.insert(issueReports).values({
        ...issueData,
        status: 'open',
      }).returning();

      expect(issue.priority).toBe('medium');

      // Cleanup
      await db.delete(issueReports).where(eq(issueReports.id, issue.id));
    });

    it('should allow updating issue priority', async () => {
      const issueData: InsertIssueReport = {
        userId: testData.client.id,
        userType: 'client',
        issueType: 'bug',
        severity: 'high',
        title: 'Priority update test',
        description: 'Testing priority update',
        browserInfo: 'Chrome 120',
        screenSize: '1920x1080',
      };

      const [issue] = await db.insert(issueReports).values({
        ...issueData,
        status: 'open',
      }).returning();

      // Update priority to high
      const [updated] = await db
        .update(issueReports)
        .set({ priority: 'high' })
        .where(eq(issueReports.id, issue.id))
        .returning();

      expect(updated.priority).toBe('high');

      // Update priority to critical
      const [updatedCritical] = await db
        .update(issueReports)
        .set({ priority: 'critical' })
        .where(eq(issueReports.id, issue.id))
        .returning();

      expect(updatedCritical.priority).toBe('critical');

      // Cleanup
      await db.delete(issueReports).where(eq(issueReports.id, issue.id));
    });

    it('should support all priority levels', async () => {
      const priorities = ['low', 'medium', 'high', 'critical'] as const;

      for (const priority of priorities) {
        const issueData: InsertIssueReport = {
          userId: testData.client.id,
          userType: 'client',
          issueType: 'bug',
          severity: 'high',
          title: 'Priority level test',
          description: 'Testing priority levels',
          browserInfo: 'Chrome 120',
          screenSize: '1920x1080',
        };

        const [issue] = await db.insert(issueReports).values({
          ...issueData,
          status: 'open',
        }).returning();

        await db
          .update(issueReports)
          .set({ priority })
          .where(eq(issueReports.id, issue.id));

        const [updated] = await db
          .select()
          .from(issueReports)
          .where(eq(issueReports.id, issue.id))
          .limit(1);

        expect(updated.priority).toBe(priority);

        // Cleanup
        await db.delete(issueReports).where(eq(issueReports.id, issue.id));
      }
    });
  });

  describe('Issue Status Transitions', () => {
    it('should transition status from open to investigating', async () => {
      const issueData: InsertIssueReport = {
        userId: testData.client.id,
        userType: 'client',
        issueType: 'bug',
        severity: 'medium',
        title: 'Status transition test',
        description: 'Testing status transitions',
        browserInfo: 'Chrome 120',
        screenSize: '1920x1080',
      };

      const [issue] = await db.insert(issueReports).values({
        ...issueData,
        status: 'open',
      }).returning();

      // Update to investigating
      const [updated] = await db
        .update(issueReports)
        .set({ status: 'investigating' })
        .where(eq(issueReports.id, issue.id))
        .returning();

      expect(updated.status).toBe('investigating');

      // Cleanup
      await db.delete(issueReports).where(eq(issueReports.id, issue.id));
    });

    it('should transition status to resolved and set resolvedAt', async () => {
      const issueData: InsertIssueReport = {
        userId: testData.client.id,
        userType: 'client',
        issueType: 'bug',
        severity: 'medium',
        title: 'Resolved status test',
        description: 'Testing resolved status',
        browserInfo: 'Chrome 120',
        screenSize: '1920x1080',
      };

      const [issue] = await db.insert(issueReports).values({
        ...issueData,
        status: 'open',
      }).returning();

      // Update to resolved
      const resolvedAt = new Date();
      const [updated] = await db
        .update(issueReports)
        .set({ status: 'resolved', resolvedAt })
        .where(eq(issueReports.id, issue.id))
        .returning();

      expect(updated.status).toBe('resolved');
      expect(updated.resolvedAt).toBeDefined();

      // Cleanup
      await db.delete(issueReports).where(eq(issueReports.id, issue.id));
    });
  });

  describe('Browser and Screen Information', () => {
    it('should capture browser info and screen size', async () => {
      const issueData: InsertIssueReport = {
        userId: testData.client.id,
        userType: 'client',
        issueType: 'bug',
        severity: 'medium',
        title: 'Browser info test',
        description: 'Testing browser info capture',
        browserInfo: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        screenSize: '2560x1440',
      };

      const [issue] = await db.insert(issueReports).values({
        ...issueData,
        status: 'open',
      }).returning();

      expect(issue.browserInfo).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0');
      expect(issue.screenSize).toBe('2560x1440');

      // Cleanup
      await db.delete(issueReports).where(eq(issueReports.id, issue.id));
    });
  });

  describe('Admin Assignment', () => {
    it('should allow assigning issue to admin', async () => {
      const issueData: InsertIssueReport = {
        userId: testData.client.id,
        userType: 'client',
        issueType: 'bug',
        severity: 'high',
        title: 'Assignment test',
        description: 'Testing admin assignment',
        browserInfo: 'Chrome 120',
        screenSize: '1920x1080',
      };

      const [issue] = await db.insert(issueReports).values({
        ...issueData,
        status: 'open',
      }).returning();

      // Assign to admin
      const [updated] = await db
        .update(issueReports)
        .set({ assignedTo: testData.admin.id })
        .where(eq(issueReports.id, issue.id))
        .returning();

      expect(updated.assignedTo).toBe(testData.admin.id);

      // Cleanup
      await db.delete(issueReports).where(eq(issueReports.id, issue.id));
    });
  });
});
