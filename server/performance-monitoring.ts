/**
 * Performance Monitoring Middleware
 * Tracks API endpoint performance metrics (timing, response sizes, status codes)
 */

import { Request, Response, NextFunction } from 'express';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  responseSize: number;
  timestamp: Date;
  userId?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics in memory

  addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow requests (> 2 seconds for production, > 1 second for development)
    const threshold = process.env.NODE_ENV === 'production' ? 2000 : 1000;
    if (metric.duration > threshold) {
      console.warn(`[SLOW REQUEST] ${metric.method} ${metric.endpoint} took ${metric.duration}ms`);
    }
  }

  getMetrics() {
    return this.metrics;
  }

  getStats() {
    if (this.metrics.length === 0) {
      return null;
    }

    const durations = this.metrics.map(m => m.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    // Group by endpoint
    const endpointStats = this.metrics.reduce((acc, metric) => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!acc[key]) {
        acc[key] = {
          count: 0,
          totalDuration: 0,
          avgDuration: 0,
          maxDuration: 0,
          errors: 0,
        };
      }
      acc[key].count++;
      acc[key].totalDuration += metric.duration;
      acc[key].avgDuration = acc[key].totalDuration / acc[key].count;
      acc[key].maxDuration = Math.max(acc[key].maxDuration, metric.duration);
      if (metric.statusCode >= 400) {
        acc[key].errors++;
      }
      return acc;
    }, {} as Record<string, any>);

    return {
      totalRequests: this.metrics.length,
      avgDuration: Math.round(avgDuration),
      maxDuration,
      minDuration,
      timeRange: {
        start: this.metrics[0]?.timestamp,
        end: this.metrics[this.metrics.length - 1]?.timestamp,
      },
      endpointStats,
    };
  }

  clearMetrics() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Express middleware to track API performance
 */
export function performanceMonitoringMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const originalSend = res.send;

  // Track response size
  let responseSize = 0;

  res.send = function (body?: any): Response {
    if (body) {
      responseSize = typeof body === 'string' ? Buffer.byteLength(body) : JSON.stringify(body).length;
    }
    return originalSend.call(this, body);
  };

  // When response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    performanceMonitor.addMetric({
      endpoint: req.path,
      method: req.method,
      statusCode: res.statusCode,
      duration,
      responseSize,
      timestamp: new Date(),
      userId: (req as any).user?.id,
    });
  });

  next();
}

/**
 * Get performance statistics endpoint
 */
export function getPerformanceStats() {
  return performanceMonitor.getStats();
}

/**
 * Get raw metrics endpoint
 */
export function getPerformanceMetrics(limit?: number) {
  const metrics = performanceMonitor.getMetrics();
  return limit ? metrics.slice(-limit) : metrics;
}

/**
 * Clear metrics endpoint
 */
export function clearPerformanceMetrics() {
  performanceMonitor.clearMetrics();
}
