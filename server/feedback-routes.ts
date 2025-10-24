import { Router } from 'express';
import { db } from './db';
import { requireAuth } from './auth';
import { orderFeedback, issueReports, microFeedback, orders, clients } from '../shared/schema';
import { insertOrderFeedbackSchema, insertIssueReportSchema, insertMicroFeedbackSchema } from '../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { Response } from 'express';

// Database storage helpers for feedback operations
const storage = {
  getOrder: async (orderId: string) => {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    return order;
  },
  createOrderFeedback: async (feedbackData: any) => {
    const [newFeedback] = await db
      .insert(orderFeedback)
      .values(feedbackData)
      .returning();
    return newFeedback;
  }
};

// Define AuthenticatedRequest and Response types if not already defined
interface AuthenticatedRequest extends Express.Request {
  client?: {
    id: string;
    companyId?: string;
    isAdmin: boolean;
  };
}

const router = Router();

// Submit order feedback
router.post('/feedback/order/:orderId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;


    // Check if feedback already exists
    const [existingFeedback] = await db
      .select()
      .from(orderFeedback)
      .where(eq(orderFeedback.orderId, orderId))
      .limit(1);

    if (existingFeedback) {
      return res.status(409).json({
        message: 'Feedback already submitted for this order',
        messageAr: 'تم تقديم ملاحظات لهذا الطلب بالفعل'
      });
    }

    // Parse feedback data without orderId (it comes from URL params)
    const feedbackData = insertOrderFeedbackSchema.parse({
      ...req.body,
      orderId // Add orderId from URL params
    });

    // Verify order belongs to client
    const order = await storage.getOrder(orderId);
    if (!order) {
      console.error('Order not found:', orderId);
      return res.status(404).json({
        message: 'Order not found',
        messageAr: 'الطلب غير موجود'
      });
    }

    if (order.clientId !== req.client.id) {
      console.error('Unauthorized access attempt:', { orderId, clientId: req.client.id, orderClientId: order.clientId });
      return res.status(403).json({
        message: 'Unauthorized',
        messageAr: 'غير مصرح'
      });
    }

    // Create feedback
    const feedback = await storage.createOrderFeedback({
      ...feedbackData,
      orderId,
      clientId: req.client.id
    });


    res.json({
      message: 'Feedback submitted successfully',
      messageAr: 'تم إرسال التقييم بنجاح',
      feedback
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
      return res.status(400).json({
        message: error.errors[0]?.message || 'Validation error',
        messageAr: 'خطأ في التحقق من البيانات',
        errors: error.errors
      });
    }
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to submit feedback',
      messageAr: 'فشل إرسال التقييم'
    });
  }
});

