# Phase 3 & 4 Implementation Guide

## Overview

This document covers the implementation of Phase 3 (Performance & Monitoring) and Phase 4 (Enhanced Security) improvements to the LTA contract fulfillment application.

## Phase 3: Performance Optimization & Monitoring

### 1. Performance Monitoring (`server/performance-monitoring.ts`)

**Purpose**: Track API endpoint performance metrics including response times, sizes, and status codes.

**Features**:
- Automatic tracking of all API requests
- In-memory storage of last 1000 metrics
- Slow request detection (> 1 second)
- Per-endpoint statistics (average duration, max duration, error count)
- Real-time performance insights

**Usage**:
```typescript
import { performanceMonitoringMiddleware } from './performance-monitoring';

// Applied globally in server/index.ts
app.use(performanceMonitoringMiddleware);
```

**Metrics Collected**:
- Endpoint path and HTTP method
- Status code
- Response time (milliseconds)
- Response size (bytes)
- Timestamp
- User ID (if authenticated)

**Admin Endpoints**:
- `GET /api/monitoring/performance/stats` - Get aggregated statistics
- `GET /api/monitoring/performance/metrics?limit=100` - Get raw metrics
- `DELETE /api/monitoring/performance/metrics` - Clear metrics

### 2. Caching Layer (`server/caching.ts`)

**Purpose**: In-memory caching for frequently accessed data to reduce database load.

**Features**:
- TTL-based cache expiration
- Pattern-based cache invalidation
- Automatic cleanup of expired entries
- Cache hit/miss headers
- Memory usage tracking

**Usage**:
```typescript
import { cacheMiddleware, CacheTTL, invalidateResourceCache } from './caching';

// Apply caching to specific routes
router.get('/products', 
  cacheMiddleware(CacheTTL.MEDIUM), // 5 minutes
  handler
);

// Invalidate cache after mutations
router.post('/products', async (req, res) => {
  const product = await createProduct(req.body);
  invalidateResourceCache('products'); // Clears all /api/products/* cache
  res.json(product);
});
```

**Cache TTLs**:
- `SHORT`: 1 minute - For frequently changing data
- `MEDIUM`: 5 minutes - Default for most endpoints
- `LONG`: 15 minutes - For semi-static data
- `VERY_LONG`: 1 hour - For static data (categories, vendors)

**Admin Endpoints**:
- `GET /api/monitoring/cache/stats` - Get cache statistics
- `DELETE /api/monitoring/cache` - Clear entire cache

### 3. Business Metrics Collection (`server/business-metrics.ts`)

**Purpose**: Track important business KPIs and events for analytics.

**Features**:
- Event tracking with metadata
- Time-range filtering
- User activity tracking
- Event type aggregation

**Usage**:
```typescript
import { trackEvent, MetricType } from './business-metrics';

// Track business events
trackEvent(MetricType.ORDER_CREATED, userId, { orderId, total: 5000 });
trackEvent(MetricType.PRICE_OFFER_ACCEPTED, userId, { offerId });
trackEvent(MetricType.PRODUCT_VIEWED, userId, { productId });
```

**Tracked Events**:
- User actions (login, logout, registration)
- Product actions (view, create, update, delete)
- Order lifecycle (created, submitted, approved, rejected)
- Price requests and offers
- LTA management
- Template usage

**Admin Endpoints**:
- `GET /api/monitoring/business/metrics?startDate=2024-01-01&endDate=2024-12-31` - Get metrics for date range
- `GET /api/monitoring/business/events?limit=100` - Get recent events

### 4. Frontend Performance Optimization

**Query Client Improvements** (`client/src/lib/queryClient.ts`):

Enhanced retry logic with intelligent backoff:
```typescript
// Retry configuration
retry: (failureCount, error: any) => {
  const errorMessage = error?.message || '';
  
  // Retry rate limit errors (429) up to 3 times
  if (errorMessage.includes('429')) {
    return failureCount < 3;
  }
  
  // Don't retry client errors (4xx)
  if (errorMessage.match(/4\d\d/)) {
    return false;
  }
  
  // Retry server errors (5xx) up to 3 times
  if (errorMessage.match(/5\d\d/)) {
    return failureCount < 3;
  }
  
  return failureCount < 2;
},

// Exponential backoff with rate limit awareness
retryDelay: (attemptIndex, error: any) => {
  const errorMessage = error?.message || '';
  
  // For rate limit errors, use Retry-After header
  if (errorMessage.includes('429')) {
    const retryAfterMatch = errorMessage.match(/retry.*?(\d+)/i);
    if (retryAfterMatch) {
      return parseInt(retryAfterMatch[1]) * 1000;
    }
  }
  
  // Exponential backoff: 1s, 2s, 4s, 8s, capped at 30s
  return Math.min(1000 * 2 ** attemptIndex, 30000);
}
```

**Cache Strategies** by data type:
- Products: 15 min stale time, 30 min gc
- Categories/Vendors: 30 min stale time, 1 hour gc
- Clients: 5 min stale time, 10 min gc
- Orders: 1 min stale time, refetch on focus
- Notifications: 30 sec stale time

