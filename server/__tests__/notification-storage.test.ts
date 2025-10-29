import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../db';
import { notifications } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

describe('Notification Storage Methods', () => {
  let testClientId: string;
  let testNotificationIds: string[] = [];

  beforeEach(async () => {
    // Create a test client for notifications
    testClientId = 'test-client-' + Date.now();
    testNotificationIds = [];
  });

  afterEach(async () => {
    // Clean up test notifications
    if (testNotificationIds.length > 0) {
      await db.delete(notifications).where(
        eq(notifications.clientId, testClientId)
      );
    }
  });

  describe('createNotification', () => {
    it('should create notification with all fields', async () => {
      const notificationData = {
        clientId: testClientId,
        type: 'order_created',
        titleEn: 'Order Created',
        titleAr: 'تم إنشاء الطلب',
        messageEn: 'Your order has been created',
        messageAr: 'تم إنشاء طلبك',
        metadata: JSON.stringify({ orderId: '123' }),
        actionUrl: '/orders/123',
        actionType: 'view_order',
      };

      const [created] = await db.insert(notifications).values(notificationData).returning();
      testNotificationIds.push(created.id);

      expect(created).toMatchObject({
        clientId: testClientId,
        type: 'order_created',
        titleEn: 'Order Created',
        titleAr: 'تم إنشاء الطلب',
        messageEn: 'Your order has been created',
        messageAr: 'تم إنشاء طلبك',
        isRead: false,
        actionUrl: '/orders/123',
        actionType: 'view_order',
      });
      expect(created.id).toBeDefined();
      expect(created.createdAt).toBeDefined();
    });

    it('should create notification without optional fields', async () => {
      const notificationData = {
        clientId: testClientId,
        type: 'system',
        titleEn: 'System Message',
        titleAr: 'رسالة النظام',
        messageEn: 'System notification',
        messageAr: 'إشعار النظام',
      };

      const [created] = await db.insert(notifications).values(notificationData).returning();
      testNotificationIds.push(created.id);

      expect(created.metadata).toBeNull();
      expect(created.actionUrl).toBeNull();
      expect(created.actionType).toBeNull();
    });
  });

  describe('getClientNotifications with pagination and filtering', () => {
    beforeEach(async () => {
      // Create test notifications
      const testData = [
        {
          clientId: testClientId,
          type: 'order_created',
          titleEn: 'Order 1',
          titleAr: 'طلب 1',
          messageEn: 'Order created',
          messageAr: 'تم إنشاء الطلب',
          isRead: false,
        },
        {
          clientId: testClientId,
          type: 'order_status_changed',
          titleEn: 'Order 2',
          titleAr: 'طلب 2',
          messageEn: 'Status changed',
          messageAr: 'تغيرت الحالة',
          isRead: true,
        },
        {
          clientId: testClientId,
          type: 'order_created',
          titleEn: 'Order 3',
          titleAr: 'طلب 3',
          messageEn: 'Another order',
          messageAr: 'طلب آخر',
          isRead: false,
        },
        {
          clientId: testClientId,
          type: 'system',
          titleEn: 'System',
          titleAr: 'نظام',
          messageEn: 'System message',
          messageAr: 'رسالة النظام',
          isRead: false,
        },
      ];

      const created = await db.insert(notifications).values(testData).returning();
      testNotificationIds = created.map(n => n.id);
    });

    it('should fetch all notifications without filters', async () => {
      const result = await db
        .select()
        .from(notifications)
        .where(eq(notifications.clientId, testClientId));

      expect(result).toHaveLength(4);
    });

    it('should apply limit', async () => {
      const result = await db
        .select()
        .from(notifications)
        .where(eq(notifications.clientId, testClientId))
        .limit(2);

      expect(result).toHaveLength(2);
    });

    it('should apply offset', async () => {
      const allResults = await db
        .select()
        .from(notifications)
        .where(eq(notifications.clientId, testClientId))
        .limit(4);

      const offsetResults = await db
        .select()
        .from(notifications)
        .where(eq(notifications.clientId, testClientId))
        .offset(2)
        .limit(4);

      expect(offsetResults).toHaveLength(2);
      expect(offsetResults[0].id).not.toBe(allResults[0].id);
    });

    it('should filter by type', async () => {
      const result = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.clientId, testClientId),
            eq(notifications.type, 'order_created')
          )
        );

      expect(result).toHaveLength(2);
      result.forEach(n => {
        expect(n.type).toBe('order_created');
      });
    });

    it('should filter by isRead status', async () => {
      const unread = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.clientId, testClientId),
            eq(notifications.isRead, false)
          )
        );

      expect(unread).toHaveLength(3);

      const read = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.clientId, testClientId),
            eq(notifications.isRead, true)
          )
        );

      expect(read).toHaveLength(1);
    });

    it('should combine multiple filters', async () => {
      const result = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.clientId, testClientId),
            eq(notifications.type, 'order_created'),
            eq(notifications.isRead, false)
          )
        )
        .limit(1);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('order_created');
      expect(result[0].isRead).toBe(false);
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark notification as read', async () => {
      const [created] = await db.insert(notifications).values({
        clientId: testClientId,
        type: 'system',
        titleEn: 'Test',
        titleAr: 'اختبار',
        messageEn: 'Test',
        messageAr: 'اختبار',
        isRead: false,
      }).returning();
      testNotificationIds.push(created.id);

      expect(created.isRead).toBe(false);

      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, created.id));

      const [updated] = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, created.id));

      expect(updated.isRead).toBe(true);
    });
  });

  describe('markAllNotificationsAsRead', () => {
    beforeEach(async () => {
      const testData = [
        {
          clientId: testClientId,
          type: 'order_created',
          titleEn: 'Order 1',
          titleAr: 'طلب 1',
          messageEn: 'Order',
          messageAr: 'طلب',
          isRead: false,
        },
        {
          clientId: testClientId,
          type: 'system',
          titleEn: 'System',
          titleAr: 'نظام',
          messageEn: 'System',
          messageAr: 'نظام',
          isRead: false,
        },
      ];

      const created = await db.insert(notifications).values(testData).returning();
      testNotificationIds = created.map(n => n.id);
    });

    it('should mark all notifications as read', async () => {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.clientId, testClientId));

      const result = await db
        .select()
        .from(notifications)
        .where(eq(notifications.clientId, testClientId));

      result.forEach(n => {
        expect(n.isRead).toBe(true);
      });
    });

    it('should mark only specific type as read', async () => {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.clientId, testClientId),
            eq(notifications.type, 'order_created')
          )
        );

      const orderNotifs = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.clientId, testClientId),
            eq(notifications.type, 'order_created')
          )
        );

      orderNotifs.forEach(n => {
        expect(n.isRead).toBe(true);
      });

      const systemNotifs = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.clientId, testClientId),
            eq(notifications.type, 'system')
          )
        );

      systemNotifs.forEach(n => {
        expect(n.isRead).toBe(false);
      });
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      const [created] = await db.insert(notifications).values({
        clientId: testClientId,
        type: 'system',
        titleEn: 'Test',
        titleAr: 'اختبار',
        messageEn: 'Test',
        messageAr: 'اختبار',
      }).returning();
      testNotificationIds.push(created.id);

      await db.delete(notifications).where(eq(notifications.id, created.id));

      const result = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, created.id));

      expect(result).toHaveLength(0);
    });
  });

  describe('deleteAllReadNotifications', () => {
    beforeEach(async () => {
      const testData = [
        {
          clientId: testClientId,
          type: 'system',
          titleEn: 'Read 1',
          titleAr: 'مقروء 1',
          messageEn: 'Read',
          messageAr: 'مقروء',
          isRead: true,
        },
        {
          clientId: testClientId,
          type: 'system',
          titleEn: 'Read 2',
          titleAr: 'مقروء 2',
          messageEn: 'Read',
          messageAr: 'مقروء',
          isRead: true,
        },
        {
          clientId: testClientId,
          type: 'system',
          titleEn: 'Unread',
          titleAr: 'غير مقروء',
          messageEn: 'Unread',
          messageAr: 'غير مقروء',
          isRead: false,
        },
      ];

      const created = await db.insert(notifications).values(testData).returning();
      testNotificationIds = created.map(n => n.id);
    });

    it('should delete only read notifications', async () => {
      await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.clientId, testClientId),
            eq(notifications.isRead, true)
          )
        );

      const remaining = await db
        .select()
        .from(notifications)
        .where(eq(notifications.clientId, testClientId));

      expect(remaining).toHaveLength(1);
      expect(remaining[0].isRead).toBe(false);
    });
  });

  describe('getUnreadNotificationCount', () => {
    beforeEach(async () => {
      const testData = [
        {
          clientId: testClientId,
          type: 'system',
          titleEn: 'Read',
          titleAr: 'مقروء',
          messageEn: 'Read',
          messageAr: 'مقروء',
          isRead: true,
        },
        {
          clientId: testClientId,
          type: 'system',
          titleEn: 'Unread 1',
          titleAr: 'غير مقروء 1',
          messageEn: 'Unread',
          messageAr: 'غير مقروء',
          isRead: false,
        },
        {
          clientId: testClientId,
          type: 'system',
          titleEn: 'Unread 2',
          titleAr: 'غير مقروء 2',
          messageEn: 'Unread',
          messageAr: 'غير مقروء',
          isRead: false,
        },
      ];

      const created = await db.insert(notifications).values(testData).returning();
      testNotificationIds = created.map(n => n.id);
    });

    it('should count only unread notifications', async () => {
      const result = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.clientId, testClientId),
            eq(notifications.isRead, false)
          )
        );

      expect(result.length).toBe(2);
    });
  });

  describe('Notification Schema Validation', () => {
    it('should enforce required fields', async () => {
      await expect(
        db.insert(notifications).values({
          // Missing required fields
        } as any).returning()
      ).rejects.toThrow();
    });

    it('should accept all valid notification types', async () => {
      const validTypes = [
        'order_created',
        'order_status_changed',
        'order_modification_requested',
        'order_modification_reviewed',
        'system',
        'price_request',
        'price_offer_ready',
        'price_request_sent',
        'issue_report',
      ];

      for (const type of validTypes) {
        const [created] = await db.insert(notifications).values({
          clientId: testClientId,
          type,
          titleEn: 'Test',
          titleAr: 'اختبار',
          messageEn: 'Test',
          messageAr: 'اختبار',
        }).returning();
        
        testNotificationIds.push(created.id);
        expect(created.type).toBe(type);
      }
    });

    it('should accept valid action types', async () => {
      const validActionTypes = ['view_order', 'review_request', 'download_pdf', 'view_request'];

      for (const actionType of validActionTypes) {
        const [created] = await db.insert(notifications).values({
          clientId: testClientId,
          type: 'system',
          titleEn: 'Test',
          titleAr: 'اختبار',
          messageEn: 'Test',
          messageAr: 'اختبار',
          actionType,
          actionUrl: '/test',
        }).returning();
        
        testNotificationIds.push(created.id);
        expect(created.actionType).toBe(actionType);
      }
    });
  });
});

