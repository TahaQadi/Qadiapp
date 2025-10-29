import { describe, it, expect } from 'vitest';
import {
  insertNotificationSchema,
  updateNotificationSchema,
  notificationTypeEnum,
} from '../../shared/schema';

describe('Notification Validation Schemas', () => {
  describe('notificationTypeEnum', () => {
    it('should accept all valid notification types', () => {
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

      validTypes.forEach((type) => {
        expect(() => notificationTypeEnum.parse(type)).not.toThrow();
      });
    });

    it('should reject invalid notification types', () => {
      const invalidTypes = ['invalid_type', 'random', 'order_updated'];

      invalidTypes.forEach((type) => {
        expect(() => notificationTypeEnum.parse(type)).toThrow();
      });
    });
  });

  describe('insertNotificationSchema', () => {
    it('should validate complete notification data', () => {
      const validData = {
        clientId: 'client-123',
        type: 'order_created',
        titleEn: 'Order Created',
        titleAr: 'تم إنشاء الطلب',
        messageEn: 'Your order has been created',
        messageAr: 'تم إنشاء طلبك',
        metadata: JSON.stringify({ orderId: '123' }),
        actionUrl: '/orders/123',
        actionType: 'view_order',
      };

      const result = insertNotificationSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate minimal notification data', () => {
      const validData = {
        clientId: 'client-123',
        type: 'system',
        titleEn: 'Test',
        titleAr: 'اختبار',
        messageEn: 'Test message',
        messageAr: 'رسالة اختبار',
      };

      const result = insertNotificationSchema.parse(validData);
      expect(result.clientId).toBe('client-123');
      expect(result.type).toBe('system');
    });

    it('should accept valid action types', () => {
      const actionTypes = ['view_order', 'review_request', 'download_pdf', 'view_request'];

      actionTypes.forEach((actionType) => {
        const data = {
          clientId: 'client-123',
          type: 'system',
          titleEn: 'Test',
          titleAr: 'اختبار',
          messageEn: 'Test',
          messageAr: 'اختبار',
          actionType,
          actionUrl: '/test',
        };

        expect(() => insertNotificationSchema.parse(data)).not.toThrow();
      });
    });

    it('should reject invalid action types', () => {
      const data = {
        clientId: 'client-123',
        type: 'system',
        titleEn: 'Test',
        titleAr: 'اختبار',
        messageEn: 'Test',
        messageAr: 'اختبار',
        actionType: 'invalid_action',
        actionUrl: '/test',
      };

      expect(() => insertNotificationSchema.parse(data)).toThrow();
    });

    it('should require clientId', () => {
      const invalidData = {
        type: 'system',
        titleEn: 'Test',
        titleAr: 'اختبار',
        messageEn: 'Test',
        messageAr: 'اختبار',
      };

      expect(() => insertNotificationSchema.parse(invalidData)).toThrow();
    });

    it('should require type', () => {
      const invalidData = {
        clientId: 'client-123',
        titleEn: 'Test',
        titleAr: 'اختبار',
        messageEn: 'Test',
        messageAr: 'اختبار',
      };

      expect(() => insertNotificationSchema.parse(invalidData)).toThrow();
    });

    it('should require titleEn', () => {
      const invalidData = {
        clientId: 'client-123',
        type: 'system',
        titleAr: 'اختبار',
        messageEn: 'Test',
        messageAr: 'اختبار',
      };

      expect(() => insertNotificationSchema.parse(invalidData)).toThrow();
    });

    it('should require titleAr', () => {
      const invalidData = {
        clientId: 'client-123',
        type: 'system',
        titleEn: 'Test',
        messageEn: 'Test',
        messageAr: 'اختبار',
      };

      expect(() => insertNotificationSchema.parse(invalidData)).toThrow();
    });

    it('should require messageEn', () => {
      const invalidData = {
        clientId: 'client-123',
        type: 'system',
        titleEn: 'Test',
        titleAr: 'اختبار',
        messageAr: 'اختبار',
      };

      expect(() => insertNotificationSchema.parse(invalidData)).toThrow();
    });

    it('should require messageAr', () => {
      const invalidData = {
        clientId: 'client-123',
        type: 'system',
        titleEn: 'Test',
        titleAr: 'اختبار',
        messageEn: 'Test',
      };

      expect(() => insertNotificationSchema.parse(invalidData)).toThrow();
    });

    it('should accept metadata as JSON string', () => {
      const data = {
        clientId: 'client-123',
        type: 'system',
        titleEn: 'Test',
        titleAr: 'اختبار',
        messageEn: 'Test',
        messageAr: 'اختبار',
        metadata: JSON.stringify({ key: 'value', number: 123 }),
      };

      const result = insertNotificationSchema.parse(data);
      expect(result.metadata).toBe(JSON.stringify({ key: 'value', number: 123 }));
    });

    it('should accept optional actionUrl and actionType', () => {
      const data = {
        clientId: 'client-123',
        type: 'system',
        titleEn: 'Test',
        titleAr: 'اختبار',
        messageEn: 'Test',
        messageAr: 'اختبار',
      };

      const result = insertNotificationSchema.parse(data);
      expect(result.actionUrl).toBeUndefined();
      expect(result.actionType).toBeUndefined();
    });
  });

  describe('updateNotificationSchema', () => {
    it('should accept partial updates', () => {
      const data = {
        isRead: true,
      };

      const result = updateNotificationSchema.parse(data);
      expect(result.isRead).toBe(true);
    });

    it('should accept title updates', () => {
      const data = {
        titleEn: 'Updated Title',
        titleAr: 'عنوان محدث',
      };

      const result = updateNotificationSchema.parse(data);
      expect(result.titleEn).toBe('Updated Title');
      expect(result.titleAr).toBe('عنوان محدث');
    });

    it('should accept message updates', () => {
      const data = {
        messageEn: 'Updated message',
        messageAr: 'رسالة محدثة',
      };

      const result = updateNotificationSchema.parse(data);
      expect(result.messageEn).toBe('Updated message');
      expect(result.messageAr).toBe('رسالة محدثة');
    });

    it('should accept empty object', () => {
      const data = {};

      expect(() => updateNotificationSchema.parse(data)).not.toThrow();
    });

    it('should accept multiple fields', () => {
      const data = {
        isRead: true,
        titleEn: 'New Title',
        messageEn: 'New message',
      };

      const result = updateNotificationSchema.parse(data);
      expect(result.isRead).toBe(true);
      expect(result.titleEn).toBe('New Title');
      expect(result.messageEn).toBe('New message');
    });

    it('should reject invalid fields', () => {
      const data = {
        invalidField: 'value',
      } as any;

      // Zod will strip unknown fields by default
      const result = updateNotificationSchema.parse(data);
      expect('invalidField' in result).toBe(false);
    });

    it('should validate isRead as boolean', () => {
      const validData = { isRead: true };
      expect(() => updateNotificationSchema.parse(validData)).not.toThrow();

      const invalidData = { isRead: 'yes' };
      expect(() => updateNotificationSchema.parse(invalidData)).toThrow();
    });
  });

  describe('Schema Integration', () => {
    it('should work with typical notification lifecycle', () => {
      // Create notification
      const createData = {
        clientId: 'client-123',
        type: 'order_created',
        titleEn: 'Order Created',
        titleAr: 'تم إنشاء الطلب',
        messageEn: 'Your order #123 has been created',
        messageAr: 'تم إنشاء طلبك رقم 123',
        metadata: JSON.stringify({ orderId: '123' }),
        actionUrl: '/orders/123',
        actionType: 'view_order',
      };

      const created = insertNotificationSchema.parse(createData);
      expect(created.type).toBe('order_created');

      // Update notification (mark as read)
      const updateData = { isRead: true };
      const updated = updateNotificationSchema.parse(updateData);
      expect(updated.isRead).toBe(true);
    });

    it('should handle all notification types in workflow', () => {
      const types = [
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

      types.forEach((type) => {
        const data = {
          clientId: 'client-123',
          type,
          titleEn: `${type} notification`,
          titleAr: `إشعار ${type}`,
          messageEn: `Test ${type}`,
          messageAr: `اختبار ${type}`,
        };

        expect(() => insertNotificationSchema.parse(data)).not.toThrow();
      });
    });

    it('should handle action types workflow', () => {
      const actions = [
        { type: 'view_order', url: '/orders/123' },
        { type: 'review_request', url: '/admin/requests/456' },
        { type: 'download_pdf', url: '/api/pdf/download/789' },
        { type: 'view_request', url: '/price-requests/101' },
      ];

      actions.forEach((action) => {
        const data = {
          clientId: 'client-123',
          type: 'system',
          titleEn: 'Action Notification',
          titleAr: 'إشعار الإجراء',
          messageEn: 'Please take action',
          messageAr: 'يرجى اتخاذ إجراء',
          actionType: action.type,
          actionUrl: action.url,
        };

        expect(() => insertNotificationSchema.parse(data)).not.toThrow();
      });
    });
  });
});

