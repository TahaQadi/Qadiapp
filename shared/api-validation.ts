import { z } from "zod";
import { paginationSchema } from "./api-types";

/**
 * Common Validation Schemas
 * Reusable validation schemas for API requests/responses
 */

// Common field validators
export const validators = {
  id: z.string().uuid("Invalid ID format"),
  email: z.string().email("Invalid email format").optional(),
  phone: z.string().min(7, "Phone number too short").optional(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  url: z.string().url("Invalid URL format").optional(),
  nonEmptyString: z.string().min(1, "This field is required"),
  positiveNumber: z.number().positive("Must be a positive number"),
  nonNegativeNumber: z.number().nonnegative("Must be non-negative"),
  // Coerced versions for query parameters (strings that should be numbers)
  positiveNumberCoerced: z.coerce.number().positive("Must be a positive number"),
  nonNegativeNumberCoerced: z.coerce.number().nonnegative("Must be non-negative"),
  date: z.string().datetime().or(z.date()),
} as const;

// Pagination request schema (with query string coercion)
export const paginatedRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
});

export type PaginatedRequest = z.infer<typeof paginatedRequestSchema>;

// Product validation schemas
export const createProductSchema = z.object({
  nameEn: validators.nonEmptyString,
  nameAr: validators.nonEmptyString,
  sku: validators.nonEmptyString,
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  unit: z.string().optional(),
  imageUrl: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateProductSchema = createProductSchema.partial();

// LTA validation schemas
const ltaBaseSchema = z.object({
  nameEn: validators.nonEmptyString,
  nameAr: validators.nonEmptyString,
  contractNumber: validators.nonEmptyString,
  startDate: validators.date,
  endDate: validators.date,
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  status: z.enum(['active', 'inactive', 'expired']).default('active'),
});

export const createLtaSchema = ltaBaseSchema.refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);

export const updateLtaSchema = ltaBaseSchema.partial();

// LTA Product assignment schema
export const assignLtaProductSchema = z.object({
  ltaId: validators.id,
  productId: validators.id,
  pricePerUnit: validators.nonNegativeNumber,
  currency: z.string().default('SAR'),
  notes: z.string().optional(),
});

export const bulkAssignLtaProductsSchema = z.object({
  ltaId: validators.id,
  products: z.array(z.object({
    productId: validators.id,
    pricePerUnit: validators.nonNegativeNumber,
    currency: z.string().default('SAR'),
    notes: z.string().optional(),
  })).min(1, "At least one product is required"),
});

// Client validation schemas
export const createClientSchema = z.object({
  nameEn: validators.nonEmptyString,
  nameAr: validators.nonEmptyString,
  username: validators.username,
  password: validators.password,
  email: validators.email,
  phone: validators.phone,
  isAdmin: z.boolean().default(false),
});

export const updateClientSchema = createClientSchema.partial().omit({ password: true });

export const changePasswordSchema = z.object({
  currentPassword: validators.password,
  newPassword: validators.password,
  confirmPassword: validators.password,
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }
);

// Company User validation schemas
export const createCompanyUserSchema = z.object({
  companyId: validators.id,
  username: validators.username,
  password: validators.password,
  nameEn: validators.nonEmptyString,
  nameAr: validators.nonEmptyString,
  email: validators.email,
  phone: validators.phone,
  departmentType: z.enum(['finance', 'purchase', 'warehouse']).optional(),
  isActive: z.boolean().default(true),
});

export const updateCompanyUserSchema = createCompanyUserSchema.partial().omit({ 
  password: true,
  companyId: true,
});

// Order validation schemas
export const createOrderItemSchema = z.object({
  productId: validators.id,
  ltaProductId: validators.id,
  quantity: validators.positiveNumber,
  pricePerUnit: validators.nonNegativeNumber,
  notes: z.string().optional(),
});

export const createOrderSchema = z.object({
  ltaId: validators.id,
  clientId: validators.id,
  departmentId: validators.id.optional(),
  locationId: validators.id.optional(),
  deliveryDate: validators.date.optional(),
  notes: z.string().optional(),
  items: z.array(createOrderItemSchema).min(1, "At least one item is required"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'modification_requested',
  ]),
  notes: z.string().optional(),
});

