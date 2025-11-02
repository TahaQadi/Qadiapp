import webpush from "web-push";
import { storage } from "../storage";
import { errorLogger } from "../error-logger";

// Complete list of all notification types used in the system
export type NotificationType =
  | "order_created"
  | "order_status_changed"
  | "order_modification_requested"
  | "order_modification_reviewed"
  | "system"
  | "price_request"
  | "price_offer_ready"
  | "price_request_sent"
  | "issue_report";

export interface NotificationPayload {
  recipientId: string; // Client ID or admin user ID
  recipientType: "client" | "admin"; // Type of recipient
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  actionUrl?: string; // URL to navigate when notification is clicked
  actionType?: "view_order" | "review_request" | "download_pdf" | "view_request" | null;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  requireInteraction?: boolean;
  data?: Record<string, any>;
  actions?: Array<{ action: string; title: string; icon?: string }>;
}

export interface NotificationPreferences {
  enableInApp: boolean;
  enablePush: boolean;
  enableEmail: boolean;
  notificationTypes: {
    [key in NotificationType]?: boolean;
  };
}

/**
 * Centralized Notification Service
 * Handles both in-app and push notifications with preferences support
 */
export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Create and send a notification
   * Automatically handles both in-app and push notifications based on user preferences
   */
  public async send(payload: NotificationPayload): Promise<{
    inAppNotification?: any;
    pushResults?: Array<{ success: boolean; endpoint?: string; error?: string }>;
    success: boolean;
  }> {
    try {
      // Get user preferences (default to all enabled for now)
      const preferences = await this.getUserPreferences(
        payload.recipientId,
        payload.recipientType
      );

      // Check if this notification type is enabled
      if (
        preferences.notificationTypes[payload.type] === false
      ) {
        return { success: true }; // User has disabled this notification type
      }

      const results: any = { success: true };

      // 1. Create in-app notification if enabled
      if (preferences.enableInApp) {
        const inAppNotification = await this.createInAppNotification(payload);
        results.inAppNotification = inAppNotification;
      }

      // 2. Send push notification if enabled
      if (preferences.enablePush) {
        const pushResults = await this.sendPushNotification(payload);
        results.pushResults = pushResults;
      }

      // 3. Future: Send email notification if enabled
      // if (preferences.enableEmail) {
      //   await this.sendEmailNotification(payload);
      // }

      return results;
    } catch (error) {
      errorLogger.logError(error as Error, {
        context: "NotificationService.send",
        payload,
      });
      return { success: false };
    }
  }

  /**
   * Send notification to multiple recipients
   */
  public async sendToMultiple(
    recipients: Array<{ id: string; type: "client" | "admin" }>,
    notificationData: Omit<NotificationPayload, "recipientId" | "recipientType">
  ): Promise<void> {
    await Promise.allSettled(
      recipients.map((recipient) =>
        this.send({
          ...notificationData,
          recipientId: recipient.id,
          recipientType: recipient.type,
        })
      )
    );
  }

  /**
   * Send notification to all admins
   */
  public async sendToAllAdmins(
    notificationData: Omit<NotificationPayload, "recipientId" | "recipientType">
  ): Promise<void> {
    try {
      const admins = await storage.getAdminClients();
      await this.sendToMultiple(
        admins.map((admin) => ({ id: admin.id, type: "admin" as const })),
        notificationData
      );
    } catch (error) {
      errorLogger.logError(error as Error, {
        context: "NotificationService.sendToAllAdmins",
      });
    }
  }

  /**
   * Create in-app notification in database
   */
  private async createInAppNotification(
    payload: NotificationPayload
  ): Promise<any> {
    return await storage.createNotification({
      clientId: payload.recipientId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      metadata: payload.metadata ? JSON.stringify(payload.metadata) : undefined,
      actionUrl: payload.actionUrl,
      actionType: payload.actionType || null,
    });
  }

  /**
   * Send push notification to user's devices
   */
  private async sendPushNotification(
    payload: NotificationPayload
  ): Promise<Array<{ success: boolean; endpoint?: string; error?: string }>> {
    try {
      // Get user's push subscriptions
      const subscriptions = await storage.getPushSubscriptions(
        payload.recipientId
      );

      if (!subscriptions || subscriptions.length === 0) {
        return []; // No subscriptions, not an error
      }

      // Prepare push notification payload
      const pushPayload: PushNotificationPayload = {
        title: payload.title,
        body: payload.message,
        url: payload.actionUrl || "/",
        tag: payload.type,
        icon: "/logo.png",
        badge: "/logo.png",
        requireInteraction: false,
        data: {
          type: payload.type,
          ...(payload.metadata || {}),
        },
      };

      // Add action buttons based on notification type
      if (payload.actionType) {
        pushPayload.actions = this.getNotificationActions(payload.actionType);
      }

      // Send to all user devices
      const results = await Promise.allSettled(
        subscriptions.map(async (sub: any) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: sub.keys as { p256dh: string; auth: string },
              },
              JSON.stringify(pushPayload)
            );
            return { success: true, endpoint: sub.endpoint };
          } catch (error: any) {
            // If subscription is invalid or expired, remove it
            if (error.statusCode === 410 || error.statusCode === 404) {
              await storage.deletePushSubscription(sub.endpoint);
            }
            return {
              success: false,
              endpoint: sub.endpoint,
              error: error.message,
            };
          }
        })
      );

      return results.map((r) =>
        r.status === "fulfilled"
          ? r.value
          : { success: false, error: r.reason }
      );
    } catch (error) {
      errorLogger.logError(error as Error, {
        context: "NotificationService.sendPushNotification",
        recipientId: payload.recipientId,
      });
      return [];
    }
  }

  /**
   * Get user's notification preferences
   * Returns default preferences if none are set
   */
  private async getUserPreferences(
    userId: string,
    userType: "client" | "admin"
  ): Promise<NotificationPreferences> {
    // TODO: Implement database storage for preferences
    // For now, return defaults with all enabled
    return {
      enableInApp: true,
      enablePush: true,
      enableEmail: false,
      notificationTypes: {
        order_created: true,
        order_status_changed: true,
        order_modification_requested: true,
        order_modification_reviewed: true,
        system: true,
        price_request: true,
        price_offer_ready: true,
        price_request_sent: true,
        issue_report: true,
      },
    };
  }

  /**
   * Get action buttons for push notifications based on type
   */
  private getNotificationActions(
    actionType: NotificationPayload["actionType"]
  ): Array<{ action: string; title: string; icon?: string }> {
    switch (actionType) {
      case "view_order":
        return [
          { action: "view", title: "View Order" },
          { action: "close", title: "Dismiss" },
        ];
      case "review_request":
        return [
          { action: "review", title: "Review" },
          { action: "close", title: "Later" },
        ];
      case "download_pdf":
        return [
          { action: "download", title: "Download" },
          { action: "view", title: "View" },
        ];
      case "view_request":
        return [
          { action: "view", title: "View" },
          { action: "close", title: "Dismiss" },
        ];
      default:
        return [];
    }
  }

  /**
   * Helper method to create notification templates for common scenarios
   */
  public createOrderNotification(
    clientId: string,
    orderNumber: string,
    orderStatus: string
  ): Omit<NotificationPayload, "recipientId" | "recipientType"> {
    const statusMessages: Record<string, { en: string; ar: string }> = {
      pending: { en: "pending confirmation", ar: "في انتظار التأكيد" },
      confirmed: { en: "confirmed", ar: "تم التأكيد" },
      processing: { en: "being processed", ar: "قيد المعالجة" },
      shipped: { en: "shipped", ar: "تم الشحن" },
      delivered: { en: "delivered", ar: "تم التسليم" },
      cancelled: { en: "cancelled", ar: "ملغي" },
    };

    const status = statusMessages[orderStatus] || {
      en: orderStatus,
      ar: orderStatus,
    };

    return {
      type: "order_status_changed",
      title: "Order Status Update",
      message: `Your order ${orderNumber} is now ${status.en}`,
      metadata: { orderId: clientId, orderNumber, status: orderStatus },
      actionUrl: "/orders",
      actionType: "view_order",
    };
  }

  /**
   * Helper method for price request notifications
   */
  public createPriceRequestNotification(
    clientName: { en: string; ar: string },
    requestNumber: string,
    productCount: number,
    requestId: string
  ): Omit<NotificationPayload, "recipientId" | "recipientType"> {
    return {
      type: "price_request",
      title: "New Price Request",
      message: `${clientName.en} requested pricing for ${productCount} product(s)`,
      metadata: { requestId, requestNumber },
      actionUrl: `/admin/price-requests/${requestId}`,
      actionType: "review_request",
    };
  }

  /**
   * Helper method for issue report notifications
   */
  public createIssueReportNotification(
    clientName: { en: string; ar: string },
    severity: string,
    title: string,
    issueId: string
  ): Omit<NotificationPayload, "recipientId" | "recipientType"> {
    const severityLabels: Record<string, { en: string; ar: string }> = {
      low: { en: "low", ar: "منخفضة" },
      medium: { en: "medium", ar: "متوسطة" },
      high: { en: "high", ar: "عالية" },
      critical: { en: "critical", ar: "حرجة" },
    };

    const severityLabel = severityLabels[severity] || { en: severity, ar: severity };

    return {
      type: "issue_report",
      title: "New Issue Report",
      message: `${clientName.en} reported a ${severityLabel.en} severity issue: ${title}`,
      metadata: { issueId, severity, title },
      actionUrl: `/admin/issues/${issueId}`,
      actionType: "review_request",
    };
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

