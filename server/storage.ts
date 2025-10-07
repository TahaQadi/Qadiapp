import { 
  type Client, 
  type Product, 
  type ClientPricing, 
  type OrderTemplate, 
  type Order,
  type InsertClient,
  type InsertProduct,
  type InsertClientPricing,
  type InsertOrderTemplate,
  type InsertOrder,
  type CartItem
} from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  // Client Pricing
  getClientPricing(clientId: string): Promise<ClientPricing[]>;
  createClientPricing(pricing: InsertClientPricing): Promise<ClientPricing>;
  
  // Order Templates
  getOrderTemplates(clientId: string): Promise<OrderTemplate[]>;
  createOrderTemplate(template: InsertOrderTemplate): Promise<OrderTemplate>;
  deleteOrderTemplate(id: string): Promise<void>;
  
  // Orders
  getOrders(clientId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
}

export class MemStorage implements IStorage {
  private clients: Map<string, Client>;
  private products: Map<string, Product>;
  private clientPricing: Map<string, ClientPricing>;
  private orderTemplates: Map<string, OrderTemplate>;
  private orders: Map<string, Order>;

  constructor() {
    this.clients = new Map();
    this.products = new Map();
    this.clientPricing = new Map();
    this.orderTemplates = new Map();
    this.orders = new Map();
  }

  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const client: Client = { ...insertClient, id };
    this.clients.set(id, client);
    return client;
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { 
      ...insertProduct, 
      id,
      descriptionEn: insertProduct.descriptionEn ?? null,
      descriptionAr: insertProduct.descriptionAr ?? null,
      imageUrl: insertProduct.imageUrl ?? null,
    };
    this.products.set(id, product);
    return product;
  }

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
    };
    this.clientPricing.set(id, pricing);
    return pricing;
  }

  async getOrderTemplates(clientId: string): Promise<OrderTemplate[]> {
    return Array.from(this.orderTemplates.values()).filter(
      (template) => template.clientId === clientId
    );
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