// Order Modification validation schemas
export const createOrderModificationSchema = z.object({
  orderId: validators.id,
  modificationType: z.enum(['cancel', 'quantity_change', 'delivery_date_change', 'other']),
  requestedChanges: z.string().min(10, "Please provide detailed change description"),
  reason: z.string().optional(),
});

export const reviewOrderModificationSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewNotes: z.string().optional(),
});

// Order Template validation schemas
export const createOrderTemplateSchema = z.object({
  clientId: validators.id,
  nameEn: validators.nonEmptyString,
  nameAr: validators.nonEmptyString,
  ltaId: validators.id,
  items: z.array(z.object({
    productId: validators.id,
    ltaProductId: validators.id,
    quantity: validators.positiveNumber,
  })).min(1, "At least one item is required"),
});

export const updateOrderTemplateSchema = createOrderTemplateSchema.partial().omit({ clientId: true });

// Price Request validation schemas
export const createPriceRequestSchema = z.object({
  ltaId: validators.id,
  clientId: validators.id,
  requestedProducts: z.array(z.object({
    productId: validators.id,
    quantity: validators.positiveNumber,
    notes: z.string().optional(),
  })).min(1, "At least one product is required"),
  notes: z.string().optional(),
});

export const updatePriceRequestStatusSchema = z.object({
  status: z.enum(['pending', 'processed', 'cancelled']),
  notes: z.string().optional(),
});

// Price Offer validation schemas
export const createPriceOfferItemSchema = z.object({
  productId: validators.id,
  ltaProductId: validators.id.optional(),
  quantity: validators.positiveNumber,
  pricePerUnit: validators.nonNegativeNumber,
  currency: z.string().default('SAR'),
  notes: z.string().optional(),
});

export const createPriceOfferSchema = z.object({
  clientId: validators.id,
  ltaId: validators.id,
  priceRequestId: validators.id.optional(),
  validUntil: validators.date,
  notes: z.string().optional(),
  items: z.array(createPriceOfferItemSchema).min(1, "At least one item is required"),
});

export const updatePriceOfferSchema = createPriceOfferSchema.partial().omit({ clientId: true });

export const sendPriceOfferSchema = z.object({
  offerId: validators.id,
});

export const respondToPriceOfferSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
  responseNotes: z.string().optional(),
});

// Template (PDF template) validation schemas
export const createTemplateSchema = z.object({
  nameEn: validators.nonEmptyString,
  nameAr: validators.nonEmptyString,
  type: z.enum(['order', 'price_offer', 'invoice', 'lta_contract']),
  content: validators.nonEmptyString,
  isActive: z.boolean().default(true),
});

export const updateTemplateSchema = createTemplateSchema.partial();

// Document generation schemas
export const generateDocumentSchema = z.object({
  type: z.enum(['order', 'price_offer', 'invoice', 'lta_contract']),
  entityId: validators.id,
  templateId: validators.id.optional(),
  format: z.enum(['pdf']).default('pdf'),
});

// Feedback validation schemas
export const createFeedbackSchema = z.object({
  orderId: validators.id,
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  category: z.enum(['product_quality', 'delivery_time', 'service', 'pricing', 'other']).optional(),
});

// File upload validation
export const fileUploadSchema = z.object({
  fileName: validators.nonEmptyString,
  fileSize: z.number().positive(),
  mimeType: z.string(),
}).refine(
  (data) => data.fileSize <= 5 * 1024 * 1024, // 5MB max
  {
    message: "File size must be less than 5MB",
    path: ["fileSize"],
  }
).refine(
  (data) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'].includes(data.mimeType),
  {
    message: "Invalid file type. Allowed: JPEG, PNG, WEBP, PDF",
    path: ["mimeType"],
  }
);

// Login validation
export const loginSchema = z.object({
  username: validators.username,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

// Bulk operations
export const bulkDeleteSchema = z.object({
  ids: z.array(validators.id).min(1, "At least one ID is required"),
});

export const bulkUpdateStatusSchema = z.object({
  ids: z.array(validators.id).min(1, "At least one ID is required"),
  status: z.string(),
});

/**
 * Helper function to validate request body
 */
export function validateRequest<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  return schema.parse(data);
}

/**
 * Helper function to safely validate with error handling
 */
export function safeValidateRequest<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
