import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { pgTable, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import crypto from 'crypto';


neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Add notifications table schema
export const orderTemplates = pgTable('order_templates', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text('client_id').notNull().references(() => schema.clients.id, { onDelete: 'cascade' }),
  nameEn: text('name_en').notNull(),
  nameAr: text('name_ar').notNull(),
  items: jsonb('items').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: text('client_id').notNull().references(() => schema.clients.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  titleEn: text('title_en').notNull(),
  titleAr: text('title_ar').notNull(),
  messageEn: text('message_en').notNull(),
  messageAr: text('message_ar').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Add category column to products table
export const products = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sku: text('sku').notNull().unique(),
  nameEn: text('name_en').notNull(),
  nameAr: text('name_ar').notNull(),
  descriptionEn: text('description_en').notNull(),
  descriptionAr: text('description_ar').notNull(),
  category: text('category'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});