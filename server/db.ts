import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { pgTable, uuid, text, timestamp, jsonb, boolean, numeric } from 'drizzle-orm/pg-core';
import { clients, ltas, notifications, users } from '@shared/schema';


neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Re-export commonly used tables for convenience
export { notifications, orders, orderFeedback } from '@shared/schema';

// Re-export schema for use in routes
export { schema } from '@shared/schema';

// All table schemas are now defined in shared/schema.ts
// This file only contains the database connection and configuration

export const priceOffers = pgTable('price_offers', {
  id: uuid('id').defaultRandom().primaryKey(),
  offerNumber: text('offer_number').notNull().unique(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  ltaId: uuid('lta_id').notNull().references(() => ltas.id, { onDelete: 'cascade' }),
  priceRequestNotificationId: uuid('price_request_notification_id').references(() => notifications.id, { onDelete: 'set null' }),
  status: text('status', { enum: ['sent', 'viewed', 'accepted', 'rejected', 'expired'] }).notNull().default('sent'),
  language: text('language', { enum: ['en', 'ar'] }).notNull().default('en'),
  items: jsonb('items').notNull(),
  validFrom: timestamp('valid_from').notNull(),
  validUntil: timestamp('valid_until').notNull(),
  notes: text('notes'),
  pdfFileName: text('pdf_file_name'),
  sentAt: timestamp('sent_at'),
  viewedAt: timestamp('viewed_at'),
  respondedAt: timestamp('responded_at'),
  responseNote: text('response_note'),
  generatedBy: uuid('generated_by').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const templates = pgTable('templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  nameEn: text('name_en').notNull(),
  nameAr: text('name_ar').notNull(),
  descriptionEn: text('description_en'),
  descriptionAr: text('description_ar'),
  category: text('category', {
    enum: ['price_offer', 'order', 'invoice', 'contract', 'report', 'other']
  }).notNull(),
  language: text('language', { enum: ['en', 'ar', 'both'] }).notNull().default('both'),
  sections: jsonb('sections').notNull(),
  variables: jsonb('variables').notNull(),
  styles: jsonb('styles').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const clientLocations = pgTable("client_locations", {
  id: text("id").primaryKey().notNull(),
  clientId: text("client_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  addressEn: text("address_en").notNull(),
  addressAr: text("address_ar").notNull(),
  city: text("city"),
  country: text("country"),
  isHeadquarters: boolean("is_headquarters").default(false).notNull(),
  phone: text("phone"),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});