import {
  type Client,
  type ClientDepartment,
  type ClientLocation,
  type Vendor,
  type Product,
  type ClientPricing,
  type OrderTemplate,
  type Order,
  type Lta,
  type LtaProduct,
  type LtaClient,
  type InsertClient,
  type InsertClientDepartment,
  type InsertClientLocation,
  type InsertVendor,
  type InsertProduct,
  type InsertClientPricing,
  type InsertOrderTemplate,
  type InsertOrder,
  type InsertLta,
  type InsertLtaProduct,
  type InsertLtaClient,
  type AuthUser,
  type User,
  type UpsertUser,
  Notification,
  notifications,
  clients,
  clientDepartments,
  clientLocations,
  vendors,
  products,
  clientPricing,
  orderTemplates,
  orders,
  ltas,
  ltaProducts,
  ltaClients,
  users,
} from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";
import { eq, desc, and } from "drizzle-orm";
import crypto from "crypto";
import { db } from "./db";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  sessionStore: session.Store;

  // Replit Auth User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Client Authentication
  getClientByUsername(username: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  validateClientCredentials(username: string, password: string): Promise<AuthUser | null>;

  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<void>;

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

  // Vendors
  getVendors(): Promise<Vendor[]>;
  getVendor(id: string): Promise<Vendor | undefined>;
  getVendorByNumber(vendorNumber: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor | undefined>;
  deleteVendor(id: string): Promise<void>;

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

  // Bulk operations
  bulkAssignProductsToLta(ltaId: string, products: Array<{ sku: string; contractPrice: string; currency: string }>): Promise<{ success: number; failed: Array<{ sku: string; error: string }> }>;

  // Notifications
  createNotification(data: {
    clientId: string;
    type: 'order_created' | 'order_status_changed' | 'system';
    titleEn: string;
    titleAr: string;
    messageEn: string;
    messageAr: string;
    metadata?: string;
  }): Promise<Notification>;
  getClientNotifications(clientId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<Notification | null>;
  markAllNotificationsAsRead(clientId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  getUnreadNotificationCount(clientId: string): Promise<number>;

  // New methods
  getAllProductsWithClientPrices(clientId: string): Promise<Array<Product & { contractPrice?: string; currency?: string; ltaId?: string; hasPrice: boolean }>>;
  getAdminClients(): Promise<Client[]>;
}

export class MemStorage implements IStorage {
  public sessionStore: session.Store;
  private db = db;
  private users: Map<string, User>;
  private clients: Map<string, Client>;
  private clientDepartments: Map<string, ClientDepartment>;
  private clientLocations: Map<string, ClientLocation>;
  private products: Map<string, Product>;
  private clientPricing: Map<string, ClientPricing>;
  private orderTemplates: Map<string, OrderTemplate>;
  private orders: Map<string, Order>;

  private ltas: Map<string, Lta> = new Map();
  private ltaProducts: Map<string, LtaProduct> = new Map();
  private ltaClients: Map<string, LtaClient> = new Map();

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    this.users = new Map();
    this.clients = new Map();
    this.clientDepartments = new Map();
    this.clientLocations = new Map();
    this.products = new Map();
    this.clientPricing = new Map();
    this.orderTemplates = new Map();
    this.orders = new Map();
    this.ltas = new Map();
    this.ltaProducts = new Map();
    this.ltaClients = new Map();
  }

  // Replit Auth User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = await this.getUser(userData.id!);

    if (existingUser) {
      const updated = await this.db
        .update(users)
        .set({
          email: userData.email ?? null,
          firstName: userData.firstName ?? null,
          lastName: userData.lastName ?? null,
          profileImageUrl: userData.profileImageUrl ?? null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userData.id!))
        .returning();
      return updated[0];
    } else {
      const inserted = await this.db
        .insert(users)
        .values({
          id: userData.id!,
          email: userData.email ?? null,
          firstName: userData.firstName ?? null,
          lastName: userData.lastName ?? null,
          profileImageUrl: userData.profileImageUrl ?? null,
        })
        .returning();
      return inserted[0];
    }
  }

  // Client Authentication
  async getClientByUsername(username: string): Promise<Client | undefined> {
    const result = await this.db.select().from(clients).where(eq(clients.username, username)).limit(1);
    return result[0];
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
    return await this.db.select().from(clients);
  }

  async getClient(id: string): Promise<Client | undefined> {
    const result = await this.db.select().from(clients).where(eq(clients.id, id)).limit(1);
    return result[0];
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const inserted = await this.db
      .insert(clients)
      .values({
        nameEn: insertClient.nameEn,
        nameAr: insertClient.nameAr,
        username: insertClient.username,
        password: insertClient.password,
        userId: insertClient.userId ?? null,
        email: insertClient.email ?? null,
        phone: insertClient.phone ?? null,
        isAdmin: insertClient.isAdmin ?? false,
      })
      .returning();
    return inserted[0];
  }

  async updateClient(id: string, data: Partial<InsertClient>): Promise<Client | undefined> {
    const updated = await this.db
      .update(clients)
      .set({
        nameEn: data.nameEn,
        nameAr: data.nameAr,
        email: data.email,
        phone: data.phone,
        isAdmin: data.isAdmin,
      })
      .where(eq(clients.id, id))
      .returning();
    return updated[0];
  }

  async deleteClient(id: string): Promise<void> {
    await this.db.delete(clients).where(eq(clients.id, id));
  }

  // Client Departments
  async getClientDepartments(clientId: string): Promise<ClientDepartment[]> {
    return await this.db
      .select()
      .from(clientDepartments)
      .where(eq(clientDepartments.clientId, clientId));
  }

  async createClientDepartment(insertDept: InsertClientDepartment): Promise<ClientDepartment> {
    const inserted = await this.db
      .insert(clientDepartments)
      .values({
        clientId: insertDept.clientId,
        departmentType: insertDept.departmentType,
        contactName: insertDept.contactName ?? null,
        contactEmail: insertDept.contactEmail ?? null,
        contactPhone: insertDept.contactPhone ?? null,
      })
      .returning();
    return inserted[0];
  }

  async updateClientDepartment(id: string, updates: Partial<InsertClientDepartment>): Promise<ClientDepartment | undefined> {
    const updated = await this.db
      .update(clientDepartments)
      .set(updates)
      .where(eq(clientDepartments.id, id))
      .returning();
    return updated[0];
  }

  async deleteClientDepartment(id: string): Promise<void> {
    await this.db.delete(clientDepartments).where(eq(clientDepartments.id, id));
  }

  // Client Locations
  async getClientLocations(clientId: string): Promise<ClientLocation[]> {
    return await this.db
      .select()
      .from(clientLocations)
      .where(eq(clientLocations.clientId, clientId));
  }

  async createClientLocation(insertLoc: InsertClientLocation): Promise<ClientLocation> {
    const inserted = await this.db
      .insert(clientLocations)
      .values({
        clientId: insertLoc.clientId,
        nameEn: insertLoc.nameEn,
        nameAr: insertLoc.nameAr,
        addressEn: insertLoc.addressEn,
        addressAr: insertLoc.addressAr,
        city: insertLoc.city ?? null,
        country: insertLoc.country ?? null,
        isHeadquarters: insertLoc.isHeadquarters ?? false,
        phone: insertLoc.phone ?? null,
      })
      .returning();
    return inserted[0];
  }

  async updateClientLocation(id: string, updates: Partial<InsertClientLocation>): Promise<ClientLocation | undefined> {
    const updated = await this.db
      .update(clientLocations)
      .set(updates)
      .where(eq(clientLocations.id, id))
      .returning();
    return updated[0];
  }

  async deleteClientLocation(id: string): Promise<void> {
    await this.db.delete(clientLocations).where(eq(clientLocations.id, id));
  }

  // Vendors
  async getVendors(): Promise<Vendor[]> {
    return await this.db.select().from(vendors);
  }

  async getVendor(id: string): Promise<Vendor | undefined> {
    const result = await this.db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
    return result[0];
  }

  async getVendorByNumber(vendorNumber: string): Promise<Vendor | undefined> {
    const result = await this.db.select().from(vendors).where(eq(vendors.vendorNumber, vendorNumber)).limit(1);
    return result[0];
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const inserted = await this.db
      .insert(vendors)
      .values({
        vendorNumber: insertVendor.vendorNumber,
        nameEn: insertVendor.nameEn,
        nameAr: insertVendor.nameAr,
        contactEmail: insertVendor.contactEmail ?? null,
        contactPhone: insertVendor.contactPhone ?? null,
        address: insertVendor.address ?? null,
      })
      .returning();
    return inserted[0];
  }

  async updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const updated = await this.db
      .update(vendors)
      .set(updates)
      .where(eq(vendors.id, id))
      .returning();
    return updated[0];
  }

  async deleteVendor(id: string): Promise<void> {
    await this.db.delete(vendors).where(eq(vendors.id, id));
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return await this.db.select().from(products);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await this.db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    const result = await this.db.select().from(products).where(eq(products.sku, sku)).limit(1);
    return result[0];
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const inserted = await this.db
      .insert(products)
      .values({
        nameEn: insertProduct.nameEn,
        nameAr: insertProduct.nameAr,
        sku: insertProduct.sku,
        categoryNum: insertProduct.categoryNum ?? null,
        unitType: insertProduct.unitType ?? null,
        unit: insertProduct.unit ?? null,
        unitPerBox: insertProduct.unitPerBox ?? null,
        costPricePerBox: insertProduct.costPricePerBox ?? null,
        costPricePerPiece: insertProduct.costPricePerPiece ?? null,
        specificationsAr: insertProduct.specificationsAr ?? null,
        vendorId: insertProduct.vendorId ?? null,
        vendor: insertProduct.vendor ?? null,
        vendorNum: insertProduct.vendorNum ?? null,
        mainCategory: insertProduct.mainCategory ?? null,
        category: insertProduct.category ?? null,
        sellingPricePack: insertProduct.sellingPricePack ?? null,
        sellingPricePiece: insertProduct.sellingPricePiece ?? null,
        descriptionEn: insertProduct.descriptionEn ?? null,
        descriptionAr: insertProduct.descriptionAr ?? null,
        imageUrl: insertProduct.imageUrl ?? null,
      })
      .returning();
    return inserted[0];
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const updated = await this.db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return updated[0];
  }

  async deleteProduct(id: string): Promise<void> {
    await this.db.delete(products).where(eq(products.id, id));
  }

  // Client Pricing
  async getClientPricing(clientId: string): Promise<ClientPricing[]> {
    return await this.db
      .select()
      .from(clientPricing)
      .where(eq(clientPricing.clientId, clientId));
  }

  async createClientPricing(insertPricing: InsertClientPricing): Promise<ClientPricing> {
    const inserted = await this.db
      .insert(clientPricing)
      .values({
        clientId: insertPricing.clientId,
        productId: insertPricing.productId,
        price: insertPricing.price,
        currency: insertPricing.currency ?? 'USD',
      })
      .returning();
    return inserted[0];
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
    return await this.db
      .select()
      .from(orderTemplates)
      .where(eq(orderTemplates.clientId, clientId));
  }

  async getOrderTemplate(id: string): Promise<OrderTemplate | undefined> {
    const result = await this.db.select().from(orderTemplates).where(eq(orderTemplates.id, id)).limit(1);
    return result[0];
  }

  async createOrderTemplate(insertTemplate: InsertOrderTemplate): Promise<OrderTemplate> {
    const inserted = await this.db
      .insert(orderTemplates)
      .values({
        clientId: insertTemplate.clientId,
        nameEn: insertTemplate.nameEn,
        nameAr: insertTemplate.nameAr,
        items: insertTemplate.items,
      })
      .returning();
    return inserted[0];
  }

  async deleteOrderTemplate(id: string): Promise<void> {
    await this.db.delete(orderTemplates).where(eq(orderTemplates.id, id));
  }

  // Orders
  async getOrders(clientId: string): Promise<Order[]> {
    return await this.db
      .select()
      .from(orders)
      .where(eq(orders.clientId, clientId))
      .orderBy(desc(orders.createdAt));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const inserted = await this.db
      .insert(orders)
      .values({
        clientId: insertOrder.clientId,
        ltaId: insertOrder.ltaId ?? null,
        items: insertOrder.items,
        totalAmount: insertOrder.totalAmount,
        status: insertOrder.status ?? 'pending',
        pipefyCardId: insertOrder.pipefyCardId ?? null,
      })
      .returning();
    return inserted[0];
  }

  // LTA Management
  async createLta(insertLta: InsertLta): Promise<Lta> {
    const inserted = await this.db
      .insert(ltas)
      .values({
        nameEn: insertLta.nameEn,
        nameAr: insertLta.nameAr,
        descriptionEn: insertLta.descriptionEn ?? null,
        descriptionAr: insertLta.descriptionAr ?? null,
        startDate: insertLta.startDate,
        endDate: insertLta.endDate,
        status: insertLta.status ?? 'active',
      })
      .returning();
    return inserted[0];
  }

  async getLta(id: string): Promise<Lta | null> {
    const result = await this.db.select().from(ltas).where(eq(ltas.id, id)).limit(1);
    return result[0] || null;
  }

  async getAllLtas(): Promise<Lta[]> {
    return await this.db.select().from(ltas);
  }

  async updateLta(id: string, updates: Partial<InsertLta>): Promise<Lta | null> {
    const updated = await this.db
      .update(ltas)
      .set(updates)
      .where(eq(ltas.id, id))
      .returning();
    return updated[0] || null;
  }

  async deleteLta(id: string): Promise<boolean> {
    await this.db.delete(ltas).where(eq(ltas.id, id));
    return true;
  }

  // LTA Products
  async assignProductToLta(insertLtaProduct: InsertLtaProduct): Promise<LtaProduct> {
    const inserted = await this.db
      .insert(ltaProducts)
      .values({
        ltaId: insertLtaProduct.ltaId,
        productId: insertLtaProduct.productId,
        contractPrice: insertLtaProduct.contractPrice,
        currency: insertLtaProduct.currency ?? 'USD',
      })
      .returning();
    return inserted[0];
  }

  async removeProductFromLta(ltaId: string, productId: string): Promise<boolean> {
    await this.db
      .delete(ltaProducts)
      .where(and(eq(ltaProducts.ltaId, ltaId), eq(ltaProducts.productId, productId)));
    return true;
  }

  async getLtaProducts(ltaId: string): Promise<LtaProduct[]> {
    return await this.db
      .select()
      .from(ltaProducts)
      .where(eq(ltaProducts.ltaId, ltaId));
  }

  async updateLtaProductPrice(id: string, contractPrice: string, currency?: string): Promise<LtaProduct | null> {
    const updated = await this.db
      .update(ltaProducts)
      .set({ contractPrice, currency })
      .where(eq(ltaProducts.id, id))
      .returning();
    return updated[0] || null;
  }

  // LTA Clients
  async assignClientToLta(insertLtaClient: InsertLtaClient): Promise<LtaClient> {
    const inserted = await this.db
      .insert(ltaClients)
      .values({
        ltaId: insertLtaClient.ltaId,
        clientId: insertLtaClient.clientId,
      })
      .returning();
    return inserted[0];
  }

  async removeClientFromLta(ltaId: string, clientId: string): Promise<boolean> {
    await this.db
      .delete(ltaClients)
      .where(and(eq(ltaClients.ltaId, ltaId), eq(ltaClients.clientId, clientId)));
    return true;
  }

  async getLtaClients(ltaId: string): Promise<LtaClient[]> {
    return await this.db
      .select()
      .from(ltaClients)
      .where(eq(ltaClients.ltaId, ltaId));
  }

  async getClientLtas(clientId: string): Promise<Lta[]> {
    const result = await this.db
      .select({ lta: ltas })
      .from(ltaClients)
      .innerJoin(ltas, eq(ltaClients.ltaId, ltas.id))
      .where(eq(ltaClients.clientId, clientId));

    return result.map(r => r.lta);
  }

  // Product queries for LTA context
  async getProductsForLta(ltaId: string): Promise<Array<Product & { contractPrice: string; currency: string }>> {
    const ltaProducts = await this.getLtaProducts(ltaId);
    const productsWithPricing: Array<Product & { contractPrice: string; currency: string }> = [];

    for (const ltaProduct of ltaProducts) {
      const product = await this.getProduct(ltaProduct.productId);
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

  // Get all products with client's LTA prices (if assigned)
  async getAllProductsWithClientPrices(clientId: string): Promise<Array<Product & { contractPrice?: string; currency?: string; ltaId?: string; hasPrice: boolean }>> {
    const allProducts = await this.getProducts();
    const clientLtas = await this.getClientLtas(clientId);
    const productsWithPricing: Array<Product & { contractPrice?: string; currency?: string; ltaId?: string; hasPrice: boolean }> = [];

    for (const product of allProducts) {
      let hasPrice = false;
      let contractPrice: string | undefined;
      let currency: string | undefined;
      let ltaId: string | undefined;

      // Check if product is in any of client's LTAs
      for (const lta of clientLtas) {
        const ltaProducts = await this.getLtaProducts(lta.id);
        const ltaProduct = ltaProducts.find(lp => lp.productId === product.id);

        if (ltaProduct) {
          hasPrice = true;
          contractPrice = ltaProduct.contractPrice;
          currency = ltaProduct.currency;
          ltaId = lta.id;
          break;
        }
      }

      productsWithPricing.push({
        ...product,
        contractPrice,
        currency,
        ltaId,
        hasPrice,
      });
    }

    return productsWithPricing;
  }

  // Get admin clients
  async getAdminClients(): Promise<Client[]> {
    return await this.db
      .select()
      .from(clients)
      .where(eq(clients.isAdmin, true));
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

  async bulkAssignProductsToLta(
    ltaId: string,
    products: Array<{ sku: string; contractPrice: string; currency: string }>
  ) {
    const results = {
      success: 0,
      failed: [] as Array<{ sku: string; error: string }>,
    };

    for (const item of products) {
      try {
        const product = Array.from(this.products.values()).find(p => p.sku === item.sku);

        if (!product) {
          results.failed.push({ sku: item.sku, error: 'Product not found' });
          continue;
        }

        const existingAssignment = Array.from(this.ltaProducts.values()).find(
          lp => lp.ltaId === ltaId && lp.productId === product.id
        );

        if (existingAssignment) {
          results.failed.push({ sku: item.sku, error: 'Already assigned to this LTA' });
          continue;
        }

        await this.assignProductToLta({
          ltaId,
          productId: product.id,
          contractPrice: item.contractPrice,
          currency: item.currency,
        });

        results.success++;
      } catch (error) {
        results.failed.push({ sku: item.sku, error: 'Assignment failed' });
      }
    }

    return results;
  }

  // Notifications
  async createNotification(data: {
    clientId: string;
    type: 'order_created' | 'order_status_changed' | 'system';
    titleEn: string;
    titleAr: string;
    messageEn: string;
    messageAr: string;
    metadata?: string;
  }): Promise<Notification> {
    const result = await this.db.insert(notifications).values({
      clientId: data.clientId,
      type: data.type,
      titleEn: data.titleEn,
      titleAr: data.titleAr,
      messageEn: data.messageEn,
      messageAr: data.messageAr,
      metadata: data.metadata || null,
    }).returning();

    return result[0];
  }

  async getClientNotifications(clientId: string): Promise<Notification[]> {
    const result = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.clientId, clientId))
      .orderBy(desc(notifications.createdAt))
      .execute();

    return result;
  }

  async markNotificationAsRead(id: string): Promise<Notification | null> {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .execute();

    const result = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .execute();

    return result[0] || null;
  }

  async markAllNotificationsAsRead(clientId: string): Promise<void> {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.clientId, clientId))
      .execute();
  }

  async deleteNotification(id: string): Promise<void> {
    await this.db.delete(notifications).where(eq(notifications.id, id)).execute();
  }

  async getUnreadNotificationCount(clientId: string): Promise<number> {
    const result = await this.db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.clientId, clientId),
        eq(notifications.isRead, false)
      ))
      .execute();

    return result.length;
  }
}

export const storage = new MemStorage();