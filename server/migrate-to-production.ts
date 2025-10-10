
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '@shared/schema';

async function migrateToProduction() {
  const devDatabaseUrl = process.env.DATABASE_URL;
  const prodDatabaseUrl = process.env.PRODUCTION_DATABASE_URL;

  if (!devDatabaseUrl || !prodDatabaseUrl) {
    throw new Error('Both DATABASE_URL and PRODUCTION_DATABASE_URL must be set');
  }

  console.log('Connecting to databases...');
  const devPool = new Pool({ connectionString: devDatabaseUrl });
  const prodPool = new Pool({ connectionString: prodDatabaseUrl });

  const devDb = drizzle({ client: devPool, schema });
  const prodDb = drizzle({ client: prodPool, schema });

  try {
    console.log('Starting migration...');

    // Migrate clients
    console.log('Migrating clients...');
    const clients = await devDb.select().from(schema.clients);
    for (const client of clients) {
      await prodDb.insert(schema.clients).values(client).onConflictDoNothing();
    }
    console.log(`Migrated ${clients.length} clients`);

    // Migrate products
    console.log('Migrating products...');
    const products = await devDb.select().from(schema.products);
    for (const product of products) {
      await prodDb.insert(schema.products).values(product).onConflictDoNothing();
    }
    console.log(`Migrated ${products.length} products`);

    // Migrate LTAs
    console.log('Migrating LTAs...');
    const ltas = await devDb.select().from(schema.ltas);
    for (const lta of ltas) {
      await prodDb.insert(schema.ltas).values(lta).onConflictDoNothing();
    }
    console.log(`Migrated ${ltas.length} LTAs`);

    // Migrate LTA products
    console.log('Migrating LTA products...');
    const ltaProducts = await devDb.select().from(schema.ltaProducts);
    for (const ltaProduct of ltaProducts) {
      await prodDb.insert(schema.ltaProducts).values(ltaProduct).onConflictDoNothing();
    }
    console.log(`Migrated ${ltaProducts.length} LTA products`);

    // Migrate LTA clients
    console.log('Migrating LTA clients...');
    const ltaClients = await devDb.select().from(schema.ltaClients);
    for (const ltaClient of ltaClients) {
      await prodDb.insert(schema.ltaClients).values(ltaClient).onConflictDoNothing();
    }
    console.log(`Migrated ${ltaClients.length} LTA clients`);

    // Migrate vendors
    console.log('Migrating vendors...');
    const vendors = await devDb.select().from(schema.vendors);
    for (const vendor of vendors) {
      await prodDb.insert(schema.vendors).values(vendor).onConflictDoNothing();
    }
    console.log(`Migrated ${vendors.length} vendors`);

    console.log('\n✓ Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

migrateToProduction().catch(console.error);
