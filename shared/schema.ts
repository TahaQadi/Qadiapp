import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
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
});

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
  items: text("items").notNull(), // JSON string
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  pipefyCardId: text("pipefy_card_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertClientSchema = createInsertSchema(clients).omit({ id: true });
export const insertClientDepartmentSchema = createInsertSchema(clientDepartments).omit({ id: true });
export const insertClientLocationSchema = createInsertSchema(clientLocations).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertClientPricingSchema = createInsertSchema(clientPricing).omit({ id: true, importedAt: true });
export const insertOrderTemplateSchema = createInsertSchema(orderTemplates).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });

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

// Types
export type Client = typeof clients.$inferSelect;
export type ClientDepartment = typeof clientDepartments.$inferSelect;
export type ClientLocation = typeof clientLocations.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ClientPricing = typeof clientPricing.$inferSelect;
export type OrderTemplate = typeof orderTemplates.$inferSelect;
export type Order = typeof orders.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertClientDepartment = z.infer<typeof insertClientDepartmentSchema>;
export type InsertClientLocation = z.infer<typeof insertClientLocationSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertClientPricing = z.infer<typeof insertClientPricingSchema>;
export type InsertOrderTemplate = z.infer<typeof insertOrderTemplateSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type LoginCredentials = z.infer<typeof loginSchema>;
export type PriceImportRow = z.infer<typeof priceImportRowSchema>;

export interface CartItem {
  productId: string;
  nameEn: string;
  nameAr: string;
  price: string;
  quantity: number;
  sku: string;
}

export interface AuthUser {
  id: string;
  username: string;
  nameEn: string;
  nameAr: string;
  email?: string;
  phone?: string;
}