// Get feedback for an order (client can check their own, admin can check all)
router.get('/feedback/order/:orderId', requireAuth, async (req: any, res: any) => {
  try {
    const { orderId } = req.params;

    // Verify order belongs to user (unless admin)
    if (!req.client!.isAdmin) {
      const [order] = await db
        .select({ clientId: orders.clientId })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order || order.clientId !== (req.client!.companyId || req.client!.id)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const [feedback] = await db
      .select()
      .from(orderFeedback)
      .where(eq(orderFeedback.orderId, orderId))
      .limit(1);

    res.json(feedback || null);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// Submit issue report
router.post('/feedback/issue', requireAuth, async (req: any, res: any) => {
  try {
    const data = insertIssueReportSchema.parse(req.body);

    const [newReport] = await db
      .insert(issueReports)
      .values({
        userId: req.client!.id,
        userType: req.client!.isAdmin ? 'admin' : 'client',
        orderId: data.orderId,
        issueType: data.issueType,
        severity: data.severity,
        title: data.title,
        description: data.description,
        steps: data.steps,
        expectedBehavior: data.expectedBehavior,
        actualBehavior: data.actualBehavior,
        browserInfo: data.browserInfo,
        screenSize: data.screenSize,
        screenshots: data.screenshots,
      })
      .returning();

    // Notify ALL admins for every issue report
    const { storage } = await import('./storage');
    const adminClients = await storage.getAdminClients();
    const client = await storage.getClient(req.client!.id);

    const severityLabelsEn = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'Critical'
    };

    const severityLabelsAr = {
      low: 'منخفضة',
      medium: 'متوسطة',
      high: 'عالية',
      critical: 'حرجة'
    };

    for (const admin of adminClients) {
      await storage.createNotification({
        clientId: admin.id,
        type: 'system',
        titleEn: `New Issue Report`,
        titleAr: 'بلاغ مشكلة جديد',
        messageEn: `${client?.nameEn || 'A client'} reported a ${severityLabelsEn[data.severity as keyof typeof severityLabelsEn]} severity issue: ${data.title}`,
        messageAr: `${client?.nameAr || 'عميل'} أبلغ عن مشكلة بدرجة ${severityLabelsAr[data.severity as keyof typeof severityLabelsAr]}: ${data.title}`,
        metadata: JSON.stringify({ 
          issueId: newReport.id,
          severity: data.severity,
          issueType: data.issueType,
          orderId: data.orderId 
        }),
      });
    }

    res.json({ success: true, id: newReport.id });
  } catch (error) {
    console.error('Error submitting issue:', error);
    res.status(500).json({ error: 'Failed to submit issue' });
  }
});

// Submit micro feedback
router.post('/feedback/micro', requireAuth, async (req: any, res: any) => {
  try {
    const data = insertMicroFeedbackSchema.parse(req.body);

    const [newFeedback] = await db
      .insert(microFeedback)
      .values({
        userId: req.client!.id,
        touchpoint: data.touchpoint,
        sentiment: data.sentiment,
        quickResponse: data.quickResponse,
        context: data.context,
      })
      .returning();

    res.json({ success: true, id: newFeedback.id });
  } catch (error) {
    console.error('Error submitting micro feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Update issue status (admin only)
router.patch('/feedback/issues/:id/status', requireAuth, async (req: any, res: any) => {
  try {
    if (!req.client!.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status } = req.body;
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const [updatedIssue] = await db
      .update(issueReports)
      .set({ 
        status,
        resolvedAt: status === 'resolved' || status === 'closed' ? new Date() : undefined
      })
      .where(eq(issueReports.id, req.params.id))
      .returning();

    if (!updatedIssue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Notify client of status change
    const { storage } = await import('./storage');
    await storage.createNotification({
      clientId: updatedIssue.userId,
      type: 'system',
      titleEn: 'Issue Status Updated',
      titleAr: 'تم تحديث حالة المشكلة',
      messageEn: `Your issue "${updatedIssue.title}" status has been updated to: ${status}`,
      messageAr: `تم تحديث حالة مشكلتك "${updatedIssue.title}" إلى: ${status}`,
      metadata: JSON.stringify({ issueId: updatedIssue.id, status }),
    });

    res.json(updatedIssue);
  } catch (error) {
    console.error('Error updating issue status:', error);
    res.status(500).json({ error: 'Failed to update issue status' });
  }
});

// Get all issues (admin only)
router.get('/feedback/issues', requireAuth, async (req: any, res: any) => {
  try {
    if (!req.client!.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const issues = await db
      .select({
        id: issueReports.id,
        userId: issueReports.userId,
        orderId: issueReports.orderId,
        issueType: issueReports.issueType,
        severity: issueReports.severity,
        title: issueReports.title,
        description: issueReports.description,
        status: issueReports.status,
        createdAt: issueReports.createdAt,
        resolvedAt: issueReports.resolvedAt,
        companyName: clients.nameEn,
      })
      .from(issueReports)
      .leftJoin(clients, eq(issueReports.userId, clients.id))
      .orderBy(desc(issueReports.createdAt));

    res.json(issues);
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// Get all feedback (admin only)
router.get('/feedback/all', requireAuth, async (req: any, res: any) => {
  try {
    if (!req.client!.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const allFeedback = await db
      .select({
        id: orderFeedback.id,
        orderId: orderFeedback.orderId,
        clientId: orderFeedback.clientId,
        rating: orderFeedback.rating,
        orderingProcessRating: orderFeedback.orderingProcessRating,
        productQualityRating: orderFeedback.productQualityRating,
        deliverySpeedRating: orderFeedback.deliverySpeedRating,
        communicationRating: orderFeedback.communicationRating,
        comments: orderFeedback.comments,
        wouldRecommend: orderFeedback.wouldRecommend,
        createdAt: orderFeedback.createdAt,
        companyName: clients.nameEn,
      })
      .from(orderFeedback)
      .innerJoin(orders, eq(orderFeedback.orderId, orders.id))
      .innerJoin(clients, eq(orderFeedback.clientId, clients.id))
      .orderBy(desc(orderFeedback.createdAt));

    res.json(allFeedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// Add admin response to feedback (admin only)
router.post('/feedback/:id/respond', requireAuth, async (req: any, res: any) => {
  try {
    if (!req.client!.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { response } = req.body;
    if (!response || typeof response !== 'string') {
      return res.status(400).json({ error: 'Response text is required' });
    }

    const [updatedFeedback] = await db
      .update(orderFeedback)
      .set({
        adminResponse: response,
        adminResponseAt: new Date(),
        respondedBy: req.client!.id,
      })
      .where(eq(orderFeedback.id, req.params.id))
      .returning();

    if (!updatedFeedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    // Notify client of response
    const { storage } = await import('./storage');
    await storage.createNotification({
      clientId: updatedFeedback.clientId,
      type: 'system',
      titleEn: 'Admin responded to your feedback',
      titleAr: 'رد المسؤول على ملاحظاتك',
      messageEn: `We've responded to your feedback on order #${updatedFeedback.orderId.slice(0, 8)}`,
      messageAr: `لقد قمنا بالرد على ملاحظاتك على الطلب #${updatedFeedback.orderId.slice(0, 8)}`,
      metadata: JSON.stringify({ feedbackId: updatedFeedback.id, orderId: updatedFeedback.orderId }),
    });

    res.json(updatedFeedback);
  } catch (error) {
    console.error('Error responding to feedback:', error);
    res.status(500).json({ error: 'Failed to respond to feedback' });
  }
});

// Update issue priority (admin only)
router.patch('/feedback/issues/:id/priority', requireAuth, async (req: any, res: any) => {
  try {
    if (!req.client!.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { priority } = req.body;
    const validPriorities = ['low', 'medium', 'high', 'critical'];

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority. Must be: low, medium, high, or critical' });
    }

    const [updatedIssue] = await db
      .update(issueReports)
      .set({ priority })
      .where(eq(issueReports.id, req.params.id))
      .returning();

    if (!updatedIssue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.json(updatedIssue);
  } catch (error) {
    console.error('Error updating issue priority:', error);
    res.status(500).json({ error: 'Failed to update issue priority' });
  }
});

export default router;