import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { sqliteTable, text, integer, sqliteSchema } from 'drizzle-orm/sqlite-core';
import crypto from 'crypto';
import { users } from '@shared/schema';


neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use pooler endpoint for better connection management and auto-wake
const connectionString = process.env.DATABASE_URL.replace('.us-east-2', '-pooler.us-east-2');

export const pool = new Pool({ 
  connectionString,
  max: 10 // Connection pool size
});
export const db = drizzle({ client: pool, schema });

// Re-export commonly used tables for convenience
export { notifications, orders, orderFeedback, priceOffers, templates, clientLocations } from '@shared/schema';

// Re-export schema for use in routes
export * as schema from '@shared/schema';

// All table schemas are now defined in shared/schema.ts
// This file only contains the database connection and configuration

// Add template_versions table for version history
export const templateVersions = sqliteTable('template_versions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  templateId: text('template_id').notNull().references(() => templates.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  sections: text('sections', { mode: 'json' }).notNull(),
  variables: text('variables', { mode: 'json' }).notNull(),
  styles: text('styles', { mode: 'json' }).notNull(),
  changedBy: text('changed_by').references(() => users.id),
  changeReason: text('change_reason'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const templateUsageStats = sqliteTable('template_usage_stats', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  templateId: text('template_id').notNull().references(() => templates.id, { onDelete: 'cascade' }),
  generatedAt: integer('generated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  userId: text('user_id').references(() => users.id),
  documentType: text('document_type').notNull(),
  success: integer('success', { mode: 'boolean' }).notNull().default(true),
  errorMessage: text('error_message'),
  generationTimeMs: integer('generation_time_ms'),
});

// Update templates table schema to include the new columns for advanced editor UI
export const templates = sqliteTable('templates', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  language: text('language').notNull().default('ar'),
  sections: text('sections', { mode: 'json' }).notNull(),
  variables: text('variables', { mode: 'json' }).notNull(),
  styles: text('styles', { mode: 'json' }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});