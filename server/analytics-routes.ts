
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
    // Immediately respond to prevent blocking
    res.json({ success: true });
    
    // Process analytics asynchronously (fire-and-forget)
    setImmediate(() => {
      try {
        const event = analyticsEventSchema.parse(req.body);
        
        // Log to console in development only
        if (process.env.NODE_ENV === 'development') {
          console.log('[Analytics]', event.category, event.action, event.label);
        }
        
        // In production, you would send to your analytics service
        // e.g., Google Analytics, Plausible, Mixpanel, etc.
      } catch (error) {
        // Silently fail to not impact user experience
        console.error('[Analytics] Processing error:', error);
      }
    });
  } catch (error) {
    // Even if parsing fails initially, respond quickly
    res.status(400).json({ error: 'Invalid analytics event' });
  }
});

// Error reporting endpoint
router.post('/errors', async (req, res) => {
  try {
    // Immediately respond to prevent blocking
    res.json({ success: true });
    
    // Process error reporting asynchronously
    setImmediate(() => {
      try {
        const report = errorReportSchema.parse(req.body);
        
        // Log errors for monitoring (truncate for performance)
        console.error('[Client Error]', {
          message: report.message,
          stack: report.stack?.substring(0, 500), // Truncate stack trace
          url: report.url,
          timestamp: new Date(report.timestamp).toISOString(),
        });
        
        // In production, you would send to error tracking service
        // e.g., Sentry, Rollbar, etc.
      } catch (error) {
        console.error('[Error Reporting] Processing error:', error);
      }
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid error report' });
  }
});

export default router;
