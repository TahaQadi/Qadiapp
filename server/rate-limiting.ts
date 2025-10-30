/**
 * Rate Limiting Middleware
 * Prevents API abuse by limiting request rates
 */

import { Request, Response, NextFunction } from 'express';
import { ErrorCode, createErrorResponse } from '@shared/api-types';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  /**
   * Check if request should be allowed
   */
  checkLimit(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      // New window
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (entry.count >= maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string, maxRequests: number): number {
    const entry = this.limits.get(key);

    if (!entry || Date.now() > entry.resetTime) {
      return maxRequests;
    }

    return Math.max(0, maxRequests - entry.count);
  }

  /**
   * Get reset time for a key
   */
  getResetTime(key: string): number | null {
    const entry = this.limits.get(key);

    if (!entry || Date.now() > entry.resetTime) {
      return null;
    }

    return entry.resetTime;
  }

  /**
   * Clean up expired entries
   */
  private cleanup() {
    const now = Date.now();

    for (const [key, entry] of Array.from(this.limits.entries())) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Clear all limits
   */
  clear() {
    this.limits.clear();
  }

  /**
   * Destroy rate limiter
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

export const rateLimiter = new RateLimiter();

export interface RateLimitOptions {
  windowMs?: number;        // Time window in milliseconds (default: 15 minutes)
  max?: number;             // Max requests per window (default: 100)
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean;        // Don't count successful requests
  skipFailedRequests?: boolean;            // Don't count failed requests
}

/**
 * Rate limiting middleware factory
 */
export function rateLimit(options: RateLimitOptions = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    keyGenerator = (req) => {
      // Default: use IP address and user ID if available
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const userId = (req as any).user?.id;
      return userId ? `user:${userId}` : `ip:${ip}`;
    },
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting for internal routes or health checks
    if (req.path.startsWith('/internal') || req.path === '/health') {
      return next();
    }

    const key = keyGenerator(req);

    // Check rate limit
    const allowed = rateLimiter.checkLimit(key, max, windowMs);

    if (!allowed) {
      const resetTime = rateLimiter.getResetTime(key);
      const retryAfter = resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 60;

      res.setHeader('Retry-After', retryAfter.toString());
      res.setHeader('X-RateLimit-Limit', max.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', resetTime?.toString() || '');

      return res.status(429).json(
        createErrorResponse(
          ErrorCode.RATE_LIMIT_EXCEEDED,
          `Too many requests. Please try again in ${retryAfter} seconds.`,
          `طلبات كثيرة جداً. يرجى المحاولة مرة أخرى بعد ${retryAfter} ثانية.`
        )
      );
    }

    // Add rate limit headers
    const remaining = rateLimiter.getRemaining(key, max);
    const resetTime = rateLimiter.getResetTime(key);

    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    if (resetTime) {
      res.setHeader('X-RateLimit-Reset', resetTime.toString());
    }

    // Handle skip options
    if (skipSuccessfulRequests || skipFailedRequests) {
      const originalSend = res.send;
      res.send = function (body?: any): Response {
        const statusCode = res.statusCode;

        if (
          (skipSuccessfulRequests && statusCode >= 200 && statusCode < 300) ||
          (skipFailedRequests && statusCode >= 400)
        ) {
          // Decrement counter
          const entry = rateLimiter['limits'].get(key);
          if (entry) {
            entry.count = Math.max(0, entry.count - 1);
          }
        }

        return originalSend.call(this, body);
      };
    }

    next();
  };
}

/**
 * Preset rate limit configurations
 */
export const RateLimitPresets = {
  /**
   * Strict rate limit for authentication endpoints (5 requests per 15 minutes)
   */
  AUTH: {
    windowMs: 15 * 60 * 1000,
    max: 5,
  },

  /**
   * Moderate rate limit for API endpoints (500 requests per 15 minutes in production)
   */
  API: {
    windowMs: 15 * 60 * 1000,
    max: 500, // increased from 100 for production
  },

  /**
   * Lenient rate limit for public endpoints (300 requests per 15 minutes)
   */
  PUBLIC: {
    windowMs: 15 * 60 * 1000,
    max: 300,
  },

  /**
   * Very strict rate limit for expensive operations (10 requests per hour)
   */
  EXPENSIVE: {
    windowMs: 60 * 60 * 1000,
    max: 10,
  },
} as const;