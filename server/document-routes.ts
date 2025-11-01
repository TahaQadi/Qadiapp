import type { Express, Request, Response } from "express";
import { requireAuth, requireAdmin, AuthenticatedRequest, AdminRequest } from "./auth";
import { TemplatePDFGenerator } from "./template-pdf-generator";
import { TemplateManager } from "./template-manager";
import { PDFStorage } from "./object-storage";
import { PDFAccessControl } from "./pdf-access-control";
import { storage } from "./storage";
import { DocumentUtils } from "./document-utils";
import { TemplateVariable } from "@shared/template-schema";
import { z } from "zod";

// Validation schemas
const generateDocumentSchema = z.object({
  category: z.enum(['price_offer', 'order', 'invoice', 'contract', 'report', 'other']),
  variables: z.array(z.object({
    key: z.string(),
    value: z.any()
  })),
  language: z.enum(['en', 'ar', 'both']).default('ar'),
  saveToDocuments: z.boolean().default(true),
  clientId: z.string().uuid().optional(),
  ltaId: z.string().uuid().optional(),
  orderId: z.string().optional(),
  priceOfferId: z.string().optional()
});

const documentSearchSchema = z.object({
  type: z.string().optional(),
  clientId: z.string().uuid().optional(),
  ltaId: z.string().uuid().optional(),
  orderId: z.string().optional(),
  priceOfferId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20)
});

export function setupDocumentRoutes(app: Express) {
  // 1. Generate Document from Template
  app.post('/api/documents/generate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Validate request body
      const validation = generateDocumentSchema.safeParse(req.body);
      if (!validation.success) {
        console.error('❌ Document generation validation failed:', validation.error.errors);
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors
        });
      }

      const { category, variables, language, saveToDocuments, clientId, ltaId, orderId, priceOfferId } = validation.data;

      console.log('📄 Document generation request:', {
        category,
        language,
        variableCount: variables.length,
        clientId,
        userId: req.user?.id
      });

      // Generate PDF with comprehensive error handling
      let pdfBuffer: Buffer;
      try {
        console.log('🔨 Starting PDF generation...');
        
        // Convert variables to TemplateVariable format
        const templateVariables: TemplateVariable[] = variables.map(v => ({
          key: v.key,
          value: v.value
        }));

        // Use TemplateManager which uses hardcoded templates
        pdfBuffer = await TemplateManager.generateDocument(
          category,
          templateVariables,
          undefined // templateId ignored for hardcoded templates
        );

        if (!pdfBuffer || pdfBuffer.length === 0) {
          throw new Error('PDF generation returned empty buffer');
        }

        console.log('✅ PDF generated successfully:', {
          size: pdfBuffer.length,
          sizeKB: Math.round(pdfBuffer.length / 1024)
        });
      } catch (pdfError) {
        console.error('❌ PDF generation failed:', {
          error: pdfError instanceof Error ? pdfError.message : 'Unknown error',
          stack: pdfError instanceof Error ? pdfError.stack : undefined,
          category,
          language,
          variableCount: variables.length
        });
        return res.status(500).json({
          success: false,
          error: 'Failed to generate PDF',
          details: pdfError instanceof Error ? pdfError.message : 'Unknown error'
        });
      }

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${category}_${timestamp}.pdf`;

      let documentId: string | undefined;
      let fileUrl: string | undefined;

      if (saveToDocuments) {
        // Upload to storage
        let uploadResult;
        try {
          console.log('📤 Uploading PDF to storage...');
          uploadResult = await PDFStorage.uploadPDF(pdfBuffer, fileName, category.toUpperCase());
          
          if (!uploadResult.success) {
            throw new Error(uploadResult.error || 'Upload failed');
          }
          
          console.log('✅ PDF uploaded successfully:', uploadResult.fileName);
        } catch (uploadError) {
          console.error('❌ Failed to upload PDF:', uploadError);
          return res.status(500).json({
            success: false,
            error: 'Failed to upload PDF to storage',
            details: uploadError instanceof Error ? uploadError.message : 'Unknown error'
          });
        }

        // Create document record
        let document;
        try {
          console.log('💾 Creating document metadata...');
          document = await storage.createDocumentMetadata({
            documentType: category as any,
            fileName,
            fileUrl: uploadResult.fileName!,
            fileSize: pdfBuffer.length,
            checksum: uploadResult.checksum,
            clientId: clientId || (req.user!.isAdmin ? undefined : req.user!.id),
            ltaId,
            orderId,
            priceOfferId,
            metadata: {
              templateId: 'hardcoded',
              category,
              language,
              generatedAt: new Date().toISOString(),
              generatedBy: req.user!.id
            }
          });
          
          console.log('✅ Document metadata created:', document.id);
        } catch (dbError) {
          console.error('❌ Failed to create document metadata:', dbError);
          return res.status(500).json({
            success: false,
            error: 'Failed to save document metadata',
            details: dbError instanceof Error ? dbError.message : 'Unknown error'
          });
        }

        documentId = document.id;
        fileUrl = uploadResult.fileName;

        // Log generation
        try {
          await PDFAccessControl.logDocumentAccess({
            documentId: document.id,
            clientId: req.user!.id,
            action: 'generate',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          });
          console.log('✅ Document access logged');
        } catch (logError) {
          // Don't fail the request if logging fails
          console.error('⚠️ Failed to log document access:', logError);
        }
      }

      res.json({
        success: true,
        documentId,
        fileName,
        fileUrl,
        fileSize: pdfBuffer.length
      });

    } catch (error) {
      console.error('Document generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // 2. List/Search Documents
  app.get('/api/documents', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = documentSearchSchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.errors
        });
      }

      const { type, clientId, ltaId, orderId, priceOfferId, startDate, endDate, search, page, pageSize } = validation.data;

      const filters: any = {};

      if (type) filters.documentType = type;
      if (clientId) filters.clientId = clientId;
      if (ltaId) filters.ltaId = ltaId;
      if (orderId) filters.orderId = orderId;
      if (priceOfferId) filters.priceOfferId = priceOfferId;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      if (search) filters.searchTerm = search;

      // Non-admin users can only see their own documents
      if (!req.user!.isAdmin) {
        filters.clientId = req.user!.id;
      }

      const result = await storage.searchDocuments(filters, page, pageSize);

      res.json({
        success: true,
        documents: result.documents,
        totalCount: result.totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(result.totalCount / pageSize)
      });

    } catch (error) {
      console.error('Document search error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search documents'
      });
    }
  });

  // 5. Get Document Details
  app.get('/api/documents/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocumentById(id);

      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Check permissions
      if (!req.user!.isAdmin && document.clientId !== req.user!.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      res.json({
        success: true,
        document
      });

    } catch (error) {
      console.error('Get document error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get document'
      });
    }
  });

  // 6. Get Access Logs (Admin Only)
  app.get('/api/documents/:id/logs', requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const { id } = req.params;
      const logs = await storage.getDocumentAccessLogs(id);

      res.json({
        success: true,
        logs
      });

    } catch (error) {
      console.error('Get access logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get access logs'
      });
    }
  });

  // 7. Delete Document (Admin Only)
  app.delete('/api/documents/:id', requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocumentById(id);

      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Delete from storage
      const deleteResult = await PDFStorage.deletePDF(document.fileUrl);
      if (!deleteResult.success) {
        console.warn('Failed to delete file from storage:', deleteResult.error);
      }

      // Delete from database
      const deleted = await storage.deleteDocument(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      res.json({
        success: true,
        message: 'Document deleted successfully'
      });

    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete document'
      });
    }
  });

}