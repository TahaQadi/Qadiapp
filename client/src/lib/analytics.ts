import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

class Analytics {
  private enabled: boolean = false;
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;

  constructor() {
    // Check if analytics should be enabled (e.g., not in development)
    this.enabled = import.meta.env.PROD;
  }

  // Track page views
  trackPageView(path: string, title?: string) {
    if (!this.enabled) return;

    // You can integrate with Google Analytics, Plausible, etc.

    // Example: Send to your analytics backend
    this.sendEvent({
      category: 'pageview',
      action: path,
      label: title,
    });
  }

  // Track custom events
  trackEvent(event: AnalyticsEvent) {
    if (!this.enabled) return;

    this.sendEvent(event);
  }

  // Track user actions
  trackAction(action: string, category: string, label?: string, value?: number) {
    this.trackEvent({ category, action, label, value });
  }

  // Track errors
  trackError(error: Error, context?: string) {
    this.trackEvent({
      category: 'error',
      action: error.name,
      label: `${context ? context + ': ' : ''}${error.message}`,
    });
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, label?: string) {
    this.trackEvent({
      category: 'performance',
      action: metric,
      label,
      value: Math.round(value),
    });
  }

  // Track user interactions
  trackInteraction(element: string, action: string, value?: number) {
    this.trackEvent({
      category: 'interaction',
      action,
      label: element,
      value,
    });
  }

  private async sendEvent(event: AnalyticsEvent) {
    if (!this.enabled) return;

    // Add to queue
    this.eventQueue.push(event);

    // Clear existing timeout
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }

    // Flush queue after 2 seconds or when it reaches 10 events
    if (this.eventQueue.length >= 10) {
      this.flushEvents();
    } else {
      this.flushTimeout = setTimeout(() => this.flushEvents(), 2000);
    }
  }

  private async flushEvents() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Send events in batch (but send only the last event for simplicity)
      // In production, you'd batch all events
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(events[events.length - 1]),
        // Don't wait for response
        keepalive: true,
      });
    } catch (error) {
      // Silently fail - analytics should never break the app
      if (process.env.NODE_ENV === 'development') {
        console.error('[Analytics] Failed to send events:', error);
      }
    }
  }

  // Flush queued events when back online
  flushQueue() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    events.forEach((event) => this.sendEvent(event));
  }
}

export const analytics = new Analytics();

// Hook for tracking page views
export function usePageTracking() {
  const [location] = useLocation();

  useEffect(() => {
    analytics.trackPageView(location, document.title);
  }, [location]);
}

// Hook for tracking component mount/unmount
export function useComponentTracking(componentName: string) {
  useEffect(() => {
    analytics.trackEvent({
      category: 'component',
      action: 'mount',
      label: componentName,
    });

    return () => {
      analytics.trackEvent({
        category: 'component',
        action: 'unmount',
        label: componentName,
      });
    };
  }, [componentName]);
}