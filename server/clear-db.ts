
import { storage } from "./storage";

async function clearDatabase() {
  console.log('Clearing database...');
  
  // Get all clients
  const clients = await storage.getClients();
  
  // Delete all clients (this will cascade delete related data)
  for (const client of clients) {
    await storage.deleteClient(client.id);
    console.log(`Deleted client: ${client.username}`);
  }
  
  // Get all LTAs
  const ltas = await storage.getAllLtas();
  
  // Delete all LTAs
  for (const lta of ltas) {
    await storage.deleteLta(lta.id);
    console.log(`Deleted LTA: ${lta.nameEn}`);
  }
  
  // Get all products
  const products = await storage.getProducts();
  
  // Delete all products
  for (const product of products) {
    await storage.deleteProduct(product.id);
    console.log(`Deleted product: ${product.sku}`);
  }
  
  console.log('\n✓ Database cleared successfully!');
  console.log('All clients, LTAs, and products have been removed.');
}

clearDatabase().catch(console.error);
