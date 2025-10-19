
import { analytics } from './analytics';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

class PerformanceMonitoring {
  private metrics: Map<string, PerformanceMetric> = new Map();

  constructor() {
    this.observeWebVitals();
    this.observeResourceTiming();
  }

  private observeWebVitals() {
    // Largest Contentful Paint (LCP)
    this.observeLCP();

    // First Input Delay (FID)
    this.observeFID();

    // Cumulative Layout Shift (CLS)
    this.observeCLS();

    // Time to First Byte (TTFB)
    this.observeTTFB();
  }

  private observeLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;

      if (lastEntry) {
        const value = lastEntry.renderTime || lastEntry.loadTime;
        const rating = value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';

        this.recordMetric('LCP', value, rating);
        analytics.trackPerformance('LCP', value);
      }
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  }

  private observeFID() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry: any) => {
        const value = entry.processingStart - entry.startTime;
        const rating = value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';

        this.recordMetric('FID', value, rating);
        analytics.trackPerformance('FID', value);
      });
    });

    observer.observe({ type: 'first-input', buffered: true });
  }

  private observeCLS() {
    let clsValue = 0;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });

      const rating = clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor';

      this.recordMetric('CLS', clsValue, rating);
      analytics.trackPerformance('CLS', clsValue * 1000); // Convert to ms for consistency
    });

    observer.observe({ type: 'layout-shift', buffered: true });
  }

  private observeTTFB() {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as any;

    if (navigationEntry) {
      const value = navigationEntry.responseStart - navigationEntry.requestStart;
      const rating = value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';

      this.recordMetric('TTFB', value, rating);
      analytics.trackPerformance('TTFB', value);
    }
  }

  private observeResourceTiming() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry: any) => {
        if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
          const duration = entry.responseEnd - entry.requestStart;
          analytics.trackPerformance('API_Call', duration, entry.name);
        }
      });
    });

    observer.observe({ type: 'resource', buffered: true });
  }

  private recordMetric(name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor') {
    this.metrics.set(name, { name, value, rating });
  }

  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  getMetricsByRating() {
    const metrics = this.getMetrics();
    return {
      good: metrics.filter((m) => m.rating === 'good'),
      needsImprovement: metrics.filter((m) => m.rating === 'needs-improvement'),
      poor: metrics.filter((m) => m.rating === 'poor'),
    };
  }
}

export const performanceMonitoring = new PerformanceMonitoring();
