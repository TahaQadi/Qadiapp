
import { z } from 'zod';

export const templateSectionSchema = z.object({
  type: z.enum(['header', 'body', 'table', 'footer', 'signature']),
  content: z.any(),
});

export const createTemplateSchema = z.object({
  nameEn: z.string().min(1, 'Template name (English) is required'),
  nameAr: z.string().min(1, 'Template name (Arabic) is required'),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  category: z.enum(['price_offer', 'order', 'invoice', 'contract', 'report', 'other']),
  language: z.enum(['en', 'ar', 'both']),
  sections: z.array(templateSectionSchema),
  variables: z.array(z.string()),
  styles: z.object({
    primaryColor: z.string(),
    secondaryColor: z.string(),
    accentColor: z.string(),
    fontSize: z.number(),
  }),
  isActive: z.boolean().default(true),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type TemplateSection = z.infer<typeof templateSectionSchema>;
