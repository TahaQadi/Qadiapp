import { db } from './db';
import { templates } from './db';
import { eq } from 'drizzle-orm';
import { CreateTemplateInput, UpdateTemplateInput } from '@shared/template-schema';

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
      version: data.version || 1,
      tags: data.tags ? JSON.stringify(data.tags) : null,
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
    const template = await db.query.templates.findFirst({
      where: eq(templates.id, id),
    });

    return template;
  }

  static async updateTemplate(id: string, data: Partial<UpdateTemplateInput>): Promise<any | null> {
    try {
      const current = await this.getTemplate(id);
      if (!current) return null;

      // Increment version on update
      const newVersion = (current.version || 1) + 1;

      // Update template
      const updated = await db.update(templates)
        .set({
          ...data,
          version: newVersion,
          updatedAt: new Date()
        })
        .where(eq(templates.id, id))
        .returning();

      if (updated.length === 0) {
        return null;
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
      version: 1,
      tags: original.tags,
    }).returning();

    return duplicate;
  }
}
