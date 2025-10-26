
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
router.post('/analytics', (req, res) => {
  // Immediately respond to prevent blocking
  res.json({ success: true });
  
  // Process analytics asynchronously (fire-and-forget)
  setImmediate(() => {
    try {
      const event = analyticsEventSchema.parse(req.body);
      
      // Log to console in development only (suppress in production for performance)
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics]', event.category, event.action, event.label);
      }
      
      // In production, you would send to your analytics service
      // e.g., Google Analytics, Plausible, Mixpanel, etc.
    } catch (error) {
      // Silently fail to not impact user experience
      if (process.env.NODE_ENV === 'development') {
        console.error('[Analytics] Processing error:', error);
      }
    }
  });
});

// Error reporting endpoint
router.post('/errors', (req, res) => {
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
      if (process.env.NODE_ENV === 'development') {
        console.error('[Error Reporting] Processing error:', error);
      }
    }
  });
});

export default router;
