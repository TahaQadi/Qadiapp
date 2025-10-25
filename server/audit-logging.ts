/**
 * Audit Logging
 * Tracks critical operations for security and compliance
 */

import { Request } from 'express';

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId?: string;
  username?: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  path: string;
  ip: string;
  userAgent: string;
  statusCode?: number;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

class AuditLogger {
  private logs: AuditLog[] = [];
  private readonly maxLogs = 10000;

  /**
   * Log an audit event
   */
  log(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    this.logs.push({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...log,
    });

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console for important events
    if (this.isImportantEvent(log.action)) {
      console.log(`[AUDIT] ${log.action} by ${log.username || log.userId || 'unknown'} on ${log.resource}${log.resourceId ? ` (${log.resourceId})` : ''}`);
    }
  }

  /**
   * Check if an event is important enough to log to console
   */
  private isImportantEvent(action: string): boolean {
    const importantActions = [
      'DELETE',
      'ADMIN_ACTION',
      'PERMISSION_CHANGE',
      'PASSWORD_CHANGE',
      'USER_CREATED',
      'USER_DELETED',
      'LTA_DELETED',
      'ORDER_APPROVED',
      'ORDER_REJECTED',
    ];

    return importantActions.some(a => action.includes(a));
  }

  /**
   * Get audit logs
   */
  getLogs(filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    let filtered = this.logs;

    if (filters?.userId) {
      filtered = filtered.filter(l => l.userId === filters.userId);
    }

    if (filters?.action) {
      filtered = filtered.filter(l => l.action.includes(filters.action!));
    }

    if (filters?.resource) {
      filtered = filtered.filter(l => l.resource === filters.resource);
    }

    if (filters?.startDate) {
      filtered = filtered.filter(l => l.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      filtered = filtered.filter(l => l.timestamp <= filters.endDate!);
    }

    // Sort by most recent first
    filtered = filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  /**
   * Get audit logs for a specific resource
   */
  getResourceHistory(resource: string, resourceId: string) {
    return this.logs
      .filter(l => l.resource === resource && l.resourceId === resourceId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Clear old audit logs
   */
  clearOldLogs(daysToKeep: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    this.logs = this.logs.filter(l => l.timestamp >= cutoffDate);
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
  }
}

export const auditLogger = new AuditLogger();

/**
 * Helper to create audit log from request
 */
export function createAuditLog(
  req: Request,
  action: string,
  resource: string,
  resourceId?: string,
  changes?: Record<string, any>,
  metadata?: Record<string, any>
) {
  const user = (req as any).user;

  auditLogger.log({
    userId: user?.id,
    username: user?.username,
    action,
    resource,
    resourceId,
    method: req.method,
    path: req.path,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    changes,
    metadata,
  });
}

/**
 * Common audit action types
 */
export const AuditAction = {
  // User actions
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PERMISSION_CHANGED: 'PERMISSION_CHANGED',

  // Admin actions
  ADMIN_PROMOTED: 'ADMIN_PROMOTED',
  ADMIN_DEMOTED: 'ADMIN_DEMOTED',

  // Product actions
  PRODUCT_CREATED: 'PRODUCT_CREATED',
  PRODUCT_UPDATED: 'PRODUCT_UPDATED',
  PRODUCT_DELETED: 'PRODUCT_DELETED',
  PRODUCT_IMAGE_UPLOADED: 'PRODUCT_IMAGE_UPLOADED',

  // LTA actions
  LTA_CREATED: 'LTA_CREATED',
  LTA_UPDATED: 'LTA_UPDATED',
  LTA_DELETED: 'LTA_DELETED',
  LTA_CLIENT_ASSIGNED: 'LTA_CLIENT_ASSIGNED',
  LTA_CLIENT_REMOVED: 'LTA_CLIENT_REMOVED',
  LTA_PRODUCT_ASSIGNED: 'LTA_PRODUCT_ASSIGNED',
  LTA_PRODUCT_REMOVED: 'LTA_PRODUCT_REMOVED',
  LTA_DOCUMENT_UPLOADED: 'LTA_DOCUMENT_UPLOADED',
  LTA_DOCUMENT_DELETED: 'LTA_DOCUMENT_DELETED',

  // Order actions
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_SUBMITTED: 'ORDER_SUBMITTED',
  ORDER_APPROVED: 'ORDER_APPROVED',
  ORDER_REJECTED: 'ORDER_REJECTED',
  ORDER_MODIFICATION_REQUESTED: 'ORDER_MODIFICATION_REQUESTED',
  ORDER_MODIFICATION_APPROVED: 'ORDER_MODIFICATION_APPROVED',
  ORDER_MODIFICATION_REJECTED: 'ORDER_MODIFICATION_REJECTED',

  // Price actions
  PRICE_REQUEST_CREATED: 'PRICE_REQUEST_CREATED',
  PRICE_OFFER_CREATED: 'PRICE_OFFER_CREATED',
  PRICE_OFFER_SENT: 'PRICE_OFFER_SENT',
  PRICE_OFFER_ACCEPTED: 'PRICE_OFFER_ACCEPTED',
  PRICE_OFFER_REJECTED: 'PRICE_OFFER_REJECTED',

  // Client actions
  CLIENT_CREATED: 'CLIENT_CREATED',
  CLIENT_UPDATED: 'CLIENT_UPDATED',
  CLIENT_DELETED: 'CLIENT_DELETED',

  // Template actions
  TEMPLATE_CREATED: 'TEMPLATE_CREATED',
  TEMPLATE_UPDATED: 'TEMPLATE_UPDATED',
  TEMPLATE_DELETED: 'TEMPLATE_DELETED',
} as const;

/**
 * Resource types for audit logging
 */
export const AuditResource = {
  USER: 'user',
  PRODUCT: 'product',
  LTA: 'lta',
  ORDER: 'order',
  PRICE_REQUEST: 'price_request',
  PRICE_OFFER: 'price_offer',
  CLIENT: 'client',
  TEMPLATE: 'template',
  DOCUMENT: 'document',
} as const;
