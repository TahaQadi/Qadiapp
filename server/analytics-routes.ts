
import { Router } from 'express';
import { z } from 'zod';

const router = Router();

const analyticsEventSchema = z.object({
  category: z.string(),
  action: z.string(),
  label: z.string().optional(),
  value: z.number().optional(),
});

const errorReportSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  context: z.object({
    component: z.string().optional(),
    action: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }).optional(),
  timestamp: z.number(),
  userAgent: z.string(),
  url: z.string(),
});

// Analytics events endpoint
router.post('/analytics', async (req, res) => {
  try {
    const event = analyticsEventSchema.parse(req.body);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event);
    }

    // In production, you would send to your analytics service
    // e.g., Google Analytics, Plausible, Mixpanel, etc.

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Invalid analytics event' });
  }
});

// Error reporting endpoint
router.post('/errors', async (req, res) => {
  try {
    const report = errorReportSchema.parse(req.body);

    // Log errors for monitoring
    console.error('[Client Error]', {
      message: report.message,
      stack: report.stack,
      context: report.context,
      url: report.url,
      timestamp: new Date(report.timestamp).toISOString(),
    });

    // In production, you would send to error tracking service
    // e.g., Sentry, Rollbar, etc.

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Invalid error report' });
  }
});

export default router;
