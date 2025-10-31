import { db } from './db';
import { templates, templateVersions, templateUsageStats } from './db';
import { eq, desc } from 'drizzle-orm';
import { CreateTemplateInput, UpdateTemplateInput } from '@shared/template-schema';

// Dummy cache for demonstration purposes
const templateCache = new Map<string, any>();

export class TemplateStorage {
  static async createTemplate(data: CreateTemplateInput) {
    const [template] = await db.insert(templates).values({
      name: data.name,
      description: data.description,
      category: data.category,
      language: data.language || 'ar', // Always Arabic
      sections: JSON.stringify(data.sections),
      variables: JSON.stringify(data.variables),
      styles: JSON.stringify(data.styles),
      isActive: data.isActive,
      isDefault: data.isDefault || false,
    }).returning();

    return template;
  }

  static async getTemplates(category?: string) {
    const query = db.select().from(templates);

    if (category) {
      return await query.where(eq(templates.category, category as any)).orderBy(templates.createdAt);
    }

    return await query.orderBy(templates.createdAt);
  }

  static async getTemplate(id: string) {
    // In a real application, you would check the cache first
    // if (templateCache.has(id)) {
    //   return templateCache.get(id);
    // }

    const template = await db.query.templates.findFirst({
      where: eq(templates.id, id),
    });

    // if (template) {
    //   templateCache.set(id, template);
    // }

    return template;
  }

  static async updateTemplate(id: string, data: Partial<any>, userId?: string, changeReason?: string): Promise<any | null> {
    try {
      // Get current template to create version
      const current = await this.getTemplate(id);
      if (!current) return null;

      // Get latest version number
      const versions = await db.select()
        .from(templateVersions)
        .where(eq(templateVersions.templateId, id))
        .orderBy(desc(templateVersions.versionNumber));

      const nextVersion = versions.length > 0 ? versions[0].versionNumber + 1 : 1;

      // Create version snapshot
      await db.insert(templateVersions).values({
        templateId: id,
        versionNumber: nextVersion,
        name: current.name,
        description: current.description || '',
        sections: typeof current.sections === 'string' ? current.sections : JSON.stringify(current.sections),
        variables: typeof current.variables === 'string' ? current.variables : JSON.stringify(current.variables),
        styles: typeof current.styles === 'string' ? current.styles : JSON.stringify(current.styles),
        changedBy: userId,
        changeReason: changeReason,
      });

      // Update template
      const updated = await db.update(templates)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(templates.id, id))
        .returning();

      if (updated.length === 0) {
        return null;
      }

      // Clear cache for this template
      if (templateCache.has(id)) {
        templateCache.delete(id);
      }

      return updated[0] as any;
    } catch (error) {
      console.error('Error updating template:', error);
      return null;
    }
  }

  static async deleteTemplate(id: string) {
    await db.delete(templates).where(eq(templates.id, id));
    return true;
  }

  static async duplicateTemplate(id: string, newName: string) {
    const original = await this.getTemplate(id);
    if (!original) throw new Error('Template not found');

    const [duplicate] = await db.insert(templates).values({
      name: newName,
      description: original.description,
      category: original.category,
      language: 'ar', // Always Arabic
      sections: original.sections,
      variables: original.variables,
      styles: original.styles,
      isActive: false,
    }).returning();

    return duplicate;
  }

  static async getTemplateVersions(templateId: string) {
    try {
      return await db.select()
        .from(templateVersions)
        .where(eq(templateVersions.templateId, templateId))
        .orderBy(desc(templateVersions.createdAt));
    } catch (error) {
      console.error('Error getting template versions:', error);
      return [];
    }
  }

  static async restoreTemplateVersion(templateId: string, versionId: string, userId?: string): Promise<any | null> {
    try {
      const version = await db.select()
        .from(templateVersions)
        .where(eq(templateVersions.id, versionId))
        .limit(1);

      if (version.length === 0) return null;

      const v = version[0];
      return await this.updateTemplate(
        templateId,
        {
          name: v.name,
          description: v.description || undefined,
          sections: v.sections,
          variables: v.variables,
          styles: v.styles,
        },
        userId,
        `Restored from version ${v.versionNumber}`
      );
    } catch (error) {
      console.error('Error restoring template version:', error);
      return null;
    }
  }

  static async trackTemplateUsage(templateId: string, documentType: string, userId?: string, success: boolean = true, errorMessage?: string, generationTimeMs?: number) {
    try {
      await db.insert(templateUsageStats).values({
        templateId,
        documentType,
        userId,
        success,
        errorMessage,
        generationTimeMs,
      });
    } catch (error) {
      console.error('Error tracking template usage:', error);
    }
  }

  static async getTemplateAnalytics(templateId?: string) {
    try {
      const query = templateId
        ? db.select().from(templateUsageStats).where(eq(templateUsageStats.templateId, templateId))
        : db.select().from(templateUsageStats);

      const stats = await query;

      return {
        totalGenerations: stats.length,
        successfulGenerations: stats.filter(s => s.success).length,
        failedGenerations: stats.filter(s => !s.success).length,
        averageGenerationTime: stats.filter(s => s.generationTimeMs).reduce((sum, s) => sum + (s.generationTimeMs || 0), 0) / stats.filter(s => s.generationTimeMs).length || 0,
        byDocumentType: stats.reduce((acc, s) => {
          acc[s.documentType] = (acc[s.documentType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };
    } catch (error) {
      console.error('Error getting template analytics:', error);
      return null;
    }
  }
}