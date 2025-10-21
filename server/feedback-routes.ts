
import { Router } from 'express';
import { db } from './db';
import { requireAuth } from './auth';
import { nanoid } from 'nanoid';
import { insertOrderFeedbackSchema, insertIssueReportSchema, insertMicroFeedbackSchema } from '../shared/feedback-schema';

const router = Router();

// Submit order feedback
router.post('/feedback/order', requireAuth, async (req, res) => {
  try {
    const data = insertOrderFeedbackSchema.parse(req.body);
    
    // Verify order belongs to user and is delivered
    const order = await db.prepare(
      'SELECT * FROM orders WHERE id = ? AND client_id = ? AND status = ?'
    ).get(data.orderId, req.user!.id, 'delivered');

    if (!order) {
      return res.status(403).json({ error: 'Order not found or not eligible for feedback' });
    }

    // Check if feedback already exists
    const existing = await db.prepare(
      'SELECT id FROM order_feedback WHERE order_id = ?'
    ).get(data.orderId);

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
      data.orderId,
      req.user!.id,
      data.rating,
      data.orderingProcessRating || null,
      data.productQualityRating || null,
      data.deliverySpeedRating || null,
      data.communicationRating || null,
      data.comments || null,
      data.wouldRecommend ? 1 : 0
    );

    res.json({ success: true, id });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Get feedback for an order (admin only)
router.get('/feedback/order/:orderId', requireAuth, async (req, res) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const feedback = await db.prepare(
      'SELECT * FROM order_feedback WHERE order_id = ?'
    ).get(req.params.orderId);

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
