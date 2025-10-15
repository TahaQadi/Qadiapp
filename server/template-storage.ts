
import { db } from './db';
import { templates } from './db';
import { eq } from 'drizzle-orm';
import { CreateTemplateInput, UpdateTemplateInput } from '@shared/template-schema';

export class TemplateStorage {
  static async createTemplate(data: CreateTemplateInput) {
    const [template] = await db.insert(templates).values({
      nameEn: data.nameEn,
      nameAr: data.nameAr,
      descriptionEn: data.descriptionEn,
      descriptionAr: data.descriptionAr,
      category: data.category,
      language: data.language,
      sections: JSON.stringify(data.sections),
      variables: JSON.stringify(data.variables),
      styles: JSON.stringify(data.styles),
      isActive: data.isActive,
    }).returning();
    
    return template;
  }

  static async getTemplates(category?: string) {
    if (category) {
      return await db.query.templates.findMany({
        where: eq(templates.category, category),
        orderBy: (templates, { desc }) => [desc(templates.createdAt)],
      });
    }
    
    return await db.query.templates.findMany({
      orderBy: (templates, { desc }) => [desc(templates.createdAt)],
    });
  }

  static async getTemplate(id: string) {
    return await db.query.templates.findFirst({
      where: eq(templates.id, id),
    });
  }

  static async updateTemplate(id: string, data: UpdateTemplateInput) {
    const updateData: any = {};
    
    if (data.nameEn !== undefined) updateData.nameEn = data.nameEn;
    if (data.nameAr !== undefined) updateData.nameAr = data.nameAr;
    if (data.descriptionEn !== undefined) updateData.descriptionEn = data.descriptionEn;
    if (data.descriptionAr !== undefined) updateData.descriptionAr = data.descriptionAr;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.sections !== undefined) updateData.sections = JSON.stringify(data.sections);
    if (data.variables !== undefined) updateData.variables = JSON.stringify(data.variables);
    if (data.styles !== undefined) updateData.styles = JSON.stringify(data.styles);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

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

  static async duplicateTemplate(id: string, newName: { en: string; ar: string }) {
    const original = await this.getTemplate(id);
    if (!original) throw new Error('Template not found');

    const [duplicate] = await db.insert(templates).values({
      nameEn: newName.en,
      nameAr: newName.ar,
      descriptionEn: original.descriptionEn,
      descriptionAr: original.descriptionAr,
      category: original.category,
      language: original.language,
      sections: original.sections,
      variables: original.variables,
      styles: original.styles,
      isActive: false,
    }).returning();

    return duplicate;
  }
}
