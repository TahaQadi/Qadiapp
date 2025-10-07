import { 
  type Client, 
  type ClientDepartment,
  type ClientLocation,
  type Product, 
  type ClientPricing, 
  type OrderTemplate, 
  type Order,
  type InventoryTransaction,
  type Lta,
  type LtaProduct,
  type LtaClient,
  type InsertClient,
  type InsertClientDepartment,
  type InsertClientLocation,
  type InsertProduct,
  type InsertClientPricing,
  type InsertOrderTemplate,
  type InsertOrder,
  type InsertInventoryTransaction,
  type InsertLta,
  type InsertLtaProduct,
  type InsertLtaClient,
  type AuthUser,
  type StockStatus,
} from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  sessionStore: session.Store;
  
  // Client Authentication
  getClientByUsername(username: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  validateClientCredentials(username: string, password: string): Promise<AuthUser | null>;
  
  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  
  // Client Departments
  getClientDepartments(clientId: string): Promise<ClientDepartment[]>;
  createClientDepartment(department: InsertClientDepartment): Promise<ClientDepartment>;
  updateClientDepartment(id: string, department: Partial<InsertClientDepartment>): Promise<ClientDepartment | undefined>;
  deleteClientDepartment(id: string): Promise<void>;
  
  // Client Locations
  getClientLocations(clientId: string): Promise<ClientLocation[]>;
  createClientLocation(location: InsertClientLocation): Promise<ClientLocation>;
  updateClientLocation(id: string, location: Partial<InsertClientLocation>): Promise<ClientLocation | undefined>;
  deleteClientLocation(id: string): Promise<void>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  // Client Pricing
  getClientPricing(clientId: string): Promise<ClientPricing[]>;
  createClientPricing(pricing: InsertClientPricing): Promise<ClientPricing>;
  bulkImportPricing(clientId: string, pricingData: Array<{ sku: string; price: string; currency?: string }>): Promise<number>;
  
  // Order Templates
  getOrderTemplates(clientId: string): Promise<OrderTemplate[]>;
  getOrderTemplate(id: string): Promise<OrderTemplate | undefined>;
  createOrderTemplate(template: InsertOrderTemplate): Promise<OrderTemplate>;
  deleteOrderTemplate(id: string): Promise<void>;
  
  // Orders
  getOrders(clientId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  
  // Product Management
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  
  // Inventory methods
  adjustInventory(productId: string, quantityChange: number, reason: string, notes: string | undefined, userId: string): Promise<InventoryTransaction>;
  getInventoryTransactions(productId?: string): Promise<InventoryTransaction[]>;
  updateProductQuantity(productId: string, newQuantity: number): Promise<Product | null>;
  
  // LTA Management
  createLta(lta: InsertLta): Promise<Lta>;
  getLta(id: string): Promise<Lta | null>;
  getAllLtas(): Promise<Lta[]>;
  updateLta(id: string, updates: Partial<InsertLta>): Promise<Lta | null>;
  deleteLta(id: string): Promise<boolean>;
  
  // LTA Products (assignment with pricing)
  assignProductToLta(ltaProduct: InsertLtaProduct): Promise<LtaProduct>;
  removeProductFromLta(ltaId: string, productId: string): Promise<boolean>;
  getLtaProducts(ltaId: string): Promise<LtaProduct[]>;
  updateLtaProductPrice(id: string, contractPrice: string, currency?: string): Promise<LtaProduct | null>;
  
  // LTA Clients (assignment)
  assignClientToLta(ltaClient: InsertLtaClient): Promise<LtaClient>;
  removeClientFromLta(ltaId: string, clientId: string): Promise<boolean>;
  getLtaClients(ltaId: string): Promise<LtaClient[]>;
  getClientLtas(clientId: string): Promise<Lta[]>;
  
  // Product queries for LTA context
  getProductsForLta(ltaId: string): Promise<Array<Product & { contractPrice: string; currency: string }>>;
  getProductsForClient(clientId: string): Promise<Array<Product & { contractPrice: string; currency: string; ltaId: string }>>;
}

export class MemStorage implements IStorage {
  public sessionStore: session.Store;
  private clients: Map<string, Client>;
  private clientDepartments: Map<string, ClientDepartment>;
  private clientLocations: Map<string, ClientLocation>;
  private products: Map<string, Product>;
  private clientPricing: Map<string, ClientPricing>;
  private orderTemplates: Map<string, OrderTemplate>;
  private orders: Map<string, Order>;
  private inventoryTransactions: Map<string, InventoryTransaction>;

  private ltas: Map<string, Lta> = new Map();
  private ltaProducts: Map<string, LtaProduct> = new Map();
  private ltaClients: Map<string, LtaClient> = new Map();

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    this.clients = new Map();
    this.clientDepartments = new Map();
    this.clientLocations = new Map();
    this.products = new Map();
    this.clientPricing = new Map();
    this.orderTemplates = new Map();
    this.orders = new Map();
    this.inventoryTransactions = new Map();
    this.ltas = new Map();
    this.ltaProducts = new Map();
    this.ltaClients = new Map();
  }

  // Client Authentication
  async getClientByUsername(username: string): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(
      (client) => client.username === username
    );
  }

  async validateClientCredentials(username: string, password: string): Promise<AuthUser | null> {
    const client = await this.getClientByUsername(username);
    if (!client || client.password !== password) {
      return null;
    }
    return {
      id: client.id,
      username: client.username,
      nameEn: client.nameEn,
      nameAr: client.nameAr,
      email: client.email ?? undefined,
      phone: client.phone ?? undefined,
      isAdmin: client.isAdmin,
    };
  }

  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const client: Client = { 
      ...insertClient, 
      id, 
      email: insertClient.email ?? null, 
      phone: insertClient.phone ?? null,
      isAdmin: insertClient.isAdmin ?? false
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: string, data: Partial<InsertClient>): Promise<Client | undefined> {
    const { nameEn, nameAr, email, phone } = data;
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updated = {
      ...client,
      nameEn: nameEn ?? client.nameEn,
      nameAr: nameAr ?? client.nameAr,
      email: email ?? client.email,
      phone: phone ?? client.phone,
    };
    this.clients.set(id, updated);
    return updated;
  }

  // Client Departments
  async getClientDepartments(clientId: string): Promise<ClientDepartment[]> {
    return Array.from(this.clientDepartments.values()).filter(
      (dept) => dept.clientId === clientId
    );
  }

  async createClientDepartment(insertDept: InsertClientDepartment): Promise<ClientDepartment> {
    const id = randomUUID();
    const department: ClientDepartment = {
      ...insertDept,
      id,
      contactName: insertDept.contactName ?? null,
      contactEmail: insertDept.contactEmail ?? null,
      contactPhone: insertDept.contactPhone ?? null,
    };
    this.clientDepartments.set(id, department);
    return department;
  }

  async updateClientDepartment(id: string, updates: Partial<InsertClientDepartment>): Promise<ClientDepartment | undefined> {
    const dept = this.clientDepartments.get(id);
    if (!dept) return undefined;
    const updated = { ...dept, ...updates };
    this.clientDepartments.set(id, updated);
    return updated;
  }

  async deleteClientDepartment(id: string): Promise<void> {
    this.clientDepartments.delete(id);
  }

  // Client Locations
  async getClientLocations(clientId: string): Promise<ClientLocation[]> {
    return Array.from(this.clientLocations.values()).filter(
      (loc) => loc.clientId === clientId
    );
  }

  async createClientLocation(insertLoc: InsertClientLocation): Promise<ClientLocation> {
    const id = randomUUID();
    const location: ClientLocation = {
      ...insertLoc,
      id,
      city: insertLoc.city ?? null,
      country: insertLoc.country ?? null,
      isHeadquarters: insertLoc.isHeadquarters ?? false,
      phone: insertLoc.phone ?? null,
    };
    this.clientLocations.set(id, location);
    return location;
  }

  async updateClientLocation(id: string, updates: Partial<InsertClientLocation>): Promise<ClientLocation | undefined> {
    const loc = this.clientLocations.get(id);
    if (!loc) return undefined;
    const updated = { ...loc, ...updates };
    this.clientLocations.set(id, updated);
    return updated;
  }

  async deleteClientLocation(id: string): Promise<void> {
    this.clientLocations.delete(id);
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(
      (product) => product.sku === sku
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const quantity = (insertProduct as any).quantity ?? 0;
    const lowStockThreshold = (insertProduct as any).lowStockThreshold ?? 10;
    const stockStatus = this.calculateStockStatus(quantity, lowStockThreshold);
    
    const product: Product = { 
      ...insertProduct, 
      id,
      descriptionEn: insertProduct.descriptionEn ?? null,
      descriptionAr: insertProduct.descriptionAr ?? null,
      imageUrl: insertProduct.imageUrl ?? null,
      category: insertProduct.category ?? null,
      stockStatus,
      quantity,
      lowStockThreshold,
    };
    this.products.set(id, product);
    return product;
  }
  
  private calculateStockStatus(quantity: number, threshold: number): StockStatus {
    if (quantity === 0) return 'out-of-stock';
    if (quantity <= threshold) return 'low-stock';
    return 'in-stock';
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    const updated = { ...product, ...updates };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    this.products.delete(id);
  }

  // Client Pricing
  async getClientPricing(clientId: string): Promise<ClientPricing[]> {
    return Array.from(this.clientPricing.values()).filter(
      (pricing) => pricing.clientId === clientId
    );
  }

  async createClientPricing(insertPricing: InsertClientPricing): Promise<ClientPricing> {
    const id = randomUUID();
    const pricing: ClientPricing = { 
      ...insertPricing, 
      id,
      currency: insertPricing.currency ?? 'USD',
      importedAt: new Date(),
    };
    this.clientPricing.set(id, pricing);
    return pricing;
  }

  async bulkImportPricing(
    clientId: string, 
    pricingData: Array<{ sku: string; price: string; currency?: string }>
  ): Promise<number> {
    let importedCount = 0;
    
    for (const row of pricingData) {
      const product = await this.getProductBySku(row.sku);
      if (product) {
        // Check if pricing already exists
        const existingPricing = Array.from(this.clientPricing.values()).find(
          (p) => p.clientId === clientId && p.productId === product.id
        );
        
        if (existingPricing) {
          // Update existing pricing
          existingPricing.price = row.price;
          existingPricing.currency = row.currency ?? 'USD';
          existingPricing.importedAt = new Date();
        } else {
          // Create new pricing
          await this.createClientPricing({
            clientId,
            productId: product.id,
            price: row.price,
            currency: row.currency ?? 'USD',
          });
        }
        importedCount++;
      }
    }
    
    return importedCount;
  }

  // Order Templates
  async getOrderTemplates(clientId: string): Promise<OrderTemplate[]> {
    return Array.from(this.orderTemplates.values()).filter(
      (template) => template.clientId === clientId
    );
  }

  async getOrderTemplate(id: string): Promise<OrderTemplate | undefined> {
    return this.orderTemplates.get(id);
  }

  async createOrderTemplate(insertTemplate: InsertOrderTemplate): Promise<OrderTemplate> {
    const id = randomUUID();
    const template: OrderTemplate = { 
      ...insertTemplate, 
      id,
      createdAt: new Date()
    };
    this.orderTemplates.set(id, template);
    return template;
  }

  async deleteOrderTemplate(id: string): Promise<void> {
    this.orderTemplates.delete(id);
  }

  // Orders
  async getOrders(clientId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.clientId === clientId
    );
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = { 
      ...insertOrder, 
      id,
      status: insertOrder.status ?? 'pending',
      pipefyCardId: insertOrder.pipefyCardId ?? null,
      ltaId: insertOrder.ltaId ?? null,
      createdAt: new Date()
    };
    this.orders.set(id, order);
    return order;
  }

  // Inventory methods
  async adjustInventory(
    productId: string, 
    quantityChange: number, 
    reason: string, 
    notes: string | undefined, 
    userId: string
  ): Promise<InventoryTransaction> {
    const product = this.products.get(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Create transaction record
    const id = randomUUID();
    const transaction: InventoryTransaction = {
      id,
      productId,
      type: 'adjustment',
      quantityChange,
      reason: reason ?? null,
      notes: notes ?? null,
      userId: userId ?? null,
      createdAt: new Date(),
    };
    this.inventoryTransactions.set(id, transaction);

    // Update product quantity
    const newQuantity = product.quantity + quantityChange;
    const newStockStatus = this.calculateStockStatus(newQuantity, product.lowStockThreshold);
    
    const updatedProduct = {
      ...product,
      quantity: newQuantity,
      stockStatus: newStockStatus,
    };
    this.products.set(productId, updatedProduct);

    return transaction;
  }

  async getInventoryTransactions(productId?: string): Promise<InventoryTransaction[]> {
    const allTransactions = Array.from(this.inventoryTransactions.values());
    
    if (productId) {
      return allTransactions.filter(t => t.productId === productId);
    }
    
    return allTransactions;
  }

  async updateProductQuantity(productId: string, newQuantity: number): Promise<Product | null> {
    const product = this.products.get(productId);
    if (!product) {
      return null;
    }

    const newStockStatus = this.calculateStockStatus(newQuantity, product.lowStockThreshold);
    
    const updatedProduct = {
      ...product,
      quantity: newQuantity,
      stockStatus: newStockStatus,
    };
    this.products.set(productId, updatedProduct);

    return updatedProduct;
  }

  // LTA Management
  async createLta(insertLta: InsertLta): Promise<Lta> {
    const id = randomUUID();
    const lta: Lta = {
      ...insertLta,
      id,
      descriptionEn: insertLta.descriptionEn ?? null,
      descriptionAr: insertLta.descriptionAr ?? null,
      status: insertLta.status ?? 'active',
      createdAt: new Date(),
    };
    this.ltas.set(id, lta);
    return lta;
  }

  async getLta(id: string): Promise<Lta | null> {
    return this.ltas.get(id) || null;
  }

  async getAllLtas(): Promise<Lta[]> {
    return Array.from(this.ltas.values());
  }

  async updateLta(id: string, updates: Partial<InsertLta>): Promise<Lta | null> {
    const lta = this.ltas.get(id);
    if (!lta) return null;
    
    const updated = { ...lta, ...updates };
    this.ltas.set(id, updated);
    return updated;
  }

  async deleteLta(id: string): Promise<boolean> {
    return this.ltas.delete(id);
  }

  // LTA Products
  async assignProductToLta(insertLtaProduct: InsertLtaProduct): Promise<LtaProduct> {
    const id = randomUUID();
    const ltaProduct: LtaProduct = {
      ...insertLtaProduct,
      id,
      currency: insertLtaProduct.currency ?? 'USD',
      createdAt: new Date(),
    };
    this.ltaProducts.set(id, ltaProduct);
    return ltaProduct;
  }

  async removeProductFromLta(ltaId: string, productId: string): Promise<boolean> {
    const ltaProduct = Array.from(this.ltaProducts.values()).find(
      (lp) => lp.ltaId === ltaId && lp.productId === productId
    );
    if (!ltaProduct) return false;
    return this.ltaProducts.delete(ltaProduct.id);
  }

  async getLtaProducts(ltaId: string): Promise<LtaProduct[]> {
    return Array.from(this.ltaProducts.values()).filter(
      (lp) => lp.ltaId === ltaId
    );
  }

  async updateLtaProductPrice(id: string, contractPrice: string, currency?: string): Promise<LtaProduct | null> {
    const ltaProduct = this.ltaProducts.get(id);
    if (!ltaProduct) return null;
    
    const updated = {
      ...ltaProduct,
      contractPrice,
      currency: currency ?? ltaProduct.currency,
    };
    this.ltaProducts.set(id, updated);
    return updated;
  }

  // LTA Clients
  async assignClientToLta(insertLtaClient: InsertLtaClient): Promise<LtaClient> {
    const id = randomUUID();
    const ltaClient: LtaClient = {
      ...insertLtaClient,
      id,
      createdAt: new Date(),
    };
    this.ltaClients.set(id, ltaClient);
    return ltaClient;
  }

  async removeClientFromLta(ltaId: string, clientId: string): Promise<boolean> {
    const ltaClient = Array.from(this.ltaClients.values()).find(
      (lc) => lc.ltaId === ltaId && lc.clientId === clientId
    );
    if (!ltaClient) return false;
    return this.ltaClients.delete(ltaClient.id);
  }

  async getLtaClients(ltaId: string): Promise<LtaClient[]> {
    return Array.from(this.ltaClients.values()).filter(
      (lc) => lc.ltaId === ltaId
    );
  }

  async getClientLtas(clientId: string): Promise<Lta[]> {
    const clientLtaAssignments = Array.from(this.ltaClients.values()).filter(
      (lc) => lc.clientId === clientId
    );
    
    const ltas: Lta[] = [];
    for (const assignment of clientLtaAssignments) {
      const lta = this.ltas.get(assignment.ltaId);
      if (lta) {
        ltas.push(lta);
      }
    }
    return ltas;
  }

  // Product queries for LTA context
  async getProductsForLta(ltaId: string): Promise<Array<Product & { contractPrice: string; currency: string }>> {
    const ltaProducts = await this.getLtaProducts(ltaId);
    const productsWithPricing: Array<Product & { contractPrice: string; currency: string }> = [];
    
    for (const ltaProduct of ltaProducts) {
      const product = this.products.get(ltaProduct.productId);
      if (product) {
        productsWithPricing.push({
          ...product,
          contractPrice: ltaProduct.contractPrice,
          currency: ltaProduct.currency,
        });
      }
    }
    
    return productsWithPricing;
  }

  async getProductsForClient(clientId: string): Promise<Array<Product & { contractPrice: string; currency: string; ltaId: string }>> {
    const clientLtas = await this.getClientLtas(clientId);
    const productsWithPricing: Array<Product & { contractPrice: string; currency: string; ltaId: string }> = [];
    
    for (const lta of clientLtas) {
      const ltaProducts = await this.getLtaProducts(lta.id);
      
      for (const ltaProduct of ltaProducts) {
        const product = this.products.get(ltaProduct.productId);
        if (product) {
          productsWithPricing.push({
            ...product,
            contractPrice: ltaProduct.contractPrice,
            currency: ltaProduct.currency,
            ltaId: lta.id,
          });
        }
      }
    }
    
    return productsWithPricing;
  }
}

export const storage = new MemStorage();
