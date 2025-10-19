
# Production Monitoring & Analytics

This document outlines the monitoring, analytics, and security features implemented in the application.

## Analytics Tracking

### Features
- **Page View Tracking**: Automatically tracks navigation
- **Custom Events**: Track user interactions and business metrics
- **Performance Metrics**: Core Web Vitals (LCP, FID, CLS, TTFB)
- **Error Tracking**: Automatic error capture and reporting
- **Offline Support**: Queues events when offline

### Usage

```typescript
import { analytics } from '@/lib/analytics';

// Track custom event
analytics.trackEvent({
  category: 'order',
  action: 'submit',
  label: 'quick-order',
  value: 150.00
});

// Track user action
analytics.trackAction('button_click', 'navigation', 'view_cart');

// Track error
analytics.trackError(error, 'checkout-process');
```

### Page Tracking Hook

```typescript
import { usePageTracking } from '@/lib/analytics';

function App() {
  usePageTracking(); // Automatically tracks page views
  // ...
}
```

## Error Monitoring

### Features
- **Global Error Handler**: Catches unhandled errors
- **Promise Rejection Handler**: Catches unhandled promise rejections
- **Context Tracking**: Associates errors with components and actions
- **Error Queue**: Prevents overwhelming the server
- **Automatic Reporting**: Sends errors to backend

### Usage

```typescript
import { errorMonitoring } from '@/lib/errorMonitoring';

try {
  // risky operation
} catch (error) {
  errorMonitoring.captureError(error, {
    component: 'OrderForm',
    action: 'submit',
    metadata: { orderId: '123' }
  });
}
```

## Performance Monitoring

### Core Web Vitals Tracked

1. **LCP (Largest Contentful Paint)**: Measures loading performance
   - Good: ≤ 2.5s
   - Needs Improvement: 2.5s - 4.0s
   - Poor: > 4.0s

2. **FID (First Input Delay)**: Measures interactivity
   - Good: ≤ 100ms
   - Needs Improvement: 100ms - 300ms
   - Poor: > 300ms

3. **CLS (Cumulative Layout Shift)**: Measures visual stability
   - Good: ≤ 0.1
   - Needs Improvement: 0.1 - 0.25
   - Poor: > 0.25

4. **TTFB (Time to First Byte)**: Measures server response time
   - Good: ≤ 800ms
   - Needs Improvement: 800ms - 1800ms
   - Poor: > 1800ms

### Usage

```typescript
import { performanceMonitoring } from '@/lib/performanceMonitoring';

// Get all metrics
const metrics = performanceMonitoring.getMetrics();

// Get metrics by rating
const { good, needsImprovement, poor } = performanceMonitoring.getMetricsByRating();
```

## Security Audit

### Security Checks

1. **HTTPS**: Verifies secure connection
2. **CSP (Content Security Policy)**: Checks for CSP headers
3. **Cookie Security**: Validates secure cookie flags
4. **XSS Protection**: Detects inline scripts
5. **Clickjacking Protection**: Checks X-Frame-Options
6. **Mixed Content**: Identifies insecure resources

### Usage

```typescript
import { securityAudit } from '@/lib/securityAudit';

// Get security score
const score = securityAudit.getSecurityScore(); // 0-100

// Get failed checks
const failed = securityAudit.getFailedChecks();

// Print report to console
securityAudit.printReport();
```

## Server-Side Endpoints

### Analytics Endpoint
```
POST /api/analytics
```

Accepts analytics events from the client.

### Error Reporting Endpoint
```
POST /api/errors
```

Receives error reports from the client.

## Integration with Third-Party Services

### Google Analytics (Example)

Add to `client/index.html`:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

Update `analytics.ts`:

```typescript
private sendEvent(event: AnalyticsEvent) {
  if (window.gtag) {
    window.gtag('event', event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
    });
  }
}
```

### Sentry (Error Tracking)

```bash
npm install @sentry/react
```

Update `errorMonitoring.ts`:

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: import.meta.env.MODE,
});
```

## Production Checklist

- [ ] Configure analytics service (Google Analytics, Plausible, etc.)
- [ ] Set up error tracking (Sentry, Rollbar, etc.)
- [ ] Enable HTTPS in production
- [ ] Configure CSP headers
- [ ] Set secure cookie flags
- [ ] Remove console.logs from production code
- [ ] Monitor Core Web Vitals regularly
- [ ] Review security audit results
- [ ] Set up automated performance testing
- [ ] Configure error alerting

## Best Practices

1. **Privacy**: Ensure compliance with GDPR/CCPA
2. **Performance**: Monitor bundle size and loading times
3. **Security**: Regular security audits
4. **Errors**: Set up alerting for critical errors
5. **Analytics**: Define KPIs and track them consistently
