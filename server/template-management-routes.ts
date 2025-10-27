import type { Express, Request, Response } from "express";
import { requireAuth, requireAdmin, AuthenticatedRequest, AdminRequest } from "./auth";
import { TemplateStorage } from "./template-storage";
import { TemplateManager } from "./template-manager";
import { TemplateGenerator } from "./template-generator";
import { DocumentTemplate, TemplateVariable } from "@shared/template-schema";
import { z } from "zod";

// Validation schemas
const generateDocumentSchema = z.object({
  category: z.string(),
  variables: z.array(z.object({
    key: z.string(),
    value: z.any()
  })),
  templateId: z.string().uuid().optional(),
  language: z.enum(['en', 'ar', 'both']).default('both')
});

const setDefaultTemplateSchema = z.object({
  templateId: z.string().uuid()
});

const validateTemplateSchema = z.object({
  template: z.object({
    nameEn: z.string(),
    nameAr: z.string(),
    category: z.string(),
    language: z.string(),
    sections: z.array(z.any()),
    variables: z.array(z.string()),
    styles: z.object({
      primaryColor: z.string(),
      secondaryColor: z.string(),
      accentColor: z.string(),
      fontSize: z.number(),
      fontFamily: z.string().optional(),
      headerHeight: z.number().optional(),
      footerHeight: z.number().optional(),
      margins: z.object({
        top: z.number(),
        bottom: z.number(),
        left: z.number(),
        right: z.number()
      }).optional()
    })
  })
});

export function setupTemplateManagementRoutes(app: Express) {
  // 1. Generate Document from Template (using TemplateManager)
  app.post('/api/templates/generate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validation = generateDocumentSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors
        });
      }

      const { category, variables, templateId, language } = validation.data;

      console.log('📄 Template document generation request:', {
        category,
        templateId,
        language,
        variableCount: variables.length,
        userId: req.user?.id
      });

      // Convert variables to TemplateVariable format
      const templateVariables: TemplateVariable[] = variables.map(v => ({
        key: v.key,
        value: v.value
      }));

      // Generate document using TemplateManager
      const pdfBuffer = await TemplateManager.generateDocument(
        category,
        templateVariables,
        templateId
      );

      if (!pdfBuffer || pdfBuffer.length === 0) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate document'
        });
      }

      console.log('✅ Document generated successfully:', {
        size: pdfBuffer.length,
        sizeKB: Math.round(pdfBuffer.length / 1024)
      });

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${category}_${Date.now()}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Template document generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // 2. Get Default Template for Category
  app.get('/api/templates/default/:category', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { category } = req.params;
      
      const defaultTemplate = await TemplateManager.getDefaultTemplate(category);
      
      if (!defaultTemplate) {
        return res.status(404).json({
          success: false,
          error: 'No default template found for this category'
        });
      }

      res.json({
        success: true,
        template: defaultTemplate
      });

    } catch (error) {
      console.error('Get default template error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get default template'
      });
    }
  });

  // 3. Set Default Template (Admin Only)
  app.post('/api/admin/templates/set-default', requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const validation = setDefaultTemplateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors
        });
      }

      const { templateId } = validation.data;

      const success = await TemplateManager.setDefaultTemplate(templateId);
      
      if (!success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to set default template'
        });
      }

      res.json({
        success: true,
        message: 'Default template set successfully'
      });

    } catch (error) {
      console.error('Set default template error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to set default template'
      });
    }
  });

  // 4. Validate Template (Admin Only)
  app.post('/api/admin/templates/validate', requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const validation = validateTemplateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors
        });
      }

      const { template } = validation.data;
      
      const result = await TemplateManager.validateTemplate(template as DocumentTemplate);

      res.json({
        success: true,
        valid: result.valid,
        errors: result.errors
      });

    } catch (error) {
      console.error('Template validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate template'
      });
    }
  });

  // 5. Get Template Statistics (Admin Only)
  app.get('/api/admin/templates/stats', requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const stats = await TemplateManager.getTemplateStats();

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('Get template stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get template statistics'
      });
    }
  });

  // 6. Preview Template with Sample Data (Admin Only)
  app.post('/api/admin/templates/:id/preview', requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { variables = [], language = 'en' } = req.body;

      const template = await TemplateStorage.getTemplate(id);
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      // Convert template to DocumentTemplate format
      const documentTemplate: DocumentTemplate = {
        id: template.id,
        nameEn: template.nameEn,
        nameAr: template.nameAr,
        descriptionEn: template.descriptionEn,
        descriptionAr: template.descriptionAr,
        category: template.category,
        language: template.language,
        sections: JSON.parse(template.sections),
        variables: JSON.parse(template.variables),
        styles: JSON.parse(template.styles),
        isActive: template.isActive,
        isDefault: template.isDefault,
        version: template.version || 1,
        tags: template.tags || [],
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      };

      // Convert variables to TemplateVariable format
      const templateVariables: TemplateVariable[] = variables.map((v: any) => ({
        key: v.key,
        value: v.value
      }));

      const pdfBuffer = await TemplateGenerator.generateFromTemplate(
        documentTemplate,
        templateVariables
      );

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

  // 7. Get Available Templates by Category
  app.get('/api/templates/category/:category', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { category } = req.params;
      
      const templates = await TemplateStorage.getTemplates(category);
      
      // Filter to only active templates for non-admin users
      const activeTemplates = req.user?.isAdmin 
        ? templates 
        : templates.filter(t => t.isActive);

      res.json({
        success: true,
        templates: activeTemplates
      });

    } catch (error) {
      console.error('Get templates by category error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get templates'
      });
    }
  });

  // 8. Get Template Variables
  app.get('/api/templates/:id/variables', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const template = await TemplateStorage.getTemplate(id);
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      const variables = JSON.parse(template.variables);

      res.json({
        success: true,
        variables
      });

    } catch (error) {
      console.error('Get template variables error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get template variables'
      });
    }
  });
}