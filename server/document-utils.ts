
import { TemplatePDFGenerator } from './template-pdf-generator';
import { TemplateManager } from './template-manager';
import { PDFStorage } from './object-storage';
import { storage } from './storage';
import { PDFAccessControl } from './pdf-access-control';
import { checkDuplicateDocument, computeVariablesHash } from './document-deduplication';

interface GenerateDocumentOptions {
  templateCategory: string;
  variables: Array<{ key: string; value: any }>;
  language?: 'ar'; // Arabic-only
  clientId: string;
  templateId?: string; // Optional specific template ID
  metadata?: {
    orderId?: string;
    priceOfferId?: string;
    ltaId?: string;
    [key: string]: any;
  };
  force?: boolean; // Force regeneration, skip deduplication
}

interface GenerateDocumentResult {
  success: boolean;
  documentId?: string;
  fileName?: string;
  error?: string;
}

/**
 * Simplified document generation utility
 * Handles template lookup, PDF generation, storage, and metadata creation
 */
export class DocumentUtils {
  /**
   * Generate a document from template with all necessary steps
   */
  static async generateDocument(options: GenerateDocumentOptions): Promise<GenerateDocumentResult> {
    const { templateCategory, variables, language = 'ar', clientId, templateId, metadata = {}, force = false } = options;

    try {
      // 1. Get hardcoded template for category (templateId is ignored)
      const template = await TemplateManager.getDefaultTemplate(templateCategory);
      
      if (!template) {
        return {
          success: false,
          error: `No template found for category: ${templateCategory}`
        };
      }

      // 2. Check for duplicate document (unless force=true)
      const entityId = metadata.orderId || metadata.priceOfferId || metadata.ltaId;
      const entityType = metadata.orderId ? 'order' 
        : metadata.priceOfferId ? 'priceOffer'
        : metadata.ltaId ? 'lta'
        : undefined;

      const dedupeResult = await checkDuplicateDocument({
        templateId: template.id,
        variables,
        entityId,
        entityType: entityType as any,
        force
      });

      // If duplicate exists and force=false, return existing document
      if (dedupeResult.isDuplicate && dedupeResult.existingDocument) {
        console.log(`✅ Returning existing document: ${dedupeResult.existingDocument.id}`);
        return {
          success: true,
          documentId: dedupeResult.existingDocument.id,
          fileName: dedupeResult.existingDocument.fileName
        };
      }

      // 2. Generate PDF using TemplateManager (which uses hardcoded templates)
      const pdfBuffer = await TemplateManager.generateDocument(
        templateCategory,
        variables,
        undefined, // templateId ignored
        undefined // userId
      );

      if (!pdfBuffer || pdfBuffer.length === 0) {
        return { success: false, error: 'PDF generation failed' };
      }

      // 3. Upload to storage
      const fileName = this.generateFileName(templateCategory, metadata);
      console.log('📤 Uploading PDF:', fileName);
      const uploadResult = await PDFStorage.uploadPDF(pdfBuffer, fileName, templateCategory.toUpperCase());

      if (!uploadResult.ok) {
        console.error('❌ Upload failed:', uploadResult.error);
        return { success: false, error: `Failed to upload PDF: ${uploadResult.error}` };
      }
      
      console.log('✅ PDF uploaded successfully:', uploadResult.fileName);

      // 4. Create database record with variablesHash for deduplication
      const document = await storage.createDocumentMetadata({
        documentType: templateCategory as any,
        fileName,
        fileUrl: uploadResult.fileName!,
        fileSize: pdfBuffer.length,
        checksum: uploadResult.checksum,
        clientId,
        orderId: metadata.orderId,
        priceOfferId: metadata.priceOfferId,
        ltaId: metadata.ltaId,
        metadata: {
          templateId: 'hardcoded', // Mark as using hardcoded template
          variablesHash: dedupeResult.variablesHash,
          generatedAt: new Date().toISOString(),
          ...metadata
        }
      });

      // 5. Log access
      await PDFAccessControl.logDocumentAccess({
        documentId: document.id,
        clientId,
        action: 'generate',
        ipAddress: 'system',
        userAgent: 'DocumentUtils'
      });

      return {
        success: true,
        documentId: document.id,
        fileName
      };
    } catch (error) {
      console.error('Document generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }


  /**
   * Generate standardized filename
   */
  private static generateFileName(category: string, metadata: any): string {
    const timestamp = Date.now();
    const id = metadata.orderId || metadata.priceOfferId || metadata.ltaId || 'doc';
    return `${category}_${id}_${timestamp}.pdf`;
  }

}
