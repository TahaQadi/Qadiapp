
import { z } from 'zod';

export const templateSectionSchema = z.object({
  type: z.enum(['header', 'body', 'table', 'footer', 'signature', 'image', 'divider', 'spacer', 'terms']),
  content: z.any(),
  condition: z.string().optional(), // Conditional rendering: e.g., "{{total}} > 1000"
  order: z.number().default(0), // Section ordering
});

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'اسم القالب مطلوب'), // Template name required
  description: z.string().optional(),
  category: z.enum(['price_offer', 'order', 'invoice', 'contract', 'report', 'other']),
  language: z.enum(['ar']).default('ar'), // Arabic-only
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

// Template variable for PDF generation
export interface TemplateVariable {
  key: string;
  value: any;
}

// Full document template with metadata
export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  language: 'ar'; // Arabic-only
  sections: TemplateSection[];
  variables: string[];
  styles: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontSize: number;
    fontFamily?: string;
    headerHeight?: number;
    footerHeight?: number;
    margins?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
  };
  isActive?: boolean;
  isDefault?: boolean;
  version?: number;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
