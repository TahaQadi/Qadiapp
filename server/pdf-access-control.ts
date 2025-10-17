
import crypto from 'crypto';
import { storage } from './storage';

interface DownloadToken {
  documentId: string;
  clientId: string;
  expiresAt: Date;
  signature: string;
}

export class PDFAccessControl {
  private static readonly SECRET_KEY = (() => {
    const secret = process.env.SESSION_SECRET || process.env.PDF_TOKEN_SECRET;
    if (!secret) {
      throw new Error('CRITICAL: SESSION_SECRET environment variable must be set for secure PDF token generation');
    }
    return secret;
  })();
  private static readonly TOKEN_VALIDITY_HOURS = 2;

  /**
   * Generate a secure, time-limited download token with optional restrictions
   */
  static generateDownloadToken(
    documentId: string, 
    clientId: string, 
    options?: {
      maxDownloads?: number;
      allowPrint?: boolean;
      expiresInHours?: number;
    }
  ): string {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (options?.expiresInHours || this.TOKEN_VALIDITY_HOURS));

    const tokenData = {
      documentId,
      clientId,
      expiresAt: expiresAt.toISOString(),
      maxDownloads: options?.maxDownloads,
      allowPrint: options?.allowPrint ?? true,
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
        expiresAt: typeof decoded.expiresAt === 'string' ? decoded.expiresAt : decoded.expiresAt.toISOString(),
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
  static getWatermarkText(clientName: string, language: 'en' | 'ar', version?: number): string {
    const timestamp = new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
    const versionText = version ? ` - v${version}` : '';
    
    if (language === 'ar') {
      return `وثيقة سرية - ${clientName} - ${timestamp}${versionText}`;
    }
    
    return `CONFIDENTIAL - ${clientName} - ${timestamp}${versionText}`;
  }

  /**
   * Create a new document version
   */
  static async createDocumentVersion(
    documentId: string,
    newContent: Buffer,
    changedBy: string,
    changeNote?: string
  ): Promise<{ versionId: string; versionNumber: number }> {
    const document = await storage.getDocumentById(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }

    const currentVersion = (document.metadata?.version || 0) as number;
    const newVersion = currentVersion + 1;

    // Store the new version
    const versionId = crypto.randomUUID();
    await storage.createDocumentMetadata({
      fileName: `${document.fileName}_v${newVersion}`,
      fileUrl: document.fileUrl.replace(/\.[^.]+$/, `_v${newVersion}$&`),
      documentType: document.documentType,
      clientId: document.clientId,
      ltaId: document.ltaId,
      fileSize: newContent.length,
      checksum: this.calculateChecksum(newContent),
      metadata: {
        ...document.metadata,
        version: newVersion,
        parentDocumentId: documentId,
        changedBy,
        changeNote,
        createdAt: new Date().toISOString(),
      }
    });

    // Update the original document's metadata
    await storage.updateDocumentMetadata(documentId, {
      metadata: {
        ...document.metadata,
        version: newVersion,
        lastVersionId: versionId,
        lastModifiedBy: changedBy,
        lastModifiedAt: new Date().toISOString(),
      }
    });

    return { versionId, versionNumber: newVersion };
  }

  /**
   * Calculate checksum for content integrity
   */
  private static calculateChecksum(content: Buffer): string {
    const hash = crypto.createHash('sha256');
    hash.update(content);
    return hash.digest('hex');
  }

  /**
   * Get document version history
   */
  static async getDocumentVersionHistory(documentId: string): Promise<any[]> {
    const document = await storage.getDocumentById(documentId);
    
    if (!document) {
      return [];
    }

    // Search for all versions of this document
    const allDocuments = await storage.searchDocuments({
      documentType: document.documentType,
      clientId: document.clientId,
    });

    return allDocuments
      .filter(doc => 
        doc.metadata?.parentDocumentId === documentId || 
        doc.id === documentId
      )
      .sort((a, b) => {
        const versionA = a.metadata?.version || 0;
        const versionB = b.metadata?.version || 0;
        return versionB - versionA;
      });
  }
}
