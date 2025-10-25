
import { Client } from '@replit/object-storage';
import crypto from 'crypto';

// Initialize Object Storage client
const client = new Client();

export interface StoredPDF {
  fileName: string;
  url: string;
  uploadedAt: Date;
}

export class PDFStorage {
  private static readonly BASE_FOLDER = 'documents/';
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second
  private static readonly MIN_BUFFER_SIZE = 100; // bytes

  /**
   * Document categories for organization
   */
  private static readonly CATEGORIES = {
    PRICE_OFFER: 'price-offers',
    ORDER: 'orders',
    INVOICE: 'invoices',
    CONTRACT: 'contracts',
    LTA: 'lta-documents',
    OTHER: 'other'
  } as const;

  /**
   * Generate organized file path
   */
  private static generateFilePath(
    category: keyof typeof PDFStorage.CATEGORIES,
    fileName: string,
    date: Date = new Date()
  ): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const categoryPath = this.CATEGORIES[category];
    
    return `${this.BASE_FOLDER}${categoryPath}/${year}/${month}/${fileName}`;
  }

  /**
   * Validate buffer before upload
   */
  private static validateBuffer(buffer: Buffer): { valid: boolean; error?: string } {
    if (!buffer || buffer.length === 0) {
      return { valid: false, error: 'Buffer is empty' };
    }

    if (buffer.length < this.MIN_BUFFER_SIZE) {
      return { valid: false, error: `Buffer too small (${buffer.length} bytes). Minimum: ${this.MIN_BUFFER_SIZE} bytes` };
    }

    // Check PDF signature (PDF files start with %PDF-)
    const pdfSignature = buffer.slice(0, 5).toString('ascii');
    if (!pdfSignature.startsWith('%PDF-')) {
      return { valid: false, error: 'Invalid PDF format - missing PDF signature' };
    }

    return { valid: true };
  }

  /**
   * Calculate checksum for verification
   */
  private static calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  /**
   * Retry wrapper for async operations
   */
  private static async retryOperation<T>(
    operation: () => Promise<T>,
    retries: number = this.MAX_RETRIES
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        return this.retryOperation(operation, retries - 1);
      }
      throw error;
    }
  }

  static async uploadPDF(
    pdfBuffer: Buffer,
    fileName: string,
    category: keyof typeof PDFStorage.CATEGORIES = 'PRICE_OFFER'
  ): Promise<{ ok: boolean; fileName?: string; error?: string; checksum?: string }> {
    try {

      // Validate buffer
      const validation = this.validateBuffer(pdfBuffer);
      if (!validation.valid) {
        console.error('Buffer validation failed:', validation.error);
        return { ok: false, error: validation.error };
      }

      // Calculate checksum
      const checksum = this.calculateChecksum(pdfBuffer);

      // Generate organized path
      const fullPath = this.generateFilePath(category, fileName);

      // Upload with retry logic (uploadFromBytes expects Buffer)
      const { ok, error } = await this.retryOperation(async () => {
        return await client.uploadFromBytes(fullPath, pdfBuffer);
      });
      
      if (!ok) {
        console.error('Upload failed after retries:', error?.message);
        return { ok: false, error: error?.message || 'Upload failed' };
      }

      return { ok: true, fileName: fullPath, checksum };
    } catch (error: any) {
      console.error('Upload exception:', error);
      return { ok: false, error: error.message };
    }
  }

  static async downloadPDF(
    fileName: string,
    expectedChecksum?: string
  ): Promise<{ ok: boolean; data?: Buffer; error?: string; checksum?: string }> {
    try {

      // Download with retry logic (downloadAsBytes returns Result<[Buffer], Error>)
      const { ok, value, error } = await this.retryOperation(async () => {
        return await client.downloadAsBytes(fileName);
      });
      
      if (!ok) {
        console.error('Object Storage download failed:', error?.message);
        return { ok: false, error: error?.message || 'Download failed' };
      }

      if (!value || !value[0] || value[0].length === 0) {
        console.error('Downloaded file is empty');
        return { ok: false, error: 'Downloaded file is empty' };
      }

      // Extract Buffer from tuple [Buffer]
      const buffer = value[0];

      // Validate downloaded buffer
      const validation = this.validateBuffer(buffer);
      if (!validation.valid) {
        console.error('Downloaded buffer validation failed:', validation.error);
        return { ok: false, error: `Downloaded file corrupted: ${validation.error}` };
      }

      // Verify checksum if provided
      const checksum = this.calculateChecksum(buffer);
      if (expectedChecksum && checksum !== expectedChecksum) {
        console.error(`Checksum mismatch! Expected: ${expectedChecksum}, Got: ${checksum}`);
        return { ok: false, error: 'File corrupted - checksum mismatch' };
      }

      return { ok: true, data: buffer, checksum };
    } catch (error: any) {
      console.error('Exception during PDF download:', error);
      return { ok: false, error: error.message };
    }
  }

  static async listPDFs(
    category?: keyof typeof PDFStorage.CATEGORIES
  ): Promise<{ ok: boolean; files?: string[]; error?: string }> {
    try {
      const prefix = category 
        ? `${this.BASE_FOLDER}${this.CATEGORIES[category]}/`
        : this.BASE_FOLDER;

      const { ok, value, error } = await client.list({ prefix });
      
      if (!ok || !value) {
        return { ok: false, error: error?.message || 'List failed' };
      }

      const fileNames = value.map(item => item.name);
      return { ok: true, files: fileNames };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  static async deletePDF(fileName: string): Promise<{ ok: boolean; error?: string }> {
    try {
      
      const { ok, error } = await this.retryOperation(async () => {
        return await client.delete(fileName);
      });
      
      if (!ok) {
        console.error('Delete failed after retries:', error?.message);
        return { ok: false, error: error?.message || 'Delete failed' };
      }

      return { ok: true };
    } catch (error: any) {
      console.error('Delete exception:', error);
      return { ok: false, error: error.message };
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  static async uploadPriceOfferPDF(pdfBuffer: Buffer, fileName: string) {
    return this.uploadPDF(pdfBuffer, fileName, 'PRICE_OFFER');
  }
}
