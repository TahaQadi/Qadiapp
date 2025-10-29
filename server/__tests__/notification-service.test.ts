import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationService, notificationService } from '../services/notification-service';
import { storage } from '../storage';
import webpush from 'web-push';

// Mock dependencies
vi.mock('../storage', () => ({
  storage: {
    createNotification: vi.fn(),
    getPushSubscriptions: vi.fn(),
    deletePushSubscription: vi.fn(),
    getAdminClients: vi.fn(),
  },
}));

vi.mock('web-push', () => ({
  default: {
    sendNotification: vi.fn(),
  },
}));

vi.mock('../error-logger', () => ({
  errorLogger: {
    logError: vi.fn(),
  },
}));

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('send()', () => {
    it('should create in-app notification', async () => {
      const mockNotification = {
        id: 'notif-1',
        clientId: 'client-1',
        type: 'order_created',
        titleEn: 'Order Created',
        titleAr: 'تم إنشاء الطلب',
        messageEn: 'Your order has been created',
        messageAr: 'تم إنشاء طلبك',
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      vi.mocked(storage.createNotification).mockResolvedValue(mockNotification as any);
      vi.mocked(storage.getPushSubscriptions).mockResolvedValue([]);

      const result = await notificationService.send({
        recipientId: 'client-1',
        recipientType: 'client',
        type: 'order_created',
        titleEn: 'Order Created',
        titleAr: 'تم إنشاء الطلب',
        messageEn: 'Your order has been created',
        messageAr: 'تم إنشاء طلبك',
      });

      expect(result.success).toBe(true);
      expect(result.inAppNotification).toEqual(mockNotification);
      expect(storage.createNotification).toHaveBeenCalledWith({
        clientId: 'client-1',
        type: 'order_created',
        titleEn: 'Order Created',
        titleAr: 'تم إنشاء الطلب',
        messageEn: 'Your order has been created',
        messageAr: 'تم إنشاء طلبك',
        metadata: undefined,
      });
    });

    it('should send push notification to all user devices', async () => {
      const mockSubscriptions = [
        {
          endpoint: 'https://push.service.com/endpoint1',
          keys: { p256dh: 'key1', auth: 'auth1' },
        },
        {
          endpoint: 'https://push.service.com/endpoint2',
          keys: { p256dh: 'key2', auth: 'auth2' },
        },
      ];

      vi.mocked(storage.createNotification).mockResolvedValue({} as any);
      vi.mocked(storage.getPushSubscriptions).mockResolvedValue(mockSubscriptions as any);
      vi.mocked(webpush.sendNotification).mockResolvedValue({} as any);

      const result = await notificationService.send({
        recipientId: 'client-1',
        recipientType: 'client',
        type: 'order_status_changed',
        titleEn: 'Status Updated',
        titleAr: 'تم التحديث',
        messageEn: 'Order status changed',
        messageAr: 'تغيرت حالة الطلب',
        actionUrl: '/orders/123',
        actionType: 'view_order',
      });

      expect(result.success).toBe(true);
      expect(result.pushResults).toHaveLength(2);
      expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
    });

    it('should handle failed push subscriptions and remove them', async () => {
      const mockSubscriptions = [
        {
          endpoint: 'https://push.service.com/endpoint1',
          keys: { p256dh: 'key1', auth: 'auth1' },
        },
      ];

      vi.mocked(storage.createNotification).mockResolvedValue({} as any);
      vi.mocked(storage.getPushSubscriptions).mockResolvedValue(mockSubscriptions as any);
      vi.mocked(webpush.sendNotification).mockRejectedValue({ statusCode: 410, message: 'Gone' });

      await notificationService.send({
        recipientId: 'client-1',
        recipientType: 'client',
        type: 'system',
        titleEn: 'Test',
        titleAr: 'اختبار',
        messageEn: 'Test message',
        messageAr: 'رسالة اختبار',
      });

      expect(storage.deletePushSubscription).toHaveBeenCalledWith('https://push.service.com/endpoint1');
    });

    it('should include metadata in notification', async () => {
      vi.mocked(storage.createNotification).mockResolvedValue({} as any);
      vi.mocked(storage.getPushSubscriptions).mockResolvedValue([]);

      await notificationService.send({
        recipientId: 'client-1',
        recipientType: 'client',
        type: 'order_created',
        titleEn: 'Test',
        titleAr: 'اختبار',
        messageEn: 'Test',
        messageAr: 'اختبار',
        metadata: { orderId: '123', orderNumber: 'ORD-001' },
      });

      expect(storage.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: JSON.stringify({ orderId: '123', orderNumber: 'ORD-001' }),
        })
      );
    });
  });

  describe('sendToMultiple()', () => {
    it('should send notifications to multiple recipients', async () => {
      vi.mocked(storage.createNotification).mockResolvedValue({} as any);
      vi.mocked(storage.getPushSubscriptions).mockResolvedValue([]);

      const recipients = [
        { id: 'admin-1', type: 'admin' as const },
        { id: 'admin-2', type: 'admin' as const },
      ];

      await notificationService.sendToMultiple(recipients, {
        type: 'issue_report',
        titleEn: 'New Issue',
        titleAr: 'مشكلة جديدة',
        messageEn: 'A new issue was reported',
        messageAr: 'تم الإبلاغ عن مشكلة جديدة',
      });

      expect(storage.createNotification).toHaveBeenCalledTimes(2);
    });
  });

  describe('sendToAllAdmins()', () => {
    it('should send notification to all admin clients', async () => {
      const mockAdmins = [
        { id: 'admin-1', isAdmin: true },
        { id: 'admin-2', isAdmin: true },
      ];

      vi.mocked(storage.getAdminClients).mockResolvedValue(mockAdmins as any);
      vi.mocked(storage.createNotification).mockResolvedValue({} as any);
      vi.mocked(storage.getPushSubscriptions).mockResolvedValue([]);

      await notificationService.sendToAllAdmins({
        type: 'price_request',
        titleEn: 'New Request',
        titleAr: 'طلب جديد',
        messageEn: 'New price request',
        messageAr: 'طلب سعر جديد',
      });

      expect(storage.getAdminClients).toHaveBeenCalled();
      expect(storage.createNotification).toHaveBeenCalledTimes(2);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(storage.getAdminClients).mockRejectedValue(new Error('Database error'));

      await expect(
        notificationService.sendToAllAdmins({
          type: 'system',
          titleEn: 'Test',
          titleAr: 'اختبار',
          messageEn: 'Test',
          messageAr: 'اختبار',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('Helper Methods', () => {
    describe('createOrderNotification()', () => {
      it('should create properly formatted order notification', () => {
        const notification = notificationService.createOrderNotification(
          'order-123',
          'ORD-001',
          'confirmed'
        );

        expect(notification.type).toBe('order_status_changed');
        expect(notification.titleEn).toBe('Order Status Update');
        expect(notification.titleAr).toBe('تحديث حالة الطلب');
        expect(notification.messageEn).toContain('ORD-001');
        expect(notification.messageEn).toContain('confirmed');
        expect(notification.actionUrl).toBe('/orders');
        expect(notification.actionType).toBe('view_order');
        expect(notification.metadata).toEqual({
          orderId: 'order-123',
          orderNumber: 'ORD-001',
          status: 'confirmed',
        });
      });

      it('should handle different order statuses', () => {
        const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

        statuses.forEach((status) => {
          const notification = notificationService.createOrderNotification(
            'order-123',
            'ORD-001',
            status
          );
          expect(notification.messageEn).toContain(status);
        });
      });
    });

    describe('createPriceRequestNotification()', () => {
      it('should create properly formatted price request notification', () => {
        const notification = notificationService.createPriceRequestNotification(
          { en: 'ABC Corp', ar: 'شركة ABC' },
          'PR-001',
          5,
          'request-123'
        );

        expect(notification.type).toBe('price_request');
        expect(notification.titleEn).toBe('New Price Request');
        expect(notification.titleAr).toBe('طلب سعر جديد');
        expect(notification.messageEn).toContain('ABC Corp');
        expect(notification.messageEn).toContain('5 product(s)');
        expect(notification.messageAr).toContain('شركة ABC');
        expect(notification.messageAr).toContain('5 منتج');
        expect(notification.actionType).toBe('review_request');
        expect(notification.metadata).toEqual({
          requestId: 'request-123',
          requestNumber: 'PR-001',
        });
      });
    });

    describe('createIssueReportNotification()', () => {
      it('should create properly formatted issue report notification', () => {
        const notification = notificationService.createIssueReportNotification(
          { en: 'John Doe', ar: 'جون دو' },
          'high',
          'Payment not working',
          'issue-123'
        );

        expect(notification.type).toBe('issue_report');
        expect(notification.titleEn).toBe('New Issue Report');
        expect(notification.titleAr).toBe('بلاغ مشكلة جديد');
        expect(notification.messageEn).toContain('John Doe');
        expect(notification.messageEn).toContain('high');
        expect(notification.messageEn).toContain('Payment not working');
        expect(notification.actionType).toBe('review_request');
        expect(notification.metadata).toEqual({
          issueId: 'issue-123',
          severity: 'high',
          title: 'Payment not working',
        });
      });

      it('should handle different severity levels', () => {
        const severities = ['low', 'medium', 'high', 'critical'];

        severities.forEach((severity) => {
          const notification = notificationService.createIssueReportNotification(
            { en: 'Client', ar: 'عميل' },
            severity,
            'Test issue',
            'issue-123'
          );
          expect(notification.messageEn).toBeDefined();
          expect(notification.messageAr).toBeDefined();
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle notification creation errors gracefully', async () => {
      vi.mocked(storage.createNotification).mockRejectedValue(new Error('Database error'));
      vi.mocked(storage.getPushSubscriptions).mockResolvedValue([]);

      const result = await notificationService.send({
        recipientId: 'client-1',
        recipientType: 'client',
        type: 'system',
        titleEn: 'Test',
        titleAr: 'اختبار',
        messageEn: 'Test',
        messageAr: 'اختبار',
      });

      expect(result.success).toBe(false);
    });

    it('should handle push notification errors gracefully', async () => {
      vi.mocked(storage.createNotification).mockResolvedValue({} as any);
      vi.mocked(storage.getPushSubscriptions).mockRejectedValue(new Error('Push service error'));

      const result = await notificationService.send({
        recipientId: 'client-1',
        recipientType: 'client',
        type: 'system',
        titleEn: 'Test',
        titleAr: 'اختبار',
        messageEn: 'Test',
        messageAr: 'اختبار',
      });

      // Should still succeed with in-app notification even if push fails
      expect(result.success).toBe(true);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = NotificationService.getInstance();
      const instance2 = NotificationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });
});

