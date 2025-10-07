import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, uuid, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  stockStatus: text("stock_status").notNull().default("in-stock"),
  quantity: integer("quantity").default(0).notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(10).notNull(),
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

export const inventoryTransactions = pgTable("inventory_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  type: text("type").notNull(), // 'adjustment', 'sale', 'return', 'initial'
  quantityChange: integer("quantity_change").notNull(), // positive or negative
  reason: text("reason"),
  notes: text("notes"),
  userId: varchar("user_id"), // who made the change
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
// Note: insertClientSchema expects a raw password that will be hashed by the auth layer before storage
export const insertClientSchema = createInsertSchema(clients).omit({ id: true });
export const insertClientDepartmentSchema = createInsertSchema(clientDepartments).omit({ id: true });
export const insertClientLocationSchema = createInsertSchema(clientLocations).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertLtaSchema = createInsertSchema(ltas).omit({ id: true, createdAt: true });
export const insertLtaProductSchema = createInsertSchema(ltaProducts).omit({ id: true, createdAt: true });
export const insertLtaClientSchema = createInsertSchema(ltaClients).omit({ id: true, createdAt: true });
export const insertClientPricingSchema = createInsertSchema(clientPricing).omit({ id: true, importedAt: true });
export const insertOrderTemplateSchema = createInsertSchema(orderTemplates).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertInventoryTransactionSchema = createInsertSchema(inventoryTransactions).omit({ id: true, createdAt: true });

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
export const stockStatusEnum = z.enum(["in-stock", "low-stock", "out-of-stock"]);
export const createProductSchema = insertProductSchema.extend({
  stockStatus: stockStatusEnum.optional().default("in-stock"),
  quantity: z.number().int().min(0).optional().default(0),
  lowStockThreshold: z.number().int().min(0).optional().default(10),
  metadata: z.string().optional().nullable(),
});
export const updateProductSchema = createProductSchema.partial().extend({
  metadata: z.string().optional().nullable(),
});

// Inventory adjustment schema
export const inventoryAdjustmentSchema = z.object({
  productId: z.string().uuid(),
  quantityChange: z.number().int(),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
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

// Client update schema
export const updateClientSchema = insertClientSchema.pick({
  nameEn: true,
  nameAr: true,
  email: true,
  phone: true,
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
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;

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
export type InsertInventoryTransaction = z.infer<typeof insertInventoryTransactionSchema>;

export type LoginCredentials = z.infer<typeof loginSchema>;
export type PriceImportRow = z.infer<typeof priceImportRowSchema>;
export type InventoryAdjustment = z.infer<typeof inventoryAdjustmentSchema>;
export type StockStatus = z.infer<typeof stockStatusEnum>;

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
