
import { TemplatePDFGenerator } from './template-pdf-generator';
import { TemplateStorage } from './template-storage';
import { PDFStorage } from './object-storage';
import { storage } from './storage';
import { PDFAccessControl } from './pdf-access-control';

interface GenerateDocumentOptions {
  templateCategory: string;
  variables: Array<{ key: string; value: any }>;
  language?: 'ar'; // Arabic-only
  clientId: string;
  metadata?: {
    orderId?: string;
    priceOfferId?: string;
    ltaId?: string;
    [key: string]: any;
  };
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
  private static templateCache = new Map<string, any>();
  private static cacheExpiry = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate a document from template with all necessary steps
   */
  static async generateDocument(options: GenerateDocumentOptions): Promise<GenerateDocumentResult> {
    const { templateCategory, variables, language = 'ar', clientId, metadata = {} } = options;

    try {
      // 1. Get active template (with caching)
      const template = await this.getActiveTemplate(templateCategory);
      if (!template) {
        return {
          success: false,
          error: `No active template found for category: ${templateCategory}`
        };
      }

      // 2. Generate PDF
      const pdfBuffer = await TemplatePDFGenerator.generate({
        template,
        variables,
        language
      });

      if (!pdfBuffer || pdfBuffer.length === 0) {
        return { success: false, error: 'PDF generation failed' };
      }

      // 3. Upload to storage
      const fileName = this.generateFileName(templateCategory, metadata);
      const uploadResult = await PDFStorage.uploadPDF(pdfBuffer, fileName, templateCategory.toUpperCase());

      if (!uploadResult.success) {
        return { success: false, error: 'Failed to upload PDF' };
      }

      // 4. Create database record
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
          templateId: template.id,
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
   * Get active template with caching and validation
   */
  private static async getActiveTemplate(category: string): Promise<any> {
    const cacheKey = `${category}_active`;
    const cached = this.templateCache.get(cacheKey);

    // Check cache validity
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      // Validate cached template still has required fields
      if (cached.template?.id && cached.template?.sections && cached.template?.isActive) {
        console.log('📋 Using cached template:', { category, templateId: cached.template.id });
        return cached.template;
      } else {
        // Invalid cache entry, remove it
        console.warn('⚠️ Invalid cached template, removing from cache:', category);
        this.templateCache.delete(cacheKey);
      }
    }

    // Fetch from database
    console.log('🔍 Fetching template from database:', category);
    const templates = await TemplateStorage.getTemplates(category);
    
    // Find active bilingual template first, then any active template
    let template = templates.find(t => t.isActive && t.language === 'both');
    if (!template) {
      template = templates.find(t => t.isActive);
    }

    if (template) {
      // Validate template structure before caching
      if (!template.sections || !Array.isArray(template.sections)) {
        console.error('❌ Template has invalid sections:', template.id);
        return null;
      }
      
      this.templateCache.set(cacheKey, {
        template,
        timestamp: Date.now()
      });
      console.log('✅ Template cached:', { category, templateId: template.id });
    } else {
      console.warn('⚠️ No active template found for category:', category);
    }

    return template;
  }

  /**
   * Generate standardized filename
   */
  private static generateFileName(category: string, metadata: any): string {
    const timestamp = Date.now();
    const id = metadata.orderId || metadata.priceOfferId || metadata.ltaId || 'doc';
    return `${category}_${id}_${timestamp}.pdf`;
  }

  /**
   * Clear template cache (useful after template updates)
   */
  static clearCache(): void {
    this.templateCache.clear();
  }
}
