/**
 * Monitoring and Metrics Routes
 * Admin-only endpoints for system monitoring
 */

import { Router, Request, Response } from 'express';
import { requireAdmin } from './auth';
import { createSuccessResponse } from '@shared/api-types';
import { 
  getPerformanceStats, 
  getPerformanceMetrics, 
  clearPerformanceMetrics 
} from './performance-monitoring';
import { cacheManager } from './caching';
import { businessMetrics } from './business-metrics';
import { auditLogger } from './audit-logging';

const router = Router();

/**
 * Get performance statistics
 */
router.get('/performance/stats', requireAdmin, (req, res) => {
  const stats = getPerformanceStats();
  res.json(createSuccessResponse(stats));
});

/**
 * Get performance metrics
 */
router.get('/performance/metrics', requireAdmin, (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
  const metrics = getPerformanceMetrics(limit);
  res.json(createSuccessResponse(metrics));
});

/**
 * Clear performance metrics
 */
router.delete('/performance/metrics', requireAdmin, (req, res) => {
  clearPerformanceMetrics();
  res.json(createSuccessResponse({ message: 'Performance metrics cleared' }));
});

/**
 * Get cache statistics
 */
router.get('/cache/stats', requireAdmin, (req, res) => {
  const stats = cacheManager.getStats();
  res.json(createSuccessResponse(stats));
});

/**
 * Clear cache
 */
router.delete('/cache', requireAdmin, (req, res) => {
  cacheManager.clear();
  res.json(createSuccessResponse({ message: 'Cache cleared' }));
});

/**
 * Get business metrics
 */
router.get('/business/metrics', requireAdmin, (req, res) => {
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
  
  const metrics = businessMetrics.getMetrics(startDate, endDate);
  res.json(createSuccessResponse(metrics));
});

/**
 * Get recent business events
 */
router.get('/business/events', requireAdmin, (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
  const events = businessMetrics.getRecentEvents(limit);
  res.json(createSuccessResponse(events));
});

/**
 * Get audit logs
 */
router.get('/audit/logs', requireAdmin, (req, res) => {
  const filters = {
    userId: req.query.userId as string | undefined,
    action: req.query.action as string | undefined,
    resource: req.query.resource as string | undefined,
    startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
    endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
  };
  
  const logs = auditLogger.getLogs(filters);
  res.json(createSuccessResponse(logs));
});

/**
 * Get resource history
 */
router.get('/audit/resource/:resource/:resourceId', requireAdmin, (req, res) => {
  const { resource, resourceId } = req.params;
  const history = auditLogger.getResourceHistory(resource, resourceId);
  res.json(createSuccessResponse(history));
});

/**
 * Get system health
 */
router.get('/health', requireAdmin, (req, res) => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  const health = {
    status: 'healthy',
    uptime: Math.floor(uptime),
    memory: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
    },
    cache: cacheManager.getStats(),
    performance: getPerformanceStats(),
  };
  
  res.json(createSuccessResponse(health));
});

export default router;
