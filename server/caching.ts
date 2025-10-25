/**
 * Caching Layer
 * In-memory caching for frequently accessed data
 */

import { Request, Response, NextFunction } from 'express';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * Set a cache entry
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get a cache entry
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if a key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Invalidate a specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all keys matching a pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    
    for (const key of Array.from(this.cache.keys())) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();
    
    const validEntries = entries.filter(([_, entry]) => {
      return (now - entry.timestamp) <= entry.ttl;
    });

    return {
      totalEntries: this.cache.size,
      validEntries: validEntries.length,
      expiredEntries: this.cache.size - validEntries.length,
      memoryUsage: process.memoryUsage().heapUsed,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheManager = new CacheManager();

// Run cleanup every 5 minutes
setInterval(() => {
  cacheManager.cleanup();
}, 5 * 60 * 1000);

/**
 * Cache middleware factory
 * Caches GET requests based on URL and query parameters
 */
export function cacheMiddleware(ttl: number = 5 * 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from URL and query params
    const cacheKey = `${req.path}:${JSON.stringify(req.query)}:${(req as any).user?.id || 'anon'}`;
    
    // Check cache
    const cachedData = cacheManager.get(cacheKey);
    
    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedData);
    }

    // Store original json function
    const originalJson = res.json.bind(res);

    // Override json function to cache response
    res.json = function(data: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheManager.set(cacheKey, data, ttl);
      }
      
      res.setHeader('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
}

/**
 * Helper to invalidate cache for a resource
 */
export function invalidateResourceCache(resource: string) {
  cacheManager.invalidatePattern(new RegExp(`^/api/${resource}`));
}

/**
 * Common cache TTLs
 */
export const CacheTTL = {
  SHORT: 1 * 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 15 * 60 * 1000,      // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
} as const;
