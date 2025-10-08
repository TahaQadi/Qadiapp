import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { clients } from './client';


neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

export const orderTemplates = sqliteTable('order_templates', {
  id: text('id').primaryKey().notNull(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  nameEn: text('name_en').notNull(),
  nameAr: text('name_ar').notNull(),
  items: text('items').notNull(),
  createdAt: text('created_at').notNull(),
});

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey().notNull(),
  clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'order_created', 'order_status_changed', etc.
  titleEn: text('title_en').notNull(),
  titleAr: text('title_ar').notNull(),
  messageEn: text('message_en').notNull(),
  messageAr: text('message_ar').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  metadata: text('metadata'), // JSON string for additional data
  createdAt: text('created_at').notNull(),
});