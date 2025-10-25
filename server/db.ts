import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";


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