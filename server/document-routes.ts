import type { Express, Request, Response } from "express";
import { requireAuth, requireAdmin, AuthenticatedRequest, AdminRequest } from "./auth";
import { TemplatePDFGenerator } from "./template-pdf-generator";
import { TemplateStorage } from "./template-storage";
import { PDFStorage } from "./object-storage";
import { PDFAccessControl } from "./pdf-access-control";
import { storage } from "./storage";
import { z } from "zod";

// Validation schemas
const generateDocumentSchema = z.object({
  templateId: z.string().uuid(),
  variables: z.array(z.object({
    key: z.string(),
    value: z.any()
  })),
  language: z.enum(['en', 'ar', 'both']).default('both'),
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
      const validation = generateDocumentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors
        });
      }

      const { templateId, variables, language, saveToDocuments, clientId, ltaId, orderId, priceOfferId } = validation.data;

      // Get template
      const template = await TemplateStorage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      if (!template.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Template is not active'
        });
      }

      // Generate PDF
      const pdfBuffer = await TemplatePDFGenerator.generate({
        template,
        variables,
        language: language as 'en' | 'ar'
      });

      // Validate PDF
      if (pdfBuffer.length === 0) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate PDF'
        });
      }

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${template.category}_${timestamp}.pdf`;

      let documentId: string | undefined;
      let fileUrl: string | undefined;

      if (saveToDocuments) {
        // Upload to storage
        const uploadResult = await PDFStorage.uploadPDF(pdfBuffer, fileName, template.category);
        if (!uploadResult.success) {
          return res.status(500).json({
            success: false,
            error: 'Failed to upload PDF to storage'
          });
        }

        // Create document record
        const document = await storage.createDocumentMetadata({
          documentType: template.category as any,
          fileName,
          fileUrl: uploadResult.fileName!,
          fileSize: pdfBuffer.length,
          checksum: uploadResult.checksum,
          clientId: clientId || (req.user!.isAdmin ? undefined : req.user!.id),
          ltaId,
          orderId,
          priceOfferId,
          metadata: {
            templateId,
            language,
            generatedAt: new Date().toISOString(),
            generatedBy: req.user!.id
          }
        });

        documentId = document.id;
        fileUrl = uploadResult.fileName;

        // Log generation
        await PDFAccessControl.logDocumentAccess({
          documentId: document.id,
          clientId: req.user!.id,
          action: 'generate',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
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

  // 2. Generate Secure Download Token
  app.post('/api/documents/:id/token', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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

      const token = PDFAccessControl.generateDownloadToken(id, req.user!.id);
      const expiresIn = '2h'; // Token expires in 2 hours

      res.json({
        success: true,
        token,
        expiresIn
      });

    } catch (error) {
      console.error('Token generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate token'
      });
    }
  });

  // 3. Download Document
  app.get('/api/documents/:id/download', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Download token required'
        });
      }

      // Verify token
      const verification = PDFAccessControl.verifyDownloadToken(token);
      if (!verification.valid || verification.documentId !== id) {
        return res.status(401).json({
          success: false,
          error: verification.error || 'Invalid or expired token'
        });
      }

      // Get document
      const document = await storage.getDocumentById(id);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Download from storage
      const downloadResult = await PDFStorage.downloadPDF(document.fileUrl, document.checksum || undefined);
      if (!downloadResult.ok) {
        return res.status(500).json({
          success: false,
          error: 'Failed to download document from storage'
        });
      }

      // Log download
      await PDFAccessControl.logDocumentAccess({
        documentId: id,
        clientId: verification.clientId!,
        action: 'download',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Increment view count
      await storage.incrementDocumentViewCount(id);

      // Send file
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      res.setHeader('Content-Length', downloadResult.data.length);
      res.send(downloadResult.data);

    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to download document'
      });
    }
  });

  // 4. List/Search Documents
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

  // 8. Template Operations (Admin Only)
  app.get('/api/admin/templates', requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const { category } = req.query;
      const templates = await TemplateStorage.getTemplates(category as string);

      res.json({
        success: true,
        templates
      });

    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get templates'
      });
    }
  });

  app.post('/api/admin/templates', requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const template = await TemplateStorage.createTemplate(req.body);

      res.status(201).json({
        success: true,
        template
      });

    } catch (error) {
      console.error('Create template error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create template'
      });
    }
  });

  app.get('/api/admin/templates/:id', requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const { id } = req.params;
      const template = await TemplateStorage.getTemplate(id);

      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      res.json({
        success: true,
        template
      });

    } catch (error) {
      console.error('Get template error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get template'
      });
    }
  });

  app.put('/api/admin/templates/:id', requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const { id } = req.params;
      const template = await TemplateStorage.updateTemplate(id, req.body);

      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      res.json({
        success: true,
        template
      });

    } catch (error) {
      console.error('Update template error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update template'
      });
    }
  });

  app.delete('/api/admin/templates/:id', requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await TemplateStorage.deleteTemplate(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      res.json({
        success: true,
        message: 'Template deleted successfully'
      });

    } catch (error) {
      console.error('Delete template error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete template'
      });
    }
  });

  app.post('/api/admin/templates/:id/duplicate', requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { nameEn, nameAr } = req.body;

      if (!nameEn || !nameAr) {
        return res.status(400).json({
          success: false,
          error: 'Template names (English and Arabic) are required'
        });
      }

      const duplicate = await TemplateStorage.duplicateTemplate(id, { en: nameEn, ar: nameAr });

      res.status(201).json({
        success: true,
        template: duplicate
      });

    } catch (error) {
      console.error('Duplicate template error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to duplicate template'
      });
    }
  });

  // 9. Preview Template with Sample Data (Admin Only)
  app.post('/api/admin/templates/:id/preview', requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { variables, language = 'en' } = req.body;

      const template = await TemplateStorage.getTemplate(id);
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      const pdfBuffer = await TemplatePDFGenerator.generate({
        template,
        variables: variables || [],
        language: language as 'en' | 'ar'
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="preview.pdf"');
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Template preview error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate preview'
      });
    }
  });
}