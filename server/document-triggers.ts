import { TemplatePDFGenerator } from './template-pdf-generator';
import { TemplateStorage } from './template-storage';
import { PDFStorage } from './object-storage';
import { storage } from './storage';
import { PDFAccessControl } from './pdf-access-control';

interface DocumentGenerationEvent {
  type: 'order_placed' | 'order_status_changed' | 'price_offer_created' | 'lta_contract_signed';
  data: any;
  clientId: string;
  timestamp: Date;
}

interface DocumentGenerationResult {
  success: boolean;
  documentId?: string;
  fileName?: string;
  error?: string;
}

/**
 * DocumentTriggerService - Manual document generation only
 * 
 * NOTE: Automatic document generation has been disabled.
 * This service is now only used for manual generation via admin UI.
 * Use the /api/documents/generate endpoint to manually create documents.
 */
export class DocumentTriggerService {
  private static instance: DocumentTriggerService;
  private eventQueue: DocumentGenerationEvent[] = [];
  private isProcessing = false;

  static getInstance(): DocumentTriggerService {
    if (!DocumentTriggerService.instance) {
      DocumentTriggerService.instance = new DocumentTriggerService();
    }
    return DocumentTriggerService.instance;
  }

  /**
   * Queue a document generation event
   */
  async queueEvent(event: DocumentGenerationEvent): Promise<void> {
    this.eventQueue.push(event);
    console.log(`📄 Document event queued: ${event.type} for client ${event.clientId}`);
    
    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process the event queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`🔄 Processing ${this.eventQueue.length} document generation events`);

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (!event) continue;

