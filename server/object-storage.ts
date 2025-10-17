
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
      
      // Convert Buffer to Uint8Array for Object Storage
      const uint8Array = new Uint8Array(pdfBuffer);
      
      const { ok, error } = await client.uploadFromBytes(fullPath, uint8Array);
      
      if (!ok) {
        return { ok: false, error: error?.message || 'Upload failed' };
      }

      return { ok: true, fileName: fullPath };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  static async downloadPDF(fileName: string): Promise<{ ok: boolean; data?: Buffer; error?: string }> {
    try {
      console.log('Attempting to download from Object Storage:', fileName);
      const { ok, value, error } = await client.downloadAsBytes(fileName);
      
      if (!ok) {
        console.error('Object Storage download failed:', error?.message);
        return { ok: false, error: error?.message || 'Download failed' };
      }

      if (!value || value.length === 0) {
        console.error('Downloaded file is empty');
        return { ok: false, error: 'Downloaded file is empty' };
      }

      // Convert Uint8Array to Buffer
      const buffer = Buffer.from(value);
      console.log('Successfully downloaded buffer of size:', buffer.length, 'bytes');
      
      return { ok: true, data: buffer };
    } catch (error: any) {
      console.error('Exception during PDF download:', error);
      return { ok: false, error: error.message };
    }
  }

  static async listPDFs(): Promise<{ ok: boolean; files?: string[]; error?: string }> {
    try {
      const { ok, value, error } = await client.list({ prefix: this.PDF_FOLDER });
      
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
      const { ok, error } = await client.delete(fileName);
      
      if (!ok) {
        return { ok: false, error: error?.message || 'Delete failed' };
      }

      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }
}
