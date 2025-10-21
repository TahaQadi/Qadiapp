
import { Router } from 'express';
import { db } from './db';
import { requireAuth } from './auth';
import { nanoid } from 'nanoid';
import { insertOrderFeedbackSchema, insertIssueReportSchema, insertMicroFeedbackSchema } from '../shared/feedback-schema';

const router = Router();

// Submit order feedback
router.post('/feedback/order', requireAuth, async (req, res) => {
  try {
    // Parse without clientId - we'll get it from req.user
    const bodyData = insertOrderFeedbackSchema.omit({ clientId: true }).parse(req.body);
    
    // Get the company ID from the authenticated user
    const clientId = req.user!.companyId || req.user!.id;
    
    // Verify order belongs to user and is delivered
    const order = await db.prepare(
      'SELECT * FROM orders WHERE id = ? AND client_id = ? AND status = ?'
    ).get(bodyData.orderId, clientId, 'delivered');

    if (!order) {
      return res.status(403).json({ error: 'Order not found or not eligible for feedback' });
    }

    // Check if feedback already exists
    const existing = await db.prepare(
      'SELECT id FROM order_feedback WHERE order_id = ?'
    ).get(bodyData.orderId);

    if (existing) {
      return res.status(400).json({ error: 'Feedback already submitted for this order' });
    }

    const id = nanoid();
    await db.prepare(`
      INSERT INTO order_feedback (
        id, order_id, client_id, rating, ordering_process_rating,
        product_quality_rating, delivery_speed_rating, communication_rating,
        comments, would_recommend
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      bodyData.orderId,
      clientId,
      bodyData.rating,
      bodyData.orderingProcessRating || null,
      bodyData.productQualityRating || null,
      bodyData.deliverySpeedRating || null,
      bodyData.communicationRating || null,
      bodyData.comments || null,
      bodyData.wouldRecommend ? 1 : 0
    );

    res.json({ success: true, id });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Get feedback for an order (client can check their own, admin can check all)
router.get('/feedback/order/:orderId', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Verify order belongs to user (unless admin)
    if (req.user!.role !== 'admin') {
      const order = await db.prepare(
        'SELECT client_id FROM orders WHERE id = ?'
      ).get(orderId);

      if (!order || order.client_id !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const feedback = await db.prepare(
      'SELECT * FROM order_feedback WHERE order_id = ?'
    ).get(orderId);

    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// Submit issue report
router.post('/feedback/issue', requireAuth, async (req, res) => {
  try {
    const data = insertIssueReportSchema.parse(req.body);
    
    const id = nanoid();
    await db.prepare(`
      INSERT INTO issue_reports (
        id, user_id, user_type, order_id, issue_type, severity,
        title, description, steps, expected_behavior, actual_behavior,
        browser_info, screen_size, screenshots
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.user!.id,
      req.user!.role === 'admin' ? 'admin' : 'client',
      data.orderId || null,
      data.issueType,
      data.severity,
      data.title,
      data.description,
      data.steps || null,
      data.expectedBehavior || null,
      data.actualBehavior || null,
      data.browserInfo,
      data.screenSize,
      data.screenshots ? JSON.stringify(data.screenshots) : null
    );

    res.json({ success: true, id });
  } catch (error) {
    console.error('Error submitting issue:', error);
    res.status(500).json({ error: 'Failed to submit issue' });
  }
});

// Submit micro feedback
router.post('/feedback/micro', requireAuth, async (req, res) => {
  try {
    const data = insertMicroFeedbackSchema.parse(req.body);
    
    const id = nanoid();
    await db.prepare(`
      INSERT INTO micro_feedback (id, user_id, touchpoint, sentiment, quick_response, context)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.user!.id,
      data.touchpoint,
      data.sentiment,
      data.quickResponse || null,
      data.context ? JSON.stringify(data.context) : null
    );

    res.json({ success: true, id });
  } catch (error) {
    console.error('Error submitting micro feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Get all feedback (admin only)
router.get('/feedback/all', requireAuth, async (req, res) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const feedback = await db.prepare(`
      SELECT 
        of.*,
        o.reference_number,
        u.company_name
      FROM order_feedback of
      JOIN orders o ON of.order_id = o.id
      JOIN users u ON of.client_id = u.id
      ORDER BY of.created_at DESC
    `).all();

    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

export default router;
