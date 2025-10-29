import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { storage } from '../storage';

// Mock storage
vi.mock('../storage', () => ({
  storage: {
    getClientNotifications: vi.fn(),
    getUnreadNotificationCount: vi.fn(),
    markNotificationAsRead: vi.fn(),
    markAllNotificationsAsRead: vi.fn(),
    deleteNotification: vi.fn(),
    deleteAllReadNotifications: vi.fn(),
    archiveOldNotifications: vi.fn(),
  },
}));

vi.mock('../error-logger', () => ({
  errorLogger: {
    logError: vi.fn(),
  },
}));

// Mock authentication middleware
const mockRequireAuth = (req: any, res: any, next: any) => {
  req.client = { id: 'test-client-1' };
  next();
};

const mockRequireAdmin = (req: any, res: any, next: any) => {
  req.client = { id: 'test-admin-1', isAdmin: true };
  next();
};

describe('Notification Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/client/notifications', () => {
    beforeEach(() => {
      app.get('/api/client/notifications', mockRequireAuth, async (req: any, res) => {
        try {
          const { limit, offset, type, isRead } = req.query;
          
          const options: any = {};
          if (limit) options.limit = parseInt(limit as string);
          if (offset) options.offset = parseInt(offset as string);
          if (type) options.type = type as string;
          if (isRead !== undefined) options.isRead = isRead === 'true';
          
          const notifications = await storage.getClientNotifications(req.client.id, options);
          res.json(notifications);
        } catch (error) {
          res.status(500).json({ message: 'Error' });
        }
      });
    });

    it('should fetch notifications without filters', async () => {
      const mockNotifications = [
        {
          id: '1',
          type: 'order_created',
          titleEn: 'Order Created',
          titleAr: 'تم إنشاء الطلب',
          messageEn: 'Order created',
          messageAr: 'تم إنشاء الطلب',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ];

      vi.mocked(storage.getClientNotifications).mockResolvedValue(mockNotifications as any);

      const response = await request(app).get('/api/client/notifications');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockNotifications);
      expect(storage.getClientNotifications).toHaveBeenCalledWith('test-client-1', {});
    });

    it('should support pagination parameters', async () => {
      vi.mocked(storage.getClientNotifications).mockResolvedValue([]);

      await request(app).get('/api/client/notifications?limit=10&offset=20');

      expect(storage.getClientNotifications).toHaveBeenCalledWith('test-client-1', {
        limit: 10,
        offset: 20,
      });
    });

    it('should support type filter', async () => {
      vi.mocked(storage.getClientNotifications).mockResolvedValue([]);

      await request(app).get('/api/client/notifications?type=order_created');

      expect(storage.getClientNotifications).toHaveBeenCalledWith('test-client-1', {
        type: 'order_created',
      });
    });

    it('should support isRead filter', async () => {
      vi.mocked(storage.getClientNotifications).mockResolvedValue([]);

      await request(app).get('/api/client/notifications?isRead=false');

      expect(storage.getClientNotifications).toHaveBeenCalledWith('test-client-1', {
        isRead: false,
      });
    });

    it('should combine multiple filters', async () => {
      vi.mocked(storage.getClientNotifications).mockResolvedValue([]);

      await request(app).get('/api/client/notifications?limit=5&type=system&isRead=true');

      expect(storage.getClientNotifications).toHaveBeenCalledWith('test-client-1', {
        limit: 5,
        type: 'system',
        isRead: true,
      });
    });

    it('should handle errors', async () => {
      vi.mocked(storage.getClientNotifications).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/client/notifications');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/client/notifications/unread-count', () => {
    beforeEach(() => {
      app.get('/api/client/notifications/unread-count', mockRequireAuth, async (req: any, res) => {
        try {
          const count = await storage.getUnreadNotificationCount(req.client.id);
          res.json({ count });
        } catch (error) {
          res.status(500).json({ message: 'Error' });
        }
      });
    });

    it('should return unread count', async () => {
      vi.mocked(storage.getUnreadNotificationCount).mockResolvedValue(5);

      const response = await request(app).get('/api/client/notifications/unread-count');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ count: 5 });
    });

    it('should handle zero unread notifications', async () => {
      vi.mocked(storage.getUnreadNotificationCount).mockResolvedValue(0);

      const response = await request(app).get('/api/client/notifications/unread-count');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ count: 0 });
    });
  });

  describe('PATCH /api/client/notifications/:id/read', () => {
    beforeEach(() => {
      app.patch('/api/client/notifications/:id/read', mockRequireAuth, async (req: any, res) => {
        try {
          const notification = await storage.markNotificationAsRead(req.params.id);
          if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
          }
          res.json(notification);
        } catch (error) {
          res.status(500).json({ message: 'Error' });
        }
      });
    });

    it('should mark notification as read', async () => {
      const mockNotification = {
        id: 'notif-1',
        isRead: true,
        type: 'system',
        titleEn: 'Test',
        titleAr: 'اختبار',
        messageEn: 'Test',
        messageAr: 'اختبار',
        createdAt: new Date().toISOString(),
      };

      vi.mocked(storage.markNotificationAsRead).mockResolvedValue(mockNotification as any);

      const response = await request(app).patch('/api/client/notifications/notif-1/read');

      expect(response.status).toBe(200);
      expect(response.body.isRead).toBe(true);
      expect(storage.markNotificationAsRead).toHaveBeenCalledWith('notif-1');
    });

    it('should return 404 for non-existent notification', async () => {
      vi.mocked(storage.markNotificationAsRead).mockResolvedValue(null);

      const response = await request(app).patch('/api/client/notifications/non-existent/read');

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/client/notifications/mark-all-read', () => {
    beforeEach(() => {
      app.patch('/api/client/notifications/mark-all-read', mockRequireAuth, async (req: any, res) => {
        try {
          const { type } = req.body;
          await storage.markAllNotificationsAsRead(req.client.id, type);
          res.json({
            message: type ? `All ${type} notifications marked as read` : 'All notifications marked as read',
          });
        } catch (error) {
          res.status(500).json({ message: 'Error' });
        }
      });
    });

    it('should mark all notifications as read', async () => {
      vi.mocked(storage.markAllNotificationsAsRead).mockResolvedValue();

      const response = await request(app).patch('/api/client/notifications/mark-all-read').send({});

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('All notifications marked as read');
      expect(storage.markAllNotificationsAsRead).toHaveBeenCalledWith('test-client-1', undefined);
    });

    it('should mark specific type as read', async () => {
      vi.mocked(storage.markAllNotificationsAsRead).mockResolvedValue();

      const response = await request(app)
        .patch('/api/client/notifications/mark-all-read')
        .send({ type: 'order_created' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('order_created');
      expect(storage.markAllNotificationsAsRead).toHaveBeenCalledWith('test-client-1', 'order_created');
    });
  });

  describe('DELETE /api/client/notifications/:id', () => {
    beforeEach(() => {
      app.delete('/api/client/notifications/:id', mockRequireAuth, async (req: any, res) => {
        try {
          await storage.deleteNotification(req.params.id);
          res.sendStatus(204);
        } catch (error) {
          res.status(500).json({ message: 'Error' });
        }
      });
    });

    it('should delete notification', async () => {
      vi.mocked(storage.deleteNotification).mockResolvedValue();

      const response = await request(app).delete('/api/client/notifications/notif-1');

      expect(response.status).toBe(204);
      expect(storage.deleteNotification).toHaveBeenCalledWith('notif-1');
    });
  });

  describe('DELETE /api/client/notifications/read/all', () => {
    beforeEach(() => {
      app.delete('/api/client/notifications/read/all', mockRequireAuth, async (req: any, res) => {
        try {
          const count = await storage.deleteAllReadNotifications(req.client.id);
          res.json({
            count,
            message: `Deleted ${count} read notification(s)`,
          });
        } catch (error) {
          res.status(500).json({ message: 'Error' });
        }
      });
    });

    it('should delete all read notifications', async () => {
      vi.mocked(storage.deleteAllReadNotifications).mockResolvedValue(3);

      const response = await request(app).delete('/api/client/notifications/read/all');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(3);
      expect(response.body.message).toContain('3');
      expect(storage.deleteAllReadNotifications).toHaveBeenCalledWith('test-client-1');
    });

    it('should return zero if no notifications deleted', async () => {
      vi.mocked(storage.deleteAllReadNotifications).mockResolvedValue(0);

      const response = await request(app).delete('/api/client/notifications/read/all');

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
    });
  });

  describe('POST /api/admin/notifications/archive (Admin Only)', () => {
    beforeEach(() => {
      app.post('/api/admin/notifications/archive', mockRequireAdmin, async (req: any, res) => {
        try {
          const { days = 30 } = req.body;
          const count = await storage.archiveOldNotifications(days);
          res.json({
            count,
            message: `Archived ${count} old notification(s)`,
          });
        } catch (error) {
          res.status(500).json({ message: 'Error' });
        }
      });
    });

    it('should archive old notifications with default days', async () => {
      vi.mocked(storage.archiveOldNotifications).mockResolvedValue(10);

      const response = await request(app).post('/api/admin/notifications/archive').send({});

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(10);
      expect(storage.archiveOldNotifications).toHaveBeenCalledWith(30);
    });

    it('should archive with custom days', async () => {
      vi.mocked(storage.archiveOldNotifications).mockResolvedValue(5);

      const response = await request(app).post('/api/admin/notifications/archive').send({ days: 60 });

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(5);
      expect(storage.archiveOldNotifications).toHaveBeenCalledWith(60);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      app.get('/api/client/notifications', mockRequireAuth, async (req: any, res) => {
        try {
          await storage.getClientNotifications(req.client.id);
          res.json([]);
        } catch (error) {
          res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
        }
      });
    });

    it('should handle storage errors gracefully', async () => {
      vi.mocked(storage.getClientNotifications).mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app).get('/api/client/notifications');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Database connection failed');
    });
  });
});

