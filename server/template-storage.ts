
import { db } from './db';
import { templates } from '@shared/schema';
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
    return await db.query.templates.findFirst({
      where: eq(templates.id, id),
    });
  }

  static async updateTemplate(id: string, data: UpdateTemplateInput) {
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.language !== undefined) updateData.language = data.language || 'ar'; // Always Arabic
    if (data.sections !== undefined) updateData.sections = JSON.stringify(data.sections);
    if (data.variables !== undefined) updateData.variables = JSON.stringify(data.variables);
    if (data.styles !== undefined) updateData.styles = JSON.stringify(data.styles);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

    const [template] = await db.update(templates)
      .set(updateData)
      .where(eq(templates.id, id))
      .returning();
    
    return template;
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
}
