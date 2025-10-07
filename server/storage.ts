import { 
  type Client, 
  type ClientDepartment,
  type ClientLocation,
  type Product, 
  type ClientPricing, 
  type OrderTemplate, 
  type Order,
  type InsertClient,
  type InsertClientDepartment,
  type InsertClientLocation,
  type InsertProduct,
  type InsertClientPricing,
  type InsertOrderTemplate,
  type InsertOrder,
  type AuthUser,
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
    const product: Product = { 
      ...insertProduct, 
      id,
      descriptionEn: insertProduct.descriptionEn ?? null,
      descriptionAr: insertProduct.descriptionAr ?? null,
      imageUrl: insertProduct.imageUrl ?? null,
      category: insertProduct.category ?? null,
      stockStatus: (insertProduct as any).stockStatus ?? "in-stock",
    };
    this.products.set(id, product);
    return product;
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
      createdAt: new Date()
    };
    this.orders.set(id, order);
    return order;
  }
}

export const storage = new MemStorage();
