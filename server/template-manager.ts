import { TemplatePDFGenerator } from './template-pdf-generator';
import { DocumentTemplate, TemplateVariable } from '@shared/template-schema';
import { getHardcodedTemplate } from './hardcoded-templates';

export class TemplateManager {
  static async getDefaultTemplate(category: string): Promise<DocumentTemplate | null> {
    // Use hardcoded templates instead of database
    const template = getHardcodedTemplate(category);
    if (template) {
      return template;
    }
    
    console.warn(`No hardcoded template found for category: ${category}`);
    return null;
  }

  static async generateDocument(
    category: string,
    variables: TemplateVariable[],
    templateId?: string, // Ignored - using hardcoded templates only
    userId?: string // Optional, not used but kept for compatibility
  ): Promise<Buffer | null> {
    try {
      // Always use hardcoded template for the category
      const template = await this.getDefaultTemplate(category);
      
      if (!template) {
        throw new Error(`No template found for category: ${category}`);
      }
      
      // Convert to TemplatePDFGenerator format
      const templateForGenerator = {
        ...template,
        nameEn: template.name,
        nameAr: template.name,
        descriptionEn: template.description || '',
        descriptionAr: template.description || ''
      };
      
      const pdfBuffer = await TemplatePDFGenerator.generate({
        template: templateForGenerator as any,
        variables,
        language: 'ar' // Arabic-only system
      });

      return pdfBuffer;
    } catch (error) {
      console.error('Error generating document:', error);
      return null;
    }
  }

}