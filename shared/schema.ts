import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, uuid, unique, jsonb, index, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for express-session with connect-pg-simple
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (reserved for future multi-tenancy features)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business logic: Clients table (companies/organizations)
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").unique(), // Reserved for future use
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  phone: text("phone"),
  isAdmin: boolean("is_admin").notNull().default(false),
});

// Company Users: Multiple users can access the same company
export const companyUsers = pgTable("company_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  email: text("email"),
  phone: text("phone"),
  departmentType: text("department_type"), // 'finance', 'purchase', 'warehouse', null
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clientDepartments = pgTable("client_departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  departmentType: text("department_type").notNull(), // 'finance', 'purchase', 'warehouse'
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
});

export const clientLocations = pgTable("client_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  addressEn: text("address_en").notNull(),
  addressAr: text("address_ar").notNull(),
  city: text("city"),
  country: text("country"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  isHeadquarters: boolean("is_headquarters").default(false),
  phone: text("phone"),
});

export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorNumber: text("vendor_number").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sku: text("sku").notNull().unique(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  categoryNum: text("category_num"),
  unitType: text("unit_type"),
  unit: text("unit"),
  unitPerBox: text("unit_per_box"),
  costPricePerBox: decimal("cost_price_per_box", { precision: 10, scale: 2 }),
  specificationsAr: text("specifications_ar"),
  vendorId: varchar("vendor_id").references(() => vendors.id, { onDelete: "set null" }),
  mainCategory: text("main_category"),
  category: text("category"),
  costPricePerPiece: decimal("cost_price_per_piece", { precision: 10, scale: 2 }),
  sellingPricePack: decimal("selling_price_pack", { precision: 10, scale: 2 }),
  sellingPricePiece: decimal("selling_price_piece", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
  imageUrls: jsonb("image_urls"),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
});

export const ltas = pgTable("ltas", {
  id: uuid("id").defaultRandom().primaryKey(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ltaProducts = pgTable("lta_products", {
  id: uuid("id").defaultRandom().primaryKey(),
  ltaId: uuid("lta_id").notNull().references(() => ltas.id, { onDelete: "restrict" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  contractPrice: decimal("contract_price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueLtaProduct: unique().on(table.ltaId, table.productId),
}));

export const ltaClients = pgTable("lta_clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  ltaId: uuid("lta_id").notNull().references(() => ltas.id, { onDelete: "restrict" }),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueLtaClient: unique().on(table.ltaId, table.clientId),
}));

export const clientPricing = pgTable("client_pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  productId: varchar("product_id").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  importedAt: timestamp("imported_at").defaultNow(),
});

export const orderTemplates = pgTable("order_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  items: text("items").notNull(), // JSON string
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Templates table for PDF/document templates
export const templates = pgTable("templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  category: text("category", {
    enum: ["price_offer", "order", "invoice", "contract", "report", "other"]
  }).notNull(),
  language: text("language", { enum: ["en", "ar", "both"] }).notNull().default("both"),
  sections: jsonb("sections").notNull(),
  variables: jsonb("variables").notNull(),
  styles: jsonb("styles").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  ltaId: uuid("lta_id").references(() => ltas.id, { onDelete: "restrict" }),
  items: text("items").notNull(), // JSON string
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, processing, shipped, delivered, cancelled, modification_requested
  pipefyCardId: text("pipefy_card_id"),
  cancellationReason: text("cancellation_reason"),
  cancelledAt: timestamp("cancelled_at"),
  cancelledBy: varchar("cancelled_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order modification requests table
export const orderModifications = pgTable("order_modifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  requestedBy: varchar("requested_by").notNull(), // Client ID
  modificationType: text("modification_type").notNull(), // 'items', 'cancel', 'both'
  newItems: text("new_items"), // JSON string of new items (if modifying items)
  newTotalAmount: decimal("new_total_amount", { precision: 10, scale: 2 }),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  adminResponse: text("admin_response"),
  reviewedBy: varchar("reviewed_by"), // Admin ID
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  titleEn: text("title_en").notNull(),
  titleAr: text("title_ar").notNull(),
  messageEn: text("message_en").notNull(),
  messageAr: text("message_ar").notNull(),
  isRead: boolean("is_read").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Documents table - Comprehensive document management
export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  documentType: text("document_type").notNull(), // 'price_offer', 'order', 'invoice', 'contract', 'lta_document', 'other'
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "set null" }),
  ltaId: uuid("lta_id").references(() => ltas.id, { onDelete: "set null" }),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "set null" }),
  priceOfferId: varchar("price_offer_id").references(() => priceOffers.id, { onDelete: "set null" }),
  fileSize: integer("file_size"), // in bytes
  viewCount: integer("view_count").notNull().default(0),
  checksum: text("checksum"), // SHA-256 or MD5 hash for integrity verification
  metadata: jsonb("metadata"), // Additional flexible metadata
  parentDocumentId: uuid("parent_document_id"), // Self-reference added after table creation
  versionNumber: integer("version_number").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastViewedAt: timestamp("last_viewed_at"),
});

