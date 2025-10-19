
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
  private queue: AnalyticsEvent[] = [];

  constructor() {
    // Check if analytics should be enabled (e.g., not in development)
    this.enabled = import.meta.env.PROD;
  }

  // Track page views
  trackPageView(path: string, title?: string) {
    if (!this.enabled) return;

    // You can integrate with Google Analytics, Plausible, etc.
    console.log('[Analytics] Page View:', { path, title });

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

    console.log('[Analytics] Event:', event);
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

  private sendEvent(event: AnalyticsEvent) {
    // Queue events if offline
    if (!navigator.onLine) {
      this.queue.push(event);
      return;
    }

    // Send to your analytics endpoint
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }).catch((error) => {
      console.error('[Analytics] Failed to send event:', error);
      this.queue.push(event);
    });
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