## Phase 4: Enhanced Security

### 1. Rate Limiting (`server/rate-limiting.ts`)

**Purpose**: Prevent API abuse by limiting request rates per user/IP.

**Features**:
- Configurable time windows and limits
- Per-user and per-IP limiting
- Rate limit headers (X-RateLimit-*)
- Retry-After header for 429 responses
- Skip successful/failed requests option

**Usage**:
```typescript
import { rateLimit, RateLimitPresets } from './rate-limiting';

// Apply to authentication routes
app.use('/api/auth/', rateLimit(RateLimitPresets.AUTH)); // 5 req/15min

// Apply to general API routes
app.use('/api/', rateLimit(RateLimitPresets.API)); // 100 req/15min

// Custom rate limit
app.use('/api/expensive-operation', rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
}));
```

**Presets**:
- `AUTH`: 5 requests per 15 minutes (strict for login/auth endpoints)
- `API`: 100 requests per 15 minutes (moderate for general API)
- `PUBLIC`: 300 requests per 15 minutes (lenient for public endpoints)
- `EXPENSIVE`: 10 requests per hour (very strict for expensive operations)

**Response Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000000
Retry-After: 60
```

### 2. Security Headers (`server/security-headers.ts`)

**Purpose**: Add security headers to protect against common vulnerabilities.

**Headers Implemented**:

1. **CORS**: Cross-Origin Resource Sharing
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
   Access-Control-Allow-Credentials: true
   ```

2. **CSP**: Content Security Policy
   ```
   Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ...
   ```

3. **HSTS**: HTTP Strict Transport Security
   ```
   Strict-Transport-Security: max-age=31536000; includeSubDomains
   ```

4. **X-Frame-Options**: Prevent clickjacking
   ```
   X-Frame-Options: SAMEORIGIN
   ```

5. **X-Content-Type-Options**: Prevent MIME sniffing
   ```
   X-Content-Type-Options: nosniff
   ```

6. **X-XSS-Protection**: XSS protection (legacy but useful)
   ```
   X-XSS-Protection: 1; mode=block
   ```

7. **Referrer-Policy**: Control referrer information
   ```
   Referrer-Policy: strict-origin-when-cross-origin
   ```

**Presets**:
- `DEVELOPMENT`: Lenient (CSP disabled, allow all origins)
- `PRODUCTION`: Strict (all security headers enabled)

### 3. Audit Logging (`server/audit-logging.ts`)

**Purpose**: Track critical operations for security, compliance, and debugging.

**Features**:
- Automatic logging with metadata
- User tracking (ID, username, IP, user agent)
- Resource history tracking
- Change tracking
- Time-based filtering

**Usage**:
```typescript
import { createAuditLog, AuditAction, AuditResource } from './audit-logging';

// Log admin actions
router.post('/products', requireAdmin, async (req, res) => {
  const product = await storage.createProduct(req.body);
  
  createAuditLog(
    req,
    AuditAction.PRODUCT_CREATED,
    AuditResource.PRODUCT,
    product.id,
    { product } // changes/metadata
  );
  
  res.json(product);
});

// Log updates with before/after
router.patch('/products/:id', requireAdmin, async (req, res) => {
  const before = await storage.getProduct(req.params.id);
  const after = await storage.updateProduct(req.params.id, req.body);
  
  createAuditLog(
    req,
    AuditAction.PRODUCT_UPDATED,
    AuditResource.PRODUCT,
    req.params.id,
    { before, after }
  );
  
  res.json(after);
});
```

**Logged Information**:
- Timestamp
- User ID and username
- Action type
- Resource type and ID
- HTTP method and path
- IP address and user agent
- Changes (before/after)
- Custom metadata

**Admin Endpoints**:
- `GET /api/monitoring/audit/logs?action=PRODUCT_CREATED&limit=50` - Get filtered logs
- `GET /api/monitoring/audit/resource/product/:productId` - Get resource history

## Monitoring Dashboard (Admin-Only)

All monitoring endpoints are protected by `requireAdmin` middleware and mounted at `/api/monitoring/*`:

### Available Endpoints

**Performance**:
- `GET /api/monitoring/performance/stats` - Aggregated performance statistics
- `GET /api/monitoring/performance/metrics?limit=100` - Raw performance metrics
- `DELETE /api/monitoring/performance/metrics` - Clear metrics

**Caching**:
- `GET /api/monitoring/cache/stats` - Cache statistics (hit rate, memory usage)
- `DELETE /api/monitoring/cache` - Clear entire cache

**Business Metrics**:
- `GET /api/monitoring/business/metrics?startDate=&endDate=` - Business metrics for date range
- `GET /api/monitoring/business/events?limit=100` - Recent business events

**Audit Logs**:
- `GET /api/monitoring/audit/logs?userId=&action=&resource=&limit=` - Filtered audit logs
- `GET /api/monitoring/audit/resource/:resource/:resourceId` - Resource history

**System Health**:
- `GET /api/monitoring/health` - Overall system health (memory, uptime, cache, performance)