      try {
        await this.processEvent(event);
      } catch (error) {
        console.error(`❌ Failed to process document event ${event.type}:`, error);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Process a single document generation event
   */
  private async processEvent(event: DocumentGenerationEvent): Promise<DocumentGenerationResult> {
    console.log(`🔄 Processing event: ${event.type} for client ${event.clientId}`);

    try {
      switch (event.type) {
        case 'order_placed':
          return await this.handleOrderPlaced(event);
        case 'order_status_changed':
          return await this.handleOrderStatusChanged(event);
        case 'price_offer_created':
          return await this.handlePriceOfferCreated(event);
        case 'lta_contract_signed':
          return await this.handleLtaContractSigned(event);
        default:
          throw new Error(`Unknown event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`❌ Error processing event ${event.type}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Cache active templates to avoid repeated DB queries
  private templateCache = new Map<string, any>();
  private lastCacheUpdate = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private async getActiveTemplate(category: string): Promise<any> {
    const now = Date.now();
    const cacheKey = `${category}_active`;
    
    // Return cached template if valid
    if (this.templateCache.has(cacheKey) && (now - this.lastCacheUpdate) < this.CACHE_TTL) {
      return this.templateCache.get(cacheKey);
    }
    
    // Refresh cache
    const templates = await TemplateStorage.getTemplates(category);
    const template = templates.find(t => t.isActive && t.language === 'both');
    
    if (template) {
      this.templateCache.set(cacheKey, template);
      this.lastCacheUpdate = now;
    }
    
    return template;
  }

  /**
   * Handle order placed event
   */
  private async handleOrderPlaced(event: DocumentGenerationEvent): Promise<DocumentGenerationResult> {
    const { data: order } = event;
    
    // Get order confirmation template with caching
    let template = await this.getActiveTemplate('order');
    
    if (!template) {
      console.log('ℹ️ No active order template found, trying invoice template...');
      template = await this.getActiveTemplate('invoice');
    }
    
    if (!template) {
      console.warn('⚠️ No active order or invoice template found');
      return { success: false, error: 'No active order or invoice template found' };
    }

    // Prepare variables
    const variables = await this.prepareOrderVariables(order, event.clientId);
    
    // Generate PDF
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await TemplatePDFGenerator.generate({
        template,
        variables,
        language: 'en' // Default to English, can be made dynamic
      });
      
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('PDF generation returned empty buffer');
      }
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Upload to storage
    const fileName = `order_confirmation_${order.id}_${Date.now()}.pdf`;
    const uploadResult = await PDFStorage.uploadPDF(pdfBuffer, fileName, 'ORDER');
    
    if (!uploadResult.success) {
      console.error('❌ PDF upload failed:', uploadResult.error);
      throw new Error(`Failed to upload PDF to storage: ${uploadResult.error || 'Unknown error'}`);
    }

    // Create document record
    const document = await storage.createDocumentMetadata({
      documentType: 'order',
      fileName,
      fileUrl: uploadResult.fileName!,
      fileSize: pdfBuffer.length,
      checksum: uploadResult.checksum,
      clientId: event.clientId,
      orderId: order.id,
      metadata: {
        templateId: template.id,
        generatedAt: event.timestamp.toISOString(),
        eventType: 'order_placed'
      }
    });

    // Log generation
    await PDFAccessControl.logDocumentAccess({
      documentId: document.id,
      clientId: event.clientId,
      action: 'generate',
      ipAddress: 'system',
      userAgent: 'DocumentTriggerService'
    });

    console.log(`✅ Order confirmation generated: ${document.id}`);
    return {
      success: true,
      documentId: document.id,
      fileName
    };
  }

  /**
   * Handle order status changed event
   */
  private async handleOrderStatusChanged(event: DocumentGenerationEvent): Promise<DocumentGenerationResult> {
    const { data: { order, oldStatus, newStatus } } = event;
    
    // Only generate documents for certain status changes
    const statusChangeTriggers = {
      'confirmed': 'order',
      'shipped': 'order',
      'delivered': 'order',
      'cancelled': 'order'
    };

    const templateCategory = statusChangeTriggers[newStatus as keyof typeof statusChangeTriggers];
    if (!templateCategory) {
      console.log(`ℹ️ No document generation needed for status change: ${oldStatus} -> ${newStatus}`);
      return { success: true };
    }

    // Get appropriate template - try specific category first, then fallback to 'invoice'
    let templates = await TemplateStorage.getTemplates(templateCategory);
    let template = templates.find(t => t.isActive && t.language === 'both');
    
    if (!template) {
      console.log(`ℹ️ No active ${templateCategory} template found, trying invoice template...`);
      templates = await TemplateStorage.getTemplates('invoice');
      template = templates.find(t => t.isActive && t.language === 'both');
    }
    
    if (!template) {
      console.warn(`⚠️ No active ${templateCategory} or invoice template found`);
      return { success: false, error: `No active ${templateCategory} or invoice template found` };
    }

    // Prepare variables
    const variables = await this.prepareOrderVariables(order, event.clientId, {
      oldStatus,
      newStatus,
      statusChangeDate: event.timestamp
    });
    
    // Generate PDF
    const pdfBuffer = await TemplatePDFGenerator.generate({
      template,
      variables,
      language: 'en'
    });

    // Upload to storage
    const fileName = `order_${order.id}_${newStatus}_${Date.now()}.pdf`;
    const uploadResult = await PDFStorage.uploadPDF(pdfBuffer, fileName, 'ORDER');
    
    if (!uploadResult.success) {
      throw new Error('Failed to upload PDF to storage');
    }

    // Create document record
    const document = await storage.createDocumentMetadata({
      documentType: 'order',
      fileName,
      fileUrl: uploadResult.fileName!,
      fileSize: pdfBuffer.length,
      checksum: uploadResult.checksum,
      clientId: event.clientId,
      orderId: order.id,
      metadata: {
        templateId: template.id,
        generatedAt: event.timestamp.toISOString(),
        eventType: 'order_status_changed',
        oldStatus,
        newStatus
      }
    });

    // Log generation
    await PDFAccessControl.logDocumentAccess({
      documentId: document.id,
      clientId: event.clientId,
      action: 'generate',
      ipAddress: 'system',
      userAgent: 'DocumentTriggerService'
    });

    console.log(`✅ Order document generated: ${document.id}`);
    return {
      success: true,
      documentId: document.id,
      fileName
    };
  }

  /**
   * Handle price offer created event
   */
  private async handlePriceOfferCreated(event: DocumentGenerationEvent): Promise<DocumentGenerationResult> {
    const { data: priceOffer } = event;
    
    // Get price offer template
    const templates = await TemplateStorage.getTemplates('price_offer');
    const template = templates.find(t => t.isActive && t.language === 'both');
    
    if (!template) {
      console.warn('⚠️ No active price offer template found');
      return { success: false, error: 'No active price offer template found' };
    }

    // Prepare variables
    const variables = await this.preparePriceOfferVariables(priceOffer, event.clientId);
    
    // Generate PDF
    const pdfBuffer = await TemplatePDFGenerator.generate({
      template,
      variables,
      language: priceOffer.language || 'en'
    });

    // Upload to storage
    const fileName = `price_offer_${priceOffer.id}_${Date.now()}.pdf`;
    const uploadResult = await PDFStorage.uploadPDF(pdfBuffer, fileName, 'PRICE_OFFER');
    
    if (!uploadResult.success) {
      throw new Error('Failed to upload PDF to storage');
    }

    // Create document record
    const document = await storage.createDocumentMetadata({
      documentType: 'price_offer',
      fileName,
      fileUrl: uploadResult.fileName!,
      fileSize: pdfBuffer.length,
      checksum: uploadResult.checksum,
      clientId: event.clientId,
      priceOfferId: priceOffer.id,
      metadata: {
        templateId: template.id,
        generatedAt: event.timestamp.toISOString(),
        eventType: 'price_offer_created'
      }
    });

    // Log generation
    await PDFAccessControl.logDocumentAccess({
      documentId: document.id,
      clientId: event.clientId,
      action: 'generate',
      ipAddress: 'system',
      userAgent: 'DocumentTriggerService'
    });

    console.log(`✅ Price offer generated: ${document.id}`);
    return {
      success: true,
      documentId: document.id,
      fileName
    };
  }

  /**
   * Handle LTA contract signed event
   */
  private async handleLtaContractSigned(event: DocumentGenerationEvent): Promise<DocumentGenerationResult> {
    const { data: lta } = event;
    
    // Get contract template
    const templates = await TemplateStorage.getTemplates('contract');
    const template = templates.find(t => t.isActive && t.language === 'both');
    
    if (!template) {
      console.warn('⚠️ No active contract template found');
      return { success: false, error: 'No active contract template found' };
    }

    // Prepare variables
    const variables = await this.prepareLtaVariables(lta, event.clientId);
    
    // Generate PDF
    const pdfBuffer = await TemplatePDFGenerator.generate({
      template,
      variables,
      language: 'en'
    });

    // Upload to storage
    const fileName = `lta_contract_${lta.id}_${Date.now()}.pdf`;
    const uploadResult = await PDFStorage.uploadPDF(pdfBuffer, fileName, 'CONTRACT');
    
    if (!uploadResult.success) {
      throw new Error('Failed to upload PDF to storage');
    }

    // Create document record
    const document = await storage.createDocumentMetadata({
      documentType: 'contract',
      fileName,
      fileUrl: uploadResult.fileName!,
      fileSize: pdfBuffer.length,
      checksum: uploadResult.checksum,
      clientId: event.clientId,
      ltaId: lta.id,
      metadata: {
        templateId: template.id,
        generatedAt: event.timestamp.toISOString(),
        eventType: 'lta_contract_signed'
      }
    });

    // Log generation
    await PDFAccessControl.logDocumentAccess({
      documentId: document.id,
      clientId: event.clientId,
      action: 'generate',
      ipAddress: 'system',
      userAgent: 'DocumentTriggerService'
    });

    console.log(`✅ LTA contract generated: ${document.id}`);
    return {
      success: true,
      documentId: document.id,
      fileName
    };
  }

  /**
   * Prepare variables for order-related documents
   */
  private async prepareOrderVariables(order: any, clientId: string, additionalData?: any): Promise<Array<{ key: string; value: any }>> {
    // Get client information
    const client = await storage.getClient(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    // Parse order items
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

    const variables = [
      { key: 'orderId', value: order.id },
      { key: 'orderDate', value: new Date(order.createdAt).toLocaleDateString() },
      { key: 'orderStatus', value: order.status },
      { key: 'totalAmount', value: order.totalAmount },
      { key: 'currency', value: order.currency || 'SAR' },
      { key: 'clientName', value: client.nameEn },
      { key: 'clientNameAr', value: client.nameAr },
      { key: 'clientEmail', value: client.email },
      { key: 'clientPhone', value: client.phone },
      { key: 'items', value: items },
      { key: 'companyName', value: 'Al Qadi Trading Company' },
      { key: 'companyNameAr', value: 'شركة القاضي التجارية' },
      { key: 'companyAddress', value: 'Riyadh, Kingdom of Saudi Arabia' },
      { key: 'companyAddressAr', value: 'الرياض، المملكة العربية السعودية' },
      { key: 'companyPhone', value: '+966 XX XXX XXXX' },
      { key: 'companyEmail', value: 'info@alqadi.com' }
    ];

    // Add additional data if provided
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        variables.push({ key, value });
      });
    }

    return variables;
  }

  /**
   * Prepare variables for price offer documents
   */
  private async preparePriceOfferVariables(priceOffer: any, clientId: string): Promise<Array<{ key: string; value: any }>> {
    // Get client information
    const client = await storage.getClient(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    // Parse price offer items
    const items = typeof priceOffer.items === 'string' ? JSON.parse(priceOffer.items) : priceOffer.items;

    const variables = [
      { key: 'offerNumber', value: priceOffer.offerNumber },
      { key: 'offerDate', value: new Date(priceOffer.createdAt).toLocaleDateString() },
      { key: 'validUntil', value: new Date(priceOffer.validUntil).toLocaleDateString() },
      { key: 'clientName', value: client.nameEn },
      { key: 'clientNameAr', value: client.nameAr },
      { key: 'clientEmail', value: client.email },
      { key: 'clientPhone', value: client.phone },
      { key: 'items', value: items },
      { key: 'total', value: priceOffer.total },
      { key: 'currency', value: priceOffer.currency || 'SAR' },
      { key: 'notes', value: priceOffer.notes || '' },
      { key: 'companyName', value: 'Al Qadi Trading Company' },
      { key: 'companyNameAr', value: 'شركة القاضي التجارية' },
      { key: 'companyAddress', value: 'Riyadh, Kingdom of Saudi Arabia' },
      { key: 'companyAddressAr', value: 'الرياض، المملكة العربية السعودية' },
      { key: 'companyPhone', value: '+966 XX XXX XXXX' },
      { key: 'companyEmail', value: 'info@alqadi.com' }
    ];

    return variables;
  }

  /**
   * Prepare variables for LTA documents
   */
  private async prepareLtaVariables(lta: any, clientId: string): Promise<Array<{ key: string; value: any }>> {
    // Get client information
    const client = await storage.getClient(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    const variables = [
      { key: 'ltaId', value: lta.id },
      { key: 'ltaName', value: lta.nameEn },
      { key: 'ltaNameAr', value: lta.nameAr },
      { key: 'contractDate', value: new Date(lta.createdAt).toLocaleDateString() },
      { key: 'clientName', value: client.nameEn },
      { key: 'clientNameAr', value: client.nameAr },
      { key: 'clientEmail', value: client.email },
      { key: 'clientPhone', value: client.phone },
      { key: 'companyName', value: 'Al Qadi Trading Company' },
      { key: 'companyNameAr', value: 'شركة القاضي التجارية' },
      { key: 'companyAddress', value: 'Riyadh, Kingdom of Saudi Arabia' },
      { key: 'companyAddressAr', value: 'الرياض، المملكة العربية السعودية' },
      { key: 'companyPhone', value: '+966 XX XXX XXXX' },
      { key: 'companyEmail', value: 'info@alqadi.com' }
    ];

    return variables;
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { queueLength: number; isProcessing: boolean } {
    return {
      queueLength: this.eventQueue.length,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Clear the queue (for testing)
   */
  clearQueue(): void {
    this.eventQueue = [];
    this.isProcessing = false;
  }
}

// Export singleton instance
export const documentTriggerService = DocumentTriggerService.getInstance();