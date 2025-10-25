/**
 * Business Metrics Collection
 * Tracks important business KPIs and metrics
 */

interface MetricEvent {
  type: string;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

class BusinessMetrics {
  private events: MetricEvent[] = [];
  private readonly maxEvents = 5000;

  /**
   * Track a business event
   */
  track(type: string, userId?: string, metadata?: Record<string, any>) {
    this.events.push({
      type,
      timestamp: new Date(),
      userId,
      metadata,
    });

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  /**
   * Get metrics for a specific time range
   */
  getMetrics(startDate?: Date, endDate?: Date) {
    let filtered = this.events;

    if (startDate) {
      filtered = filtered.filter(e => e.timestamp >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(e => e.timestamp <= endDate);
    }

    return this.calculateMetrics(filtered);
  }

  /**
   * Calculate business metrics from events
   */
  private calculateMetrics(events: MetricEvent[]) {
    const byType = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const uniqueUsers = new Set(events.filter(e => e.userId).map(e => e.userId)).size;

    return {
      totalEvents: events.length,
      uniqueUsers,
      eventsByType: byType,
      timeRange: {
        start: events[0]?.timestamp,
        end: events[events.length - 1]?.timestamp,
      },
    };
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 100) {
    return this.events.slice(-limit);
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.events = [];
  }
}

export const businessMetrics = new BusinessMetrics();

/**
 * Common business event types
 */
export const MetricType = {
  // User events
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_CREATED: 'user.created',

  // Product events
  PRODUCT_VIEWED: 'product.viewed',
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',

  // Order events
  ORDER_CREATED: 'order.created',
  ORDER_SUBMITTED: 'order.submitted',
  ORDER_APPROVED: 'order.approved',
  ORDER_REJECTED: 'order.rejected',
  ORDER_MODIFICATION_REQUESTED: 'order.modification.requested',

  // Price request/offer events
  PRICE_REQUEST_CREATED: 'price_request.created',
  PRICE_OFFER_CREATED: 'price_offer.created',
  PRICE_OFFER_SENT: 'price_offer.sent',
  PRICE_OFFER_VIEWED: 'price_offer.viewed',
  PRICE_OFFER_ACCEPTED: 'price_offer.accepted',
  PRICE_OFFER_REJECTED: 'price_offer.rejected',

  // LTA events
  LTA_CREATED: 'lta.created',
  LTA_UPDATED: 'lta.updated',
  LTA_CLIENT_ASSIGNED: 'lta.client_assigned',
  LTA_PRODUCT_ASSIGNED: 'lta.product_assigned',

  // Client events
  CLIENT_CREATED: 'client.created',
  CLIENT_UPDATED: 'client.updated',

  // Template events
  TEMPLATE_CREATED: 'template.created',
  TEMPLATE_USED: 'template.used',
} as const;

/**
 * Helper function to track events
 */
export function trackEvent(type: string, userId?: string, metadata?: Record<string, any>) {
  businessMetrics.track(type, userId, metadata);
}