### Example Health Response

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 3600,
    "memory": {
      "heapUsed": 45,
      "heapTotal": 78,
      "rss": 120
    },
    "cache": {
      "totalEntries": 234,
      "validEntries": 200,
      "expiredEntries": 34,
      "memoryUsage": 47185920
    },
    "performance": {
      "totalRequests": 5432,
      "avgDuration": 45,
      "maxDuration": 1200,
      "minDuration": 2,
      "endpointStats": {
        "GET /api/products": {
          "count": 1234,
          "avgDuration": 35,
          "maxDuration": 200,
          "errors": 2
        }
      }
    }
  }
}
```

## Integration Points

### Server Setup (`server/index.ts`)

```typescript
import { performanceMonitoringMiddleware } from './performance-monitoring';
import { securityHeaders, SecurityPresets } from './security-headers';
import { rateLimit, RateLimitPresets } from './rate-limiting';
import monitoringRoutes from './monitoring-routes';

const isDev = app.get("env") === "development";

// Apply middlewares in order
app.use(securityHeaders(isDev ? SecurityPresets.DEVELOPMENT : SecurityPresets.PRODUCTION));
app.use(performanceMonitoringMiddleware);
app.use(express.json());

// Rate limiting (disabled in development)
if (!isDev) {
  app.use('/api/', rateLimit(RateLimitPresets.API));
}

// ... register routes ...

// Monitoring routes
app.use('/api/monitoring', monitoringRoutes);
```

### Route Example with All Features

```typescript
import { cacheMiddleware, CacheTTL, invalidateResourceCache } from './caching';
import { trackEvent, MetricType } from './business-metrics';
import { createAuditLog, AuditAction, AuditResource } from './audit-logging';

// GET with caching
router.get('/products',
  cacheMiddleware(CacheTTL.MEDIUM), // 5 minute cache
  async (req, res) => {
    const products = await storage.getProducts();
    res.json(createSuccessResponse(products));
  }
);

// POST with metrics, audit log, and cache invalidation
router.post('/products',
  requireAdmin,
  validateBody(createProductSchema),
  async (req, res) => {
    const product = await storage.createProduct(req.body);
    
    // Track business event
    trackEvent(MetricType.PRODUCT_CREATED, req.user.id, { productId: product.id });
    
    // Audit log
    createAuditLog(req, AuditAction.PRODUCT_CREATED, AuditResource.PRODUCT, product.id, { product });
    
    // Invalidate cache
    invalidateResourceCache('products');
    
    res.status(201).json(createSuccessResponse(product));
  }
);
```

## Benefits

### Phase 3 Benefits:
✅ **Performance Insights**: Identify slow endpoints and optimize
✅ **Reduced Database Load**: Caching frequently accessed data
✅ **Business Analytics**: Track user behavior and system usage
✅ **Proactive Monitoring**: Detect issues before users report them
✅ **Better UX**: Faster response times with intelligent caching and retry logic

### Phase 4 Benefits:
✅ **Abuse Prevention**: Rate limiting protects against DoS and brute force
✅ **Vulnerability Protection**: Security headers protect against XSS, clickjacking, MIME sniffing
✅ **Compliance**: Audit logs provide trail for security and compliance
✅ **Accountability**: Track who did what and when
✅ **Debugging**: Audit logs help troubleshoot issues and understand system state

## Migration Checklist

### For Existing Routes:

- [ ] Add caching middleware to GET endpoints for frequently accessed data
- [ ] Invalidate cache after mutations (POST/PATCH/DELETE)
- [ ] Track important business events with `trackEvent()`
- [ ] Add audit logging for critical operations (create/update/delete)
- [ ] Use rate limiting for expensive operations
- [ ] Test retry logic for transient failures

### For New Routes:

- [ ] Consider caching strategy (TTL based on data volatility)
- [ ] Add business metrics tracking
- [ ] Implement audit logging for admin actions
- [ ] Apply appropriate rate limits
- [ ] Return standardized ApiResponse format
- [ ] Use validation middleware

## Performance Considerations

1. **Memory Usage**: In-memory caching and metrics storage uses heap memory. Monitor with `/api/monitoring/health`.

2. **Cache Invalidation**: Invalidate cache strategically to balance freshness and performance.

3. **Metrics Retention**: Limited to last 1000 performance metrics and 5000 business events in memory.

4. **Audit Log Cleanup**: Consider implementing periodic cleanup for old audit logs (90+ days).

## Future Enhancements

- [ ] Persistent storage for metrics (database or time-series DB)
- [ ] Real-time dashboard for monitoring metrics
- [ ] Alert system for slow requests or high error rates
- [ ] Redis cache for distributed caching
- [ ] WebSocket for real-time business metrics
- [ ] Export audit logs to external systems
- [ ] Advanced analytics and reporting
- [ ] Automated performance regression detection

## Conclusion

Phases 3 & 4 provide a solid foundation for monitoring, performance optimization, and security. The system now has:

- Comprehensive performance monitoring
- Intelligent caching layer
- Business analytics tracking
- Rate limiting protection
- Enhanced security headers
- Complete audit trail

These improvements ensure the application is fast, secure, and maintainable for production use.
