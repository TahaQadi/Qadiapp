
import { Router } from 'express';
import { db } from './db';
import { requireAuth } from './auth';
import { orderFeedback, issueReports, microFeedback, orders, clients } from '../shared/schema';
import { insertOrderFeedbackSchema, insertIssueReportSchema, insertMicroFeedbackSchema } from '../shared/schema';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

// Submit order feedback
router.post('/feedback/order', requireAuth, async (req: any, res) => {
  try {
    const bodyData = insertOrderFeedbackSchema.parse(req.body);
    
    // Get the client ID from the authenticated user
    const clientId = req.client!.companyId || req.client!.id;
    
    // Verify order belongs to user and is delivered
    const [order] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.id, bodyData.orderId),
          eq(orders.clientId, clientId),
          eq(orders.status, 'delivered')
        )
      )
      .limit(1);

    if (!order) {
      return res.status(403).json({ error: 'Order not found or not eligible for feedback' });
    }

    // Check if feedback already exists
    const [existing] = await db
      .select()
      .from(orderFeedback)
      .where(eq(orderFeedback.orderId, bodyData.orderId))
      .limit(1);

    if (existing) {
      return res.status(400).json({ error: 'Feedback already submitted for this order' });
    }

    // Insert feedback
    const [newFeedback] = await db
      .insert(orderFeedback)
      .values({
        orderId: bodyData.orderId,
        clientId,
        rating: bodyData.rating,
        orderingProcessRating: bodyData.orderingProcessRating,
        productQualityRating: bodyData.productQualityRating,
        deliverySpeedRating: bodyData.deliverySpeedRating,
        communicationRating: bodyData.communicationRating,
        comments: bodyData.comments,
        wouldRecommend: bodyData.wouldRecommend,
      })
      .returning();

    res.json({ success: true, id: newFeedback.id });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Get feedback for an order (client can check their own, admin can check all)
router.get('/feedback/order/:orderId', requireAuth, async (req: any, res) => {
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
router.post('/feedback/issue', requireAuth, async (req: any, res) => {
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

    res.json({ success: true, id: newReport.id });
  } catch (error) {
    console.error('Error submitting issue:', error);
    res.status(500).json({ error: 'Failed to submit issue' });
  }
});

// Submit micro feedback
router.post('/feedback/micro', requireAuth, async (req: any, res) => {
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

// Get all feedback (admin only)
router.get('/feedback/all', requireAuth, async (req: any, res) => {
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

export default router;
