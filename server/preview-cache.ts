import { PDFStorage } from './object-storage';
import { computeVariablesHash } from './document-deduplication';

/**
 * Preview PDF Cache
 * 
 * Caches preview PDFs (not saved to documents table) for 1 hour
 * to avoid regenerating the same preview multiple times.
 * 
 * Uses in-memory cache with optional object storage fallback.
 */

interface CacheEntry {
  buffer: Buffer;
  timestamp: number;
  size: number;
}

interface PreviewCacheOptions {
  templateId: string;
  variables: Array<{ key: string; value: any }>;
  language: 'ar';
}

export class PreviewCache {
  private static cache = new Map<string, CacheEntry>();
  private static readonly TTL = 60 * 60 * 1000; // 1 hour
  private static readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB total
  private static currentCacheSize = 0;

  /**
   * Generate cache key for a preview
   */
  private static generateCacheKey(options: PreviewCacheOptions): string {
    const { templateId, variables, language } = options;
    const variablesHash = computeVariablesHash(variables);
    return `preview_${templateId}_${language}_${variablesHash}`;
  }

  /**
   * Get cached preview if available and not expired
   */
  static async get(options: PreviewCacheOptions): Promise<Buffer | null> {
    const cacheKey = this.generateCacheKey(options);
    
    // Check in-memory cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      
      if (age < this.TTL) {
        console.log(`📋 Preview cache HIT (age: ${Math.round(age / 1000)}s)`);
        return cached.buffer;
      } else {
        // Expired, remove from cache
        console.log(`⏰ Preview cache EXPIRED (age: ${Math.round(age / 1000)}s)`);
        this.currentCacheSize -= cached.size;
        this.cache.delete(cacheKey);
      }
    }
    
    // Try object storage fallback (optional)
    try {
      const storagePath = `previews/${cacheKey}.pdf`;
      const downloadResult = await PDFStorage.downloadPDF(storagePath);
      
      if (downloadResult.ok && downloadResult.data) {
        // Check if storage file is still fresh
        // For simplicity, we'll trust the in-memory cache expiry
        console.log(`💾 Preview retrieved from object storage`);
        
        // Warm up the in-memory cache
        this.set(options, downloadResult.data);
        
        return downloadResult.data;
      }
    } catch (error) {
      // Object storage miss is normal, continue
    }
    
    console.log(`❌ Preview cache MISS`);
    return null;
  }

  /**
   * Store preview in cache
   */
  static async set(options: PreviewCacheOptions, pdfBuffer: Buffer): Promise<void> {
    const cacheKey = this.generateCacheKey(options);
    const size = pdfBuffer.length;
    
    // Evict old entries if cache is too large
    if (this.currentCacheSize + size > this.MAX_CACHE_SIZE) {
      console.log(`🗑️ Cache size limit reached, evicting old entries...`);
      this.evictOldest();
    }
    
    // Store in memory
    this.cache.set(cacheKey, {
      buffer: pdfBuffer,
      timestamp: Date.now(),
      size
    });
    this.currentCacheSize += size;
    
    console.log(`💾 Preview cached (size: ${Math.round(size / 1024)}KB, total cache: ${Math.round(this.currentCacheSize / 1024)}KB)`);
    
    // Optionally store in object storage as backup
    try {
      const storagePath = `previews/${cacheKey}.pdf`;
      await PDFStorage.uploadPDF(pdfBuffer, storagePath, 'OTHER');
    } catch (error) {
      // Non-critical if object storage fails
      console.warn('⚠️ Failed to backup preview to object storage:', error);
    }
  }

  /**
   * Evict oldest cache entries to make room
   */
  private static evictOldest(): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 25% of entries
    const toRemove = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      const [key, entry] = entries[i];
      this.cache.delete(key);
      this.currentCacheSize -= entry.size;
    }
    
    console.log(`🗑️ Evicted ${toRemove} old cache entries`);
  }

  /**
   * Clear all expired entries
   */
  static clearExpired(): number {
    const now = Date.now();
    let cleared = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key);
        this.currentCacheSize -= entry.size;
        cleared++;
      }
    }
    
    if (cleared > 0) {
      console.log(`🗑️ Cleared ${cleared} expired preview cache entries`);
    }
    
    return cleared;
  }

  /**
   * Clear all cache entries
   */
  static clearAll(): void {
    const count = this.cache.size;
    this.cache.clear();
    this.currentCacheSize = 0;
    console.log(`🗑️ Cleared all ${count} preview cache entries`);
  }

  /**
   * Get cache statistics
   */
  static getStats(): {
    entries: number;
    sizeBytes: number;
    sizeMB: number;
    oldestEntryAge: number;
  } {
    let oldestTimestamp = Date.now();
    
    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    }
    
    return {
      entries: this.cache.size,
      sizeBytes: this.currentCacheSize,
      sizeMB: Math.round((this.currentCacheSize / (1024 * 1024)) * 100) / 100,
      oldestEntryAge: Math.round((Date.now() - oldestTimestamp) / 1000)
    };
  }
}

// Periodic cleanup of expired entries (every 15 minutes)
setInterval(() => {
  PreviewCache.clearExpired();
}, 15 * 60 * 1000);

