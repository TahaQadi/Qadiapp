
import { z } from 'zod';

export const templateSectionSchema = z.object({
  type: z.enum(['header', 'body', 'table', 'footer', 'signature', 'image', 'divider', 'spacer', 'terms']),
  content: z.any(),
  condition: z.string().optional(), // Conditional rendering: e.g., "{{total}} > 1000"
  order: z.number().default(0), // Section ordering
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
    fontFamily: z.string().default('Helvetica'),
    headerHeight: z.number().default(100),
    footerHeight: z.number().default(60),
    margins: z.object({
      top: z.number().default(120),
      bottom: z.number().default(80),
      left: z.number().default(50),
      right: z.number().default(50),
    }).optional(),
  }),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false), // Set as default for category
  version: z.number().default(1),
  tags: z.array(z.string()).optional(), // For filtering/searching
});

export const updateTemplateSchema = createTemplateSchema.partial();

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type TemplateSection = z.infer<typeof templateSectionSchema>;
