import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, uuid, unique, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Replit Auth: Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Replit Auth: User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business logic: Clients table (linked to Replit Auth users)
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").unique(), // Link to Replit Auth user
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  phone: text("phone"),
  isAdmin: boolean("is_admin").notNull().default(false),
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
  isHeadquarters: boolean("is_headquarters").default(false),
  phone: text("phone"),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  sku: text("sku").notNull().unique(),
  imageUrl: text("image_url"),
  category: text("category"),
  metadata: text("metadata"),
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

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  ltaId: uuid("lta_id").references(() => ltas.id, { onDelete: "restrict" }),
  items: text("items").notNull(), // JSON string
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  pipefyCardId: text("pipefy_card_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  type: text("type").notNull(), // e.g., 'order_created', 'order_status_changed', 'system'
  titleEn: text("title_en").notNull(),
  titleAr: text("title_ar").notNull(),
  messageEn: text("message_en").notNull(),
  messageAr: text("message_ar").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


// Insert schemas
// Note: insertClientSchema expects a raw password that will be hashed by the auth layer before storage
export const insertClientSchema = createInsertSchema(clients).omit({ id: true });
export const insertClientDepartmentSchema = createInsertSchema(clientDepartments).omit({ id: true });
export const insertClientLocationSchema = createInsertSchema(clientLocations).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertLtaSchema = createInsertSchema(ltas).omit({ id: true, createdAt: true }).extend({
  startDate: z.union([z.date(), z.string().transform(str => new Date(str))]),
  endDate: z.union([z.date(), z.string().transform(str => new Date(str))]),
});
export const insertLtaProductSchema = createInsertSchema(ltaProducts).omit({ id: true, createdAt: true });
export const insertLtaClientSchema = createInsertSchema(ltaClients).omit({ id: true, createdAt: true });
export const insertClientPricingSchema = createInsertSchema(clientPricing).omit({ id: true, importedAt: true });
export const insertOrderTemplateSchema = createInsertSchema(orderTemplates).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, isRead: true });


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
export const createLocationSchema = insertClientLocationSchema.omit({ clientId: true });
export const updateLocationSchema = createLocationSchema.partial();

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
  metadata: z.string().optional().nullable(),
});
export const updateProductSchema = createProductSchema.partial().extend({
  metadata: z.string().optional().nullable(),
});


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
export type ClientDepartment = typeof clientDepartments.$inferSelect;
export type ClientLocation = typeof clientLocations.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Lta = typeof ltas.$inferSelect;
export type LtaProduct = typeof ltaProducts.$inferSelect;
export type LtaClient = typeof ltaClients.$inferSelect;
export type ClientPricing = typeof clientPricing.$inferSelect;
export type OrderTemplate = typeof orderTemplates.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertClientDepartment = z.infer<typeof insertClientDepartmentSchema>;
export type InsertClientLocation = z.infer<typeof insertClientLocationSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertLta = z.infer<typeof insertLtaSchema>;
export type InsertLtaProduct = z.infer<typeof insertLtaProductSchema>;
export type InsertLtaClient = z.infer<typeof insertLtaClientSchema>;
export type InsertClientPricing = z.infer<typeof insertClientPricingSchema>;
export type InsertOrderTemplate = z.infer<typeof insertOrderTemplateSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

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
  id: string;
  username: string;
  nameEn: string;
  nameAr: string;
  email?: string;
  phone?: string;
  isAdmin: boolean;
}