// Document Access Logs table - Audit trail
export const documentAccessLogs = pgTable("document_access_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "set null" }),
  action: text("action").notNull(), // 'view', 'download', 'generate'
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  accessedAt: timestamp("accessed_at").defaultNow().notNull(),
});

// Price Offers table
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Can be companyId or companyUserId
  userType: text("user_type").notNull(), // 'client' or 'company_user'
  endpoint: text("endpoint").notNull().unique(),
  keys: jsonb("keys").notNull(), // {p256dh: string, auth: string}
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Price Requests: Clients request price quotes for selected products
export const priceRequests = pgTable("price_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestNumber: text("request_number").notNull().unique(),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "restrict" }),
  ltaId: uuid("lta_id").notNull().references(() => ltas.id, { onDelete: "restrict" }),
  products: jsonb("products").notNull(), // Array of {productId, quantity}
  notes: text("notes"),
  status: text("status").notNull().default("pending"), // pending, processed, cancelled
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

// Price Offers: Admin creates and sends price offers with pricing
export const priceOffers = pgTable("price_offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  offerNumber: text("offer_number").notNull().unique(),
  requestId: varchar("request_id").references(() => priceRequests.id, { onDelete: "set null" }), // Can be null if admin creates directly
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "restrict" }),
  ltaId: uuid("lta_id").notNull().references(() => ltas.id, { onDelete: "restrict" }),
  items: jsonb("items").notNull(), // Array of {productId, nameEn, nameAr, sku, quantity, unitPrice, total}
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 12, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  validUntil: timestamp("valid_until").notNull(),
  status: text("status").notNull().default("draft"), // draft, sent, viewed, accepted, rejected, expired
  pdfFileName: text("pdf_file_name"),
  createdBy: varchar("created_by").references(() => clients.id, { onDelete: "set null" }), // Admin who created it
  createdAt: timestamp("created_at").defaultNow().notNull(),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  respondedAt: timestamp("responded_at"),
  responseNote: text("response_note"),
});


// Insert schemas
// Note: insertClientSchema expects a raw password that will be hashed by the auth layer before storage
export const insertClientSchema = createInsertSchema(clients).omit({ id: true });
export const insertCompanyUserSchema = createInsertSchema(companyUsers).omit({ id: true, createdAt: true });
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({ id: true, createdAt: true });
export const insertClientDepartmentSchema = createInsertSchema(clientDepartments).omit({ id: true });
export const insertClientLocationSchema = createInsertSchema(clientLocations).omit({ id: true });
export const insertVendorSchema = createInsertSchema(vendors).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertLtaSchema = createInsertSchema(ltas).omit({ id: true, createdAt: true }).extend({
  startDate: z.union([z.date(), z.string().transform(str => new Date(str))]),
  endDate: z.union([z.date(), z.string().transform(str => new Date(str))]),
});
export const insertLtaProductSchema = createInsertSchema(ltaProducts).omit({ id: true, createdAt: true });
export const insertLtaClientSchema = createInsertSchema(ltaClients).omit({ id: true, createdAt: true });
export const insertClientPricingSchema = createInsertSchema(clientPricing).omit({ id: true, importedAt: true });
export const insertOrderTemplateSchema = createInsertSchema(orderTemplates).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderModificationSchema = createInsertSchema(orderModifications).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, isRead: true, metadata: true });
export const insertPriceRequestSchema = createInsertSchema(priceRequests).omit({ id: true, requestedAt: true });
export const insertPriceOfferSchema = createInsertSchema(priceOffers).omit({ id: true, createdAt: true });

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true, lastViewedAt: true, viewCount: true, versionNumber: true });
export const insertDocumentAccessLogSchema = createInsertSchema(documentAccessLogs).omit({ id: true, accessedAt: true });
export const insertOrderHistorySchema = createInsertSchema(orderHistory).omit({ id: true, changedAt: true });

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// Price import schema
export const priceImportRowSchema = z.object({
  sku: z.string(),
  price: z.string(),
  currency: z.string().optional().default("USD"),
});

// Cart item schema for order validation
export const cartItemSchema = z.object({
  productId: z.string(),
  nameEn: z.string(),
  nameAr: z.string(),
  price: z.string(),
  quantity: z.number().int().positive(),
  sku: z.string(),
});

// Department validation schemas
export const createDepartmentSchema = insertClientDepartmentSchema.omit({ clientId: true });
export const updateDepartmentSchema = createDepartmentSchema.partial();

// Location validation schemas
export const createLocationSchema = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  addressEn: z.string().min(1, 'English address is required'),
  addressAr: z.string().min(1, 'Arabic address is required'),
  city: z.string().optional(),
  country: z.string().optional(),
  isHeadquarters: z.boolean().default(false),
  phone: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const updateLocationSchema = createLocationSchema.partial();

// Vendor validation schemas
export const createVendorSchema = insertVendorSchema;
export const updateVendorSchema = createVendorSchema.partial();

// Order creation schema
export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    price: z.string(),
    ltaId: z.string(),
    sku: z.string(),
  })),
  totalAmount: z.string().optional(),
  status: z.string().optional(),
  pipefyCardId: z.string().optional(),
});

