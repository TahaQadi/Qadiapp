
import { Client } from '@replit/object-storage';

// Initialize Object Storage client
const client = new Client();

export interface StoredPDF {
  fileName: string;
  url: string;
  uploadedAt: Date;
}

export class PDFStorage {
  private static readonly PDF_FOLDER = 'price-offers/';

  static async uploadPDF(
    pdfBuffer: Buffer,
    fileName: string
  ): Promise<{ ok: boolean; fileName?: string; error?: string }> {
    try {
      const fullPath = `${this.PDF_FOLDER}${fileName}`;
      
      const { ok, error } = await client.uploadFromBytes(fullPath, pdfBuffer);
      
      if (!ok) {
        console.error('Failed to upload PDF to Object Storage:', error);
        return { ok: false, error: error?.message || 'Upload failed' };
      }

      return { ok: true, fileName: fullPath };
    } catch (error: any) {
      console.error('Error uploading PDF:', error);
      return { ok: false, error: error.message };
    }
  }

  static async downloadPDF(fileName: string): Promise<{ ok: boolean; data?: Buffer; error?: string }> {
    try {
      console.log('Attempting to download from Object Storage:', fileName);
      const { ok, value, error } = await client.downloadAsBytes(fileName);
      
      if (!ok || !value) {
        console.error('Failed to download PDF from Object Storage:', error);
        return { ok: false, error: error?.message || 'Download failed' };
      }

      // Ensure we have a proper Buffer
      const buffer = value instanceof Uint8Array ? Buffer.from(value) : Buffer.from(value as any);
      console.log('Downloaded PDF buffer size:', buffer.length);
      
      return { ok: true, data: buffer };
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      return { ok: false, error: error.message };
    }
  }

  static async listPDFs(): Promise<{ ok: boolean; files?: string[]; error?: string }> {
    try {
      const { ok, value, error } = await client.list({ prefix: this.PDF_FOLDER });
      
      if (!ok || !value) {
        console.error('Failed to list PDFs from Object Storage:', error);
        return { ok: false, error: error?.message || 'List failed' };
      }

      const fileNames = value.map(item => item.name);
      return { ok: true, files: fileNames };
    } catch (error: any) {
      console.error('Error listing PDFs:', error);
      return { ok: false, error: error.message };
    }
  }

  static async deletePDF(fileName: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const { ok, error } = await client.delete(fileName);
      
      if (!ok) {
        console.error('Failed to delete PDF from Object Storage:', error);
        return { ok: false, error: error?.message || 'Delete failed' };
      }

      return { ok: true };
    } catch (error: any) {
      console.error('Error deleting PDF:', error);
      return { ok: false, error: error.message };
    }
  }
}
