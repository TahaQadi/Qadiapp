
import { storage } from "./storage";

async function clearDatabase() {
  
  // Get all clients
  const clients = await storage.getClients();
  
  // Delete all clients (this will cascade delete related data)
  for (const client of clients) {
    await storage.deleteClient(client.id);
  }
  
  // Get all LTAs
  const ltas = await storage.getAllLtas();
  
  // Delete all LTAs
  for (const lta of ltas) {
    await storage.deleteLta(lta.id);
  }
  
  // Get all products
  const products = await storage.getProducts();
  
  // Delete all products
  for (const product of products) {
    await storage.deleteProduct(product.id);
  }
  
}

clearDatabase().catch(console.error);