// Product management schemas
export const createProductSchema = insertProductSchema.extend({
  categoryNum: z.string().optional(),
  unitType: z.string().optional(),
  unit: z.string().optional(),
  unitPerBox: z.string().optional(),
  boxFillingQty: z.string().optional(),
  costPricePerBox: z.string().optional(),
  specificationsAr: z.string().optional(),
  vendor: z.string().optional(),
  vendorNum: z.string().optional(),
  mainCategory: z.string().optional(),
  category: z.string().optional(),
  costPricePerPiece: z.string().optional(),
  sellingPricePack: z.string().optional(),
  sellingPricePiece: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
});
export const updateProductSchema = createProductSchema.partial();


// Template save schema
export const saveTemplateSchema = z.object({
  nameEn: z.string().min(1),
  nameAr: z.string().min(1),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
  })),
});

// Client update schema (admin)
export const updateClientSchema = insertClientSchema.pick({
  nameEn: true,
  nameAr: true,
  email: true,
  phone: true,
});

// Client creation schema (admin with password)
export const createClientSchema = insertClientSchema.omit({ isAdmin: true });

// Client self-update schema (clients can update own info)
export const updateOwnProfileSchema = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
});

// Company user validation schemas
export const createCompanyUserSchema = insertCompanyUserSchema.omit({ companyId: true });
export const updateCompanyUserSchema = z.object({
  nameEn: z.string().min(1, 'English name is required').optional(),
  nameAr: z.string().min(1, 'Arabic name is required').optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  departmentType: z.string().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
}).partial();

// Schema for bulk product assignment to LTA
export const bulkAssignProductsSchema = z.object({
  ltaId: z.string().uuid(),
  products: z.array(z.object({
    sku: z.string().min(1, 'SKU is required'),
    contractPrice: z.string().min(1, 'Contract price is required'),
    currency: z.string().default('USD'),
  })),
});

export type BulkAssignProducts = z.infer<typeof bulkAssignProductsSchema>;

// Types
export type Client = typeof clients.$inferSelect;
export type CompanyUser = typeof companyUsers.$inferSelect;
export type ClientDepartment = typeof clientDepartments.$inferSelect;
export type ClientLocation = typeof clientLocations.$inferSelect & {
  latitude?: string | null;
  longitude?: string | null;
};
export type Vendor = typeof vendors.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Lta = typeof ltas.$inferSelect;
export type LtaProduct = typeof ltaProducts.$inferSelect;
export type LtaClient = typeof ltaClients.$inferSelect;
export type ClientPricing = typeof clientPricing.$inferSelect;
export type OrderTemplate = typeof orderTemplates.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderModification = typeof orderModifications.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type PriceRequest = typeof priceRequests.$inferSelect;
export type PriceOffer = typeof priceOffers.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type DocumentAccessLog = typeof documentAccessLogs.$inferSelect;
export type OrderHistory = typeof orderHistory.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertCompanyUser = z.infer<typeof insertCompanyUserSchema>;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type InsertClientDepartment = z.infer<typeof insertClientDepartmentSchema>;
export type InsertClientLocation = z.infer<typeof insertClientLocationSchema>;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertLta = z.infer<typeof insertLtaSchema>;
export type InsertLtaProduct = z.infer<typeof insertLtaProductSchema>;
export type InsertLtaClient = z.infer<typeof insertLtaClientSchema>;
export type InsertClientPricing = z.infer<typeof insertClientPricingSchema>;
export type InsertOrderTemplate = z.infer<typeof insertOrderTemplateSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderModification = z.infer<typeof insertOrderModificationSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertPriceRequest = z.infer<typeof insertPriceRequestSchema>;
export type InsertPriceOffer = z.infer<typeof insertPriceOfferSchema>;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertDocumentAccessLog = z.infer<typeof insertDocumentAccessLogSchema>;
export type InsertOrderHistory = z.infer<typeof insertOrderHistorySchema>;

export type LoginCredentials = z.infer<typeof loginSchema>;
export type PriceImportRow = z.infer<typeof priceImportRowSchema>;

// Replit Auth user types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

export interface CartItem {
  productId: string;
  nameEn: string;
  nameAr: string;
  price: string;
  quantity: number;
  sku: string;
  ltaId: string;
  currency: string;
}

export interface AuthUser {
  id: string; // Company/Client ID (for backwards compatibility with existing routes)
  userId?: string; // Company User ID (for multi-user system)
  username: string;
  nameEn: string;
  nameAr: string;
  email?: string;
  phone?: string;
  isAdmin: boolean;
  companyId?: string; // Same as id, kept for clarity
  companyNameEn?: string;
  companyNameAr?: string;
}

// Demo Request table schema
export const demoRequests = pgTable("demo_requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  company: text("company").notNull(),
  message: text("message"),
  status: text("status").notNull().default('pending'), // pending, contacted, scheduled, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Order History table for tracking status changes
export const orderHistory = pgTable("order_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  changedBy: varchar("changed_by").notNull(),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
  notes: text("notes"),
  isAdminNote: boolean("is_admin_note").default(false).notNull(),
});