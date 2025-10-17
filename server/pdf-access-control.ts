
import crypto from 'crypto';
import { storage } from './storage';

interface DownloadToken {
  documentId: string;
  clientId: string;
  expiresAt: Date;
  signature: string;
}

export class PDFAccessControl {
  private static readonly SECRET_KEY = process.env.PDF_TOKEN_SECRET || 'default-secret-key-change-in-production';
  private static readonly TOKEN_VALIDITY_HOURS = 2;

  /**
   * Generate a secure, time-limited download token
   */
  static generateDownloadToken(documentId: string, clientId: string): string {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.TOKEN_VALIDITY_HOURS);

    const tokenData = {
      documentId,
      clientId,
      expiresAt: expiresAt.toISOString(),
    };

    const signature = this.signToken(tokenData);

    const token = Buffer.from(JSON.stringify({ ...tokenData, signature })).toString('base64url');
    return token;
  }

  /**
   * Verify and decode a download token
   */
  static verifyDownloadToken(token: string): { valid: boolean; documentId?: string; clientId?: string; error?: string } {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf-8')) as DownloadToken;

      // Check expiry
      if (new Date(decoded.expiresAt) < new Date()) {
        return { valid: false, error: 'Token expired' };
      }

      // Verify signature
      const expectedSignature = this.signToken({
        documentId: decoded.documentId,
        clientId: decoded.clientId,
        expiresAt: decoded.expiresAt,
      });

      if (decoded.signature !== expectedSignature) {
        return { valid: false, error: 'Invalid token signature' };
      }

      return { 
        valid: true, 
        documentId: decoded.documentId, 
        clientId: decoded.clientId 
      };
    } catch (error) {
      return { valid: false, error: 'Invalid token format' };
    }
  }

  /**
   * Create HMAC signature for token data
   */
  private static signToken(data: { documentId: string; clientId: string; expiresAt: string }): string {
    const hmac = crypto.createHmac('sha256', this.SECRET_KEY);
    hmac.update(JSON.stringify(data));
    return hmac.digest('hex');
  }

  /**
   * Log document access for audit trail
   */
  static async logDocumentAccess(params: {
    documentId: string;
    clientId: string;
    action: 'view' | 'download' | 'generate';
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await storage.createDocumentAccessLog({
      documentId: params.documentId,
      clientId: params.clientId,
      action: params.action,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
      accessedAt: new Date(),
    });
  }

  /**
   * Check if client has permission to access document
   */
  static async canAccessDocument(documentId: string, clientId: string, isAdmin: boolean): Promise<{ allowed: boolean; reason?: string }> {
    const document = await storage.getDocumentById(documentId);

    if (!document) {
      return { allowed: false, reason: 'Document not found' };
    }

    // Admins can access all documents
    if (isAdmin) {
      return { allowed: true };
    }

    // Check if document belongs to client
    if (document.clientId === clientId) {
      return { allowed: true };
    }

    return { allowed: false, reason: 'Access denied' };
  }

  /**
   * Add watermark text to indicate document ownership
   */
  static getWatermarkText(clientName: string, language: 'en' | 'ar'): string {
    const timestamp = new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
    
    if (language === 'ar') {
      return `وثيقة سرية - ${clientName} - ${timestamp}`;
    }
    
    return `CONFIDENTIAL - ${clientName} - ${timestamp}`;
  }
}
