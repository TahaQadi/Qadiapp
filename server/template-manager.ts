import { TemplateStorage } from './template-storage';
import { TemplateGenerator } from './template-generator';
import { DocumentTemplate, TemplateVariable } from '@shared/template-schema';

export class TemplateManager {
  static async getDefaultTemplate(category: string): Promise<DocumentTemplate | null> {
    try {
      const templates = await TemplateStorage.getTemplates(category);
      const defaultTemplate = templates.find(t => t.isDefault);
      
      if (defaultTemplate) {
        return {
          id: defaultTemplate.id,
          nameEn: defaultTemplate.nameEn,
          nameAr: defaultTemplate.nameAr,
          descriptionEn: defaultTemplate.descriptionEn,
          descriptionAr: defaultTemplate.descriptionAr,
          category: defaultTemplate.category,
          language: defaultTemplate.language,
          sections: JSON.parse(defaultTemplate.sections),
          variables: JSON.parse(defaultTemplate.variables),
          styles: JSON.parse(defaultTemplate.styles),
          isActive: defaultTemplate.isActive,
          isDefault: defaultTemplate.isDefault,
          version: defaultTemplate.version || 1,
          tags: defaultTemplate.tags || [],
          createdAt: defaultTemplate.createdAt,
          updatedAt: defaultTemplate.updatedAt
        };
      }
      
      // If no default template, return the first active template
      const activeTemplate = templates.find(t => t.isActive);
      if (activeTemplate) {
        return {
          id: activeTemplate.id,
          nameEn: activeTemplate.nameEn,
          nameAr: activeTemplate.nameAr,
          descriptionEn: activeTemplate.descriptionEn,
          descriptionAr: activeTemplate.descriptionAr,
          category: activeTemplate.category,
          language: activeTemplate.language,
          sections: JSON.parse(activeTemplate.sections),
          variables: JSON.parse(activeTemplate.variables),
          styles: JSON.parse(activeTemplate.styles),
          isActive: activeTemplate.isActive,
          isDefault: activeTemplate.isDefault,
          version: activeTemplate.version || 1,
          tags: activeTemplate.tags || [],
          createdAt: activeTemplate.createdAt,
          updatedAt: activeTemplate.updatedAt
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting default template:', error);
      return null;
    }
  }

  static async generateDocument(
    category: string,
    variables: TemplateVariable[],
    templateId?: string
  ): Promise<Buffer | null> {
    try {
      let template: DocumentTemplate | null = null;
      
      if (templateId) {
        const templateData = await TemplateStorage.getTemplate(templateId);
        if (templateData) {
          template = {
            id: templateData.id,
            nameEn: templateData.nameEn,
            nameAr: templateData.nameAr,
            descriptionEn: templateData.descriptionEn,
            descriptionAr: templateData.descriptionAr,
            category: templateData.category,
            language: templateData.language,
            sections: JSON.parse(templateData.sections),
            variables: JSON.parse(templateData.variables),
            styles: JSON.parse(templateData.styles),
            isActive: templateData.isActive,
            isDefault: templateData.isDefault,
            version: templateData.version || 1,
            tags: templateData.tags || [],
            createdAt: templateData.createdAt,
            updatedAt: templateData.updatedAt
          };
        }
      }
      
      if (!template) {
        template = await this.getDefaultTemplate(category);
      }
      
      if (!template) {
        throw new Error(`No template found for category: ${category}`);
      }
      
      return await TemplateGenerator.generateFromTemplate(template, variables);
    } catch (error) {
      console.error('Error generating document:', error);
      return null;
    }
  }

  static async setDefaultTemplate(templateId: string): Promise<boolean> {
    try {
      const template = await TemplateStorage.getTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }
      
      // First, unset any existing default for this category
      const categoryTemplates = await TemplateStorage.getTemplates(template.category);
      for (const t of categoryTemplates) {
        if (t.isDefault) {
          await TemplateStorage.updateTemplate(t.id, { isDefault: false });
        }
      }
      
      // Set the new default
      await TemplateStorage.updateTemplate(templateId, { isDefault: true });
      
      return true;
    } catch (error) {
      console.error('Error setting default template:', error);
      return false;
    }
  }

  static async validateTemplate(template: DocumentTemplate): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Check required fields
    if (!template.nameEn) errors.push('English name is required');
    if (!template.nameAr) errors.push('Arabic name is required');
    if (!template.category) errors.push('Category is required');
    if (!template.language) errors.push('Language is required');
    if (!template.sections || template.sections.length === 0) {
      errors.push('At least one section is required');
    }
    
    // Check sections
    if (template.sections) {
      template.sections.forEach((section, index) => {
        if (!section.type) {
          errors.push(`Section ${index + 1} is missing type`);
        }
        if (!section.content) {
          errors.push(`Section ${index + 1} is missing content`);
        }
      });
    }
    
    // Check variables
    if (template.variables) {
      const variableSet = new Set(template.variables);
      if (variableSet.size !== template.variables.length) {
        errors.push('Duplicate variables found');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  static async getTemplateStats(): Promise<{
    totalTemplates: number;
    templatesByCategory: Record<string, number>;
    activeTemplates: number;
    defaultTemplates: number;
  }> {
    try {
      const templates = await TemplateStorage.getTemplates();
      
      const stats = {
        totalTemplates: templates.length,
        templatesByCategory: {} as Record<string, number>,
        activeTemplates: 0,
        defaultTemplates: 0
      };
      
      templates.forEach(template => {
        // Count by category
        if (!stats.templatesByCategory[template.category]) {
          stats.templatesByCategory[template.category] = 0;
        }
        stats.templatesByCategory[template.category]++;
        
        // Count active templates
        if (template.isActive) {
          stats.activeTemplates++;
        }
        
        // Count default templates
        if (template.isDefault) {
          stats.defaultTemplates++;
        }
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting template stats:', error);
      return {
        totalTemplates: 0,
        templatesByCategory: {},
        activeTemplates: 0,
        defaultTemplates: 0
      };
    }
  }
}