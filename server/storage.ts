import {
  type Client,
  type CompanyUser,
  type ClientDepartment,
  type ClientLocation,
  type Vendor,
  type Product,
  type ClientPricing,
  type OrderTemplate,
  type Order,
  type OrderModification,
  type Lta,
  type LtaProduct,
  type LtaClient,
  type PriceRequest,
  type PriceOffer,
  type PushSubscription,
  type InsertClient,
  type InsertCompanyUser,
  type InsertClientDepartment,
  type InsertClientLocation,
  type InsertVendor,
  type InsertProduct,
  type InsertClientPricing,
  type InsertOrderTemplate,
  type InsertOrder,
  type InsertOrderModification,
  type InsertLta,
  type InsertLtaProduct,
  type InsertLtaClient,
  type InsertPriceRequest,
  type InsertPriceOffer,
  type InsertPasswordResetToken,
  type AuthUser,
  Notification,
  notifications,
  clients,
  companyUsers,
  clientDepartments,
  clientLocations,
  vendors,
  products,
  clientPricing,
  orderTemplates,
  orders,
  orderModifications,
  orderHistory, // Added orderHistory
  ltas,
  ltaProducts,
  ltaClients,
  priceRequests,
  priceOffers,
  passwordResetTokens,
  pushSubscriptions,
  documents, // Assuming 'documents' schema is imported from '@shared/schema'
  OrderFeedback, // Assuming OrderFeedback type is imported
  orderFeedback, // Assuming orderFeedback schema is imported
  InsertOrderFeedback, // Assuming InsertOrderFeedback type is imported
} from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";
import { eq, sql, desc, and, gte, lte, or, like, isNull, inArray } from 'drizzle-orm';
import crypto from "crypto";
import { db } from "./db";

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
  deleteClient(id: string): Promise<void>;

  // Company Users
  getCompanyUsers(companyId: string): Promise<CompanyUser[]>;
  getCompanyUser(id: string): Promise<CompanyUser | undefined>;
  createCompanyUser(user: InsertCompanyUser): Promise<CompanyUser>;
  updateCompanyUser(id: string, user: Partial<InsertCompanyUser>): Promise<CompanyUser | undefined>;
  deleteCompanyUser(id: string): Promise<void>;

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
  getProductsByIds(ids: string[]): Promise<Product[]>;

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
  getOrders(clientId?: string): Promise<Order[]>;
  getOrder(orderId: string): Promise<Order | undefined>;
  updateOrderStatus(orderId: string, status: string): Promise<Order | undefined>; // Added for admin panel
  updateOrder(orderId: string, updates: Partial<InsertOrder>): Promise<Order | undefined>;
  cancelOrder(orderId: string, updates: { cancellationReason: string; cancelledAt: Date; cancelledBy: string; status: string }): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;

  // Order Modifications
  createOrderModification(modification: InsertOrderModification): Promise<OrderModification>;
  getOrderModification(id: string): Promise<OrderModification | undefined>;
  getOrderModifications(orderId: string): Promise<OrderModification[]>;
  getAllOrderModifications(): Promise<OrderModification[]>;
  updateOrderModificationStatus(id: string, updates: { status: string; adminResponse: string | null; reviewedBy: string; reviewedAt: Date }): Promise<OrderModification | undefined>;

  // Order History
  createOrderHistory(history: InsertOrderHistory): Promise<OrderHistory>;
  getOrderHistory(orderId: string): Promise<OrderHistory[]>;

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
  getLtaProducts(ltaId: string | string[]): Promise<LtaProduct[]>;
  updateLtaProductPrice(id: string, contractPrice: string, currency?: string): Promise<LtaProduct | null>;

  // LTA Clients (assignment)
  assignClientToLta(ltaClient: InsertLtaClient): Promise<LtaClient>;
  removeClientFromLta(ltaId: string, clientId: string): Promise<boolean>;
  getLtaClients(ltaId: string): Promise<LtaClient[]>;
  getClientLtas(clientId: string): Promise<Lta[]>;

  // Product queries for LTA context
  getProductsForLta(ltaId: string): Promise<Array<Product & { contractPrice: string; currency: string }>>;
  getProductsForClient(clientId: string): Promise<Array<Product & { contractPrice: string; currency: string; ltaId: string }>>;
  getClientsForLta(ltaId: string): Promise<Client[]>;

  // Bulk operations
  bulkAssignProductsToLta(ltaId: string, products: Array<{ sku: string; contractPrice: string; currency: string }>): Promise<{ success: number; failed: Array<{ sku: string; error: string }> }>;

  // Notifications
  createNotification(data: {
    clientId: string | null; // Allow null for system-wide notifications
    type: 'order_created' | 'order_status_changed' | 'system' | 'price_request' | 'price_offer_ready' | 'price_request_sent';
    titleEn: string;
    titleAr: string;
    messageEn: string;
    messageAr: string;
    metadata?: string;
  }): Promise<Notification>;
  getNotification(id: string): Promise<Notification | null>;
  getClientNotifications(clientId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<Notification | null>;
  markAllNotificationsAsRead(clientId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  getUnreadNotificationCount(clientId: string): Promise<number>;

  // New methods
  getAllProductsWithClientPrices(clientId: string): Promise<Array<Product & { contractPrice?: string; currency?: string; ltaId?: string; hasPrice: boolean }>>;
  getAdminClients(): Promise<Client[]>;

  // Price Requests
  createPriceRequest(data: InsertPriceRequest): Promise<PriceRequest>;
  getPriceRequest(id: string): Promise<PriceRequest | null>;
  getPriceRequestsByClient(clientId: string): Promise<PriceRequest[]>;
  getAllPriceRequests(): Promise<PriceRequest[]>;
  updatePriceRequestStatus(id: string, status: string): Promise<PriceRequest | null>;
  getPriceRequestWithDetails(id: string): Promise<PriceRequest & { 
    client: Client; 
    lta?: Lta; 
    products: Array<Product & { quantity: number }> 
  } | null>;

  // Price Offers
  createPriceOffer(data: InsertPriceOffer): Promise<PriceOffer>;
  getPriceOffer(id: string): Promise<PriceOffer | null>;
  getPriceOffersByClient(clientId: string): Promise<PriceOffer[]>;
  getAllPriceOffers(): Promise<PriceOffer[]>;
  updatePriceOfferStatus(id: string, status: string, additionalData?: Partial<PriceOffer>): Promise<PriceOffer | null>;
  updatePriceOffer(id: string, data: Partial<PriceOffer>): Promise<PriceOffer | null>;
  deletePriceOffer(id: string): Promise<void>;

  // Password Reset Tokens
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<any>;
  getPasswordResetToken(token: string): Promise<any>;
  deletePasswordResetToken(id: string): Promise<void>;

  // Push Subscriptions
  savePushSubscription(data: {
    userId: string;
    userType: string;
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userAgent: string | null;
  }): Promise<any>;
  getPushSubscriptions(userId: string): Promise<Array<{ endpoint: string; keys: any }>>;
  deletePushSubscription(endpoint: string): Promise<void>;

  // Document Metadata Methods
  createDocumentMetadata(data: {
    fileName: string;
    fileUrl: string;
    documentType: 'price_offer' | 'order' | 'invoice' | 'contract' | 'lta_document';
    clientId?: string;
    ltaId?: string;
    orderId?: string;
    priceOfferId?: string;
    fileSize: number;
    checksum?: string;
    metadata?: any;
  }): Promise<any>;
  getDocumentsByType(documentType: string, clientId?: string): Promise<any[]>;
  getDocumentById(id: string): Promise<any | undefined>;
  searchDocuments(filters: {
    documentType?: string;
    clientId?: string;
    ltaId?: string;
    orderId?: string;
    priceOfferId?: string;
    startDate?: Date;
    endDate?: Date;
    searchTerm?: string;
  }, page?: number, pageSize?: number): Promise<{ documents: any[], totalCount: number }>;
  updateDocumentMetadata(id: string, updates: {
    viewCount?: number;
    lastViewedAt?: Date;
    metadata?: any;
  }): Promise<any | undefined>;
  deleteDocument(id: string): Promise<boolean>;

  // Document Access Log Methods
  createDocumentAccessLog(data: {
    documentId: string;
    clientId: string;
    action: 'view' | 'download' | 'generate';
    ipAddress: string | null;
    userAgent: string | null;
    accessedAt: Date;
  }): Promise<void>;
  getDocumentAccessLogs(documentId: string): Promise<any[]>;
  incrementDocumentViewCount(documentId: string): Promise<void>;

  // Order Feedback
  createOrderFeedback(data: InsertOrderFeedback): Promise<OrderFeedback>;

  // LTA Documents
  createLtaDocument(data: {
    ltaId: string;
    nameEn: string;
    nameAr: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    uploadedBy: string;
  }): Promise<any>;
  getLtaDocuments(ltaId: string): Promise<any[]>;
  getLtaDocument(id: string): Promise<any | undefined>;
  deleteLtaDocument(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  public sessionStore: session.Store;
  private db = db;
  private clients: Map<string, Client>;
  private clientDepartments: Map<string, ClientDepartment>;
  private clientLocations: Map<string, ClientLocation>;
  private products: Map<string, Product>;
  private clientPricing: Map<string, ClientPricing>;
  private orderTemplates: Map<string, OrderTemplate>;
  private orders: Map<string, Order>;
  private orderHistories: Map<string, OrderHistory> = new Map(); // Added for order history
  private orderFeedbackMap: Map<string, OrderFeedback> = new Map(); // Added for order feedback

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
    this.orderHistories = new Map(); // Initialize order history map
    this.orderFeedbackMap = new Map(); // Initialize order feedback map
    this.ltas = new Map();
    this.ltaProducts = new Map();
    this.ltaClients = new Map();
  }

  // Client Authentication
  async getClientByUsername(username: string): Promise<Client | undefined> {
    const result = await this.db.select().from(clients).where(eq(clients.username, username)).limit(1);
    return result[0];
  }

  async getCompanyUserByUsername(username: string): Promise<CompanyUser | undefined> {
    const result = await this.db.select().from(companyUsers).where(eq(companyUsers.username, username)).limit(1);
    return result[0];
  }

  async validateClientCredentials(username: string, password: string): Promise<AuthUser | null> {
    // Import the password comparison function
    const { comparePasswords } = await import('./auth');

    // Try company_users first (new multi-user system)
    const companyUser = await this.getCompanyUserByUsername(username);
    if (companyUser) {
      if (!companyUser.isActive) {
        return null;
      }

      // Check if password exists (old OAuth accounts won't have passwords)
      if (!companyUser.password) {
        return null;
      }

      const isValidPassword = await comparePasswords(password, companyUser.password);
      if (!isValidPassword) {
        return null;
      }

      const company = await this.getClient(companyUser.companyId);
      if (!company) {
        return null;
      }

      return {
        id: company.id, // Company ID for backwards compatibility with existing routes
        userId: companyUser.id, // Company user ID for multi-user system
        username: companyUser.username,
        nameEn: companyUser.nameEn,
        nameAr: companyUser.nameAr,
        email: companyUser.email ?? undefined,
        phone: companyUser.phone ?? undefined,
        isAdmin: company.isAdmin,
        companyId: company.id,
        companyNameEn: company.nameEn,
        companyNameAr: company.nameAr,
      };
    }

    // Fallback to clients table (backwards compatibility for legacy accounts)
    const client = await this.getClientByUsername(username);
    if (!client) {
      return null;
    }

    // Check if password exists (old OAuth accounts won't have passwords)
    if (!client.password) {
      return null;
    }

    const isValidPassword = await comparePasswords(password, client.password);
    if (!isValidPassword) {
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
    // Build update object with only provided fields
    const updateData: any = {};

    if (data.nameEn !== undefined) updateData.nameEn = data.nameEn;
    if (data.nameAr !== undefined) updateData.nameAr = data.nameAr;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.isAdmin !== undefined) updateData.isAdmin = data.isAdmin;
    if (data.password !== undefined) updateData.password = data.password;

    // If no fields to update, return the existing client
    if (Object.keys(updateData).length === 0) {
      return await this.getClient(id);
    }

    const updated = await this.db
      .update(clients)
      .set(updateData)
      .where(eq(clients.id, id))
      .returning();
    return updated[0];
  }

  async deleteClient(id: string): Promise<void> {
    await this.db.delete(clients).where(eq(clients.id, id));
  }

  // Company Users
  async getCompanyUsers(companyId: string): Promise<CompanyUser[]> {
    return await this.db
      .select()
      .from(companyUsers)
      .where(eq(companyUsers.companyId, companyId));
  }

  async getCompanyUser(id: string): Promise<CompanyUser | undefined> {
    const result = await this.db
      .select()
      .from(companyUsers)
      .where(eq(companyUsers.id, id))
      .limit(1);
    return result[0];
  }

  async createCompanyUser(insertUser: InsertCompanyUser): Promise<CompanyUser> {
    const inserted = await this.db
      .insert(companyUsers)
      .values({
        companyId: insertUser.companyId,
        username: insertUser.username,
        password: insertUser.password,
        nameEn: insertUser.nameEn,
        nameAr: insertUser.nameAr,
        email: insertUser.email ?? null,
        phone: insertUser.phone ?? null,
        departmentType: insertUser.departmentType ?? null,
        isActive: insertUser.isActive ?? true,
      })
      .returning();
    return inserted[0];
  }

  async updateCompanyUser(id: string, updates: Partial<InsertCompanyUser>): Promise<CompanyUser | undefined> {
    const updated = await this.db
      .update(companyUsers)
      .set(updates)
      .where(eq(companyUsers.id, id))
      .returning();
    return updated[0];
  }

  async deleteCompanyUser(id: string): Promise<void> {
    await this.db.delete(companyUsers).where(eq(companyUsers.id, id));
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
        latitude: insertLoc.latitude ?? null,
        longitude: insertLoc.longitude ?? null,
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

  async getProductsByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];

    return await this.db
      .select()
      .from(products)
      .where(sql`${products.id} = ANY(${ids})`);
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    const result = await this.db.select().from(products).where(eq(products.sku, sku)).limit(1);
    return result[0];
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const inserted = await this.db
      .insert(products)
      .values(insertProduct)
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
  async getOrders(clientId?: string): Promise<Order[]> {
    if (clientId) {
      return await this.db
        .select()
        .from(orders)
        .where(eq(orders.clientId, clientId))
        .orderBy(desc(orders.createdAt));
    }
    return await this.db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(orderId: string, status: string) {
    const [order] = await this.db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, orderId))
      .returning();
    return order;
  }

  async getOrder(orderId: string): Promise<Order | undefined> {
    const result = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    return result[0];
  }

  async updateOrder(orderId: string, updates: Partial<InsertOrder>): Promise<Order | undefined> {
    const result = await this.db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, orderId))
      .returning();
    return result[0];
  }

  async cancelOrder(orderId: string, updates: { cancellationReason: string; cancelledAt: Date; cancelledBy: string; status: string }): Promise<Order | undefined> {
    const result = await this.db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, orderId))
      .returning();
    return result[0];
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

  // Order Modifications
  async createOrderModification(modification: InsertOrderModification): Promise<OrderModification> {
    const inserted = await this.db
      .insert(orderModifications)
      .values(modification)
      .returning();
    return inserted[0];
  }

  async getOrderModification(id: string): Promise<OrderModification | undefined> {
    const result = await this.db
      .select()
      .from(orderModifications)
      .where(eq(orderModifications.id, id))
      .limit(1);
    return result[0];
  }

  async getOrderModifications(orderId: string): Promise<OrderModification[]> {
    return await this.db
      .select()
      .from(orderModifications)
      .where(eq(orderModifications.orderId, orderId))
      .orderBy(desc(orderModifications.createdAt));
  }

  async getAllOrderModifications(): Promise<OrderModification[]> {
    return await this.db
      .select()
      .from(orderModifications)
      .orderBy(desc(orderModifications.createdAt));
  }

  async updateOrderModificationStatus(
    id: string,
    updates: { status: string; adminResponse: string | null; reviewedBy: string; reviewedAt: Date }
  ): Promise<OrderModification | undefined> {
    const result = await this.db
      .update(orderModifications)
      .set(updates)
      .where(eq(orderModifications.id, id))
      .returning();
    return result[0];
  }

  // Order History
  async createOrderHistory(history: InsertOrderHistory): Promise<OrderHistory> {
    const inserted = await this.db
      .insert(orderHistory)
      .values(history)
      .returning();
    return inserted[0];
  }

  async getOrderHistory(orderId: string): Promise<OrderHistory[]> {
    const history = await this.db
      .select()
      .from(orderHistory)
      .where(eq(orderHistory.orderId, orderId))
      .orderBy(orderHistory.changedAt);

    return history.reverse(); // Reverse to get newest first
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

  async getLtaProducts(ltaId: string | string[]): Promise<LtaProduct[]> {
    // Accept either a single ltaId or an array for bulk queries
    if (Array.isArray(ltaId)) {
      if (ltaId.length === 0) return [];
      return await this.db
        .select()
        .from(ltaProducts)
        .where(inArray(ltaProducts.ltaId, ltaId));
    }
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
    const productsWithPricing: Array<Product & { contractPrice: string; currency: string }>= [];

    // Fetch all product IDs
    const productIds = ltaProducts.map(lp => lp.productId);

    // Fetch all products in a single query
    const products = await this.getProductsByIds(productIds);
    const productMap = new Map(products.map(p => [p.id, p]));

    for (const ltaProduct of ltaProducts) {
      const product = productMap.get(ltaProduct.productId);
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

  // Get clients assigned to a specific LTA with full client details
  async getClientsForLta(ltaId: string): Promise<Client[]> {
    const ltaClients = await this.getLtaClients(ltaId);
    const clients: Client[] = [];

    for (const ltaClient of ltaClients) {
      const client = await this.getClient(ltaClient.clientId);
      if (client) {
        clients.push(client);
      }
    }

    return clients;
  }

  // Get price request with full product details
  async getPriceRequestWithDetails(id: string): Promise<PriceRequest & { 
    client: Client; 
    lta?: Lta; 
    products: Array<Product & { quantity: number }> 
  } | null> {
    const request = await this.getPriceRequest(id);
    if (!request) return null;

    const client = await this.getClient(request.clientId);
    if (!client) return null;

    let lta: Lta | undefined;
    if (request.ltaId) {
      lta = await this.getLta(request.ltaId);
    }

    const products: Array<Product & { quantity: number }> = [];
    if (request.products && Array.isArray(request.products)) {
      for (const item of request.products) {
        if (item.productId && item.quantity) {
          const product = await this.getProduct(item.productId);
          if (product) {
            products.push({
              ...product,
              quantity: item.quantity
            });
          }
        }
      }
    }

    return {
      ...request,
      client,
      lta,
      products
    };
  }

  // Get all products with client's LTA prices (if assigned) - OPTIMIZED
  async getAllProductsWithClientPrices(clientId: string): Promise<Array<Product & { contractPrice?: string; currency?: string; ltaId?: string; hasPrice: boolean }>> {
    const allProducts = await this.getProducts();
    const clientLtas = await this.getClientLtas(clientId);

    // Get all LTA IDs for this client
    const ltaIds = clientLtas.map(lta => lta.id);

    // Load ALL lta products for client's LTAs in ONE query (instead of N queries)
    const allLtaProducts = ltaIds.length > 0
      ? await this.getLtaProducts(ltaIds)
      : [];

    // Build a lookup map for fast access: productId -> ltaProduct
    const ltaProductMap = new Map<string, LtaProduct>();
    for (const ltaProduct of allLtaProducts) {
      // Store the first match (priority to first LTA)
      if (!ltaProductMap.has(ltaProduct.productId)) {
        ltaProductMap.set(ltaProduct.productId, ltaProduct);
      }
    }

    // Map products with pricing info
    const productsWithPricing: Array<Product & { contractPrice?: string; currency?: string; ltaId?: string; hasPrice: boolean }> = allProducts.map(product => {
      const ltaProduct = ltaProductMap.get(product.id);

      if (ltaProduct) {
        return {
          ...product,
          contractPrice: ltaProduct.contractPrice,
          currency: ltaProduct.currency,
          ltaId: ltaProduct.ltaId,
          hasPrice: true,
        };
      }

      return {
        ...product,
        contractPrice: undefined,
        currency: undefined,
        ltaId: undefined,
        hasPrice: false,
      };
    });

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

    // Fetch all product IDs across all client LTAs
    const allLtaProducts = await this.getLtaProducts(clientLtas.map(lta => lta.id));
    const productIds = allLtaProducts.map(lp => lp.productId);

    // Fetch all relevant products in one go
    const products = await this.getProductsByIds(productIds);
    const productMap = new Map(products.map(p => [p.id, p]));

    // Map products with pricing info
    for (const ltaProduct of allLtaProducts) {
      const product = productMap.get(ltaProduct.productId);
      if (product) {
        productsWithPricing.push({
          ...product,
          contractPrice: ltaProduct.contractPrice,
          currency: ltaProduct.currency,
          ltaId: ltaProduct.ltaId,
        });
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

    // Validate LTA exists
    const lta = await this.getLta(ltaId);
    if (!lta) {
      throw new Error('LTA not found');
    }

    // Fetch all products by SKU in one query to minimize DB calls
    const skus = products.map(p => p.sku);
    const existingProducts = await db.select().from(products).where(sql`${products.sku} = ANY(${skus})`);
    const productMap = new Map(existingProducts.map(p => [p.sku, p]));

    // Fetch existing LTA products for this LTA to check for duplicates
    const existingLtaProducts = await this.getLtaProducts(ltaId);
    const existingLtaProductMap = new Map(existingLtaProducts.map(lp => [lp.productId, lp]));

    for (const item of products) {
      try {
        // Validate inputs
        if (!item.sku || !item.contractPrice) {
          results.failed.push({ sku: item.sku || 'unknown', error: 'Missing SKU or contract price' });
          continue;
        }

        const product = productMap.get(item.sku);

        if (!product) {
          results.failed.push({ sku: item.sku, error: 'Product not found' });
          continue;
        }

        // Check for existing assignment in database using the pre-fetched map
        if (existingLtaProductMap.has(product.id)) {
          results.failed.push({ sku: item.sku, error: 'Already assigned to this LTA' });
          continue;
        }

        await this.assignProductToLta({
          ltaId,
          productId: product.id,
          contractPrice: item.contractPrice,
          currency: item.currency || 'USD',
        });

        results.success++;
      } catch (error) {
        console.error('Bulk assignment error:', error);
        results.failed.push({
          sku: item.sku,
          error: error instanceof Error ? error.message : 'Assignment failed'
        });
      }
    }

    return results;
  }

  // Notifications
  async createNotification(data: {
    clientId: string | null; // Allow null for system-wide notifications
    type: 'order_created' | 'order_status_changed' | 'system' | 'price_request' | 'price_offer_ready' | 'price_request_sent';
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
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    }).returning();

    return result[0];
  }

  async getNotification(id: string): Promise<Notification | null> {
    const result = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1)
      .execute();

    return result[0] || null;
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

  // Price Requests
  async createPriceRequest(data: InsertPriceRequest): Promise<PriceRequest> {
    const result = await this.db
      .insert(priceRequests)
      .values(data)
      .returning()
      .execute();
    return result[0];
  }

  async getPriceRequest(id: string): Promise<PriceRequest | null> {
    const result = await this.db
      .select()
      .from(priceRequests)
      .where(eq(priceRequests.id, id))
      .execute();
    return result[0] || null;
  }

  async getPriceRequestsByClient(clientId: string): Promise<PriceRequest[]> {
    const result = await this.db
      .select()
      .from(priceRequests)
      .where(eq(priceRequests.clientId, clientId))
      .orderBy(desc(priceRequests.requestedAt))
      .execute();
    return result;
  }

  async getAllPriceRequests(): Promise<PriceRequest[]> {
    const result = await this.db
      .select()
      .from(priceRequests)
      .orderBy(desc(priceRequests.requestedAt))
      .execute();
    return result;
  }

  async updatePriceRequestStatus(id: string, status: string): Promise<PriceRequest | null> {
    await this.db
      .update(priceRequests)
      .set({
        status,
        processedAt: status === 'processed' ? new Date() : undefined
      })
      .where(eq(priceRequests.id, id))
      .execute();

    return this.getPriceRequest(id);
  }

  // Price Offers
  async createPriceOffer(data: InsertPriceOffer): Promise<PriceOffer> {
    const result = await this.db
      .insert(priceOffers)
      .values(data)
      .returning()
      .execute();
    return result[0];
  }

  async getPriceOffer(id: string): Promise<PriceOffer | null> {
    const result = await this.db
      .select()
      .from(priceOffers)
      .where(eq(priceOffers.id, id))
      .execute();
    return result[0] || null;
  }

  async getPriceOffersByClient(clientId: string): Promise<PriceOffer[]> {
    const result = await this.db
      .select()
      .from(priceOffers)
      .where(eq(priceOffers.clientId, clientId))
      .orderBy(desc(priceOffers.createdAt))
      .execute();

    // Filter out draft offers - clients should only see sent/viewed/accepted/rejected offers
    const visibleOffers = result.filter(offer => offer.status !== 'draft');
    console.log(`[Storage] Client ${clientId}: ${result.length} total, ${visibleOffers.length} visible (excluding drafts)`);
    return visibleOffers;
  }

  async getAllPriceOffers(): Promise<PriceOffer[]> {
    const offers = await db.select().from(priceOffers).orderBy(desc(priceOffers.createdAt));
    return offers;
  }

  async updatePriceOfferStatus(offerId: string, status: string): Promise<PriceOffer | null> {
    const updateData: any = { status, updatedAt: new Date() };

    // If changing to sent, set sentAt timestamp
    if (status === 'sent') {
      updateData.sentAt = new Date();
    }

    const [updatedOffer] = await db
      .update(priceOffers)
      .set(updateData)
      .where(eq(priceOffers.id, offerId))
      .returning();

    return updatedOffer || null;
  }

  async updatePriceOffer(id: string, data: Partial<PriceOffer>): Promise<PriceOffer | null> {
    await this.db
      .update(priceOffers)
      .set(data)
      .where(eq(priceOffers.id, id))
      .execute();

    return this.getPriceOffer(id);
  }

  async deletePriceOffer(id: string): Promise<void> {
    await this.db
      .delete(priceOffers)
      .where(eq(priceOffers.id, id))
      .execute();
  }

  async updateExpiredPriceOffers(): Promise<number> {
    const now = new Date();

    // Get all offers that are expired but not yet marked as such
    const allOffers = await this.getAllPriceOffers();
    const expiredOffers = allOffers.filter(offer =>
      new Date(offer.validUntil) < now &&
      offer.status !== 'accepted' &&
      offer.status !== 'rejected' &&
      offer.status !== 'expired' &&
      offer.status !== 'revoked'
    );

    // Update each expired offer
    const updatePromises = expiredOffers.map(offer =>
      this.db
        .update(priceOffers)
        .set({ status: 'expired' })
        .where(eq(priceOffers.id, offer.id))
        .execute()
    );

    await Promise.all(updatePromises);
    return expiredOffers.length;
  }

  // Password Reset Tokens
  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<any> {
    const result = await this.db
      .insert(passwordResetTokens)
      .values(token)
      .returning()
      .execute();
    return result[0];
  }

  async getPasswordResetToken(token: string): Promise<any> {
    const result = await this.db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1)
      .execute();
    return result[0] || null;
  }

  async deletePasswordResetToken(id: string): Promise<void> {
    await this.db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.id, id))
      .execute();
  }

  // Push Subscriptions
  async savePushSubscription(data: {
    userId: string;
    userType: string;
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userAgent: string | null;
  }): Promise<PushSubscription> {
    // Delete existing subscription with same endpoint (update scenario)
    await this.db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, data.endpoint))
      .execute();

    const [subscription] = await this.db
      .insert(pushSubscriptions)
      .values({
        userId: data.userId,
        userType: data.userType,
        endpoint: data.endpoint,
        keys: data.keys,
        userAgent: data.userAgent,
      })
      .returning()
      .execute();

    return subscription;
  }

  async getPushSubscriptions(userId: string): Promise<Array<{ endpoint: string; keys: any }>> {
    const subscriptions = await this.db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId))
      .execute();

    return subscriptions.map(sub => ({
      endpoint: sub.endpoint,
      keys: sub.keys,
    }));
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    await this.db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint))
      .execute();
  }

  // Document Metadata Methods
  async createDocumentMetadata(data: {
    fileName: string;
    fileUrl: string;
    documentType: 'price_offer' | 'order' | 'invoice' | 'contract' | 'lta_document';
    clientId?: string;
    ltaId?: string;
    orderId?: string;
    priceOfferId?: string;
    fileSize: number;
    checksum?: string;
    metadata?: any;
  }): Promise<any> {
    const [doc] = await db.insert(documents).values({
      id: crypto.randomUUID(),
      ...data,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      createdAt: new Date(),
    }).returning();
    return doc;
  }

  async getDocumentsByType(documentType: string, clientId?: string): Promise<any[]> {
    let query = db.select().from(documents).where(eq(documents.documentType, documentType));

    if (clientId) {
      query = query.where(eq(documents.clientId, clientId));
    }

    return await query.orderBy(desc(documents.createdAt));
  }

  async getDocumentById(id: string): Promise<any | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async searchDocuments(filters: {
    documentType?: string;
    clientId?: string;
    ltaId?: string;
    orderId?: string;
    priceOfferId?: string;
    startDate?: Date;
    endDate?: Date;
    searchTerm?: string;
  }, page: number = 1, pageSize: number = 20): Promise<{ documents: any[], totalCount: number }> {
    let query = db.select().from(documents);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(documents);
    const conditions = [];

    if (filters.documentType) {
      conditions.push(eq(documents.documentType, filters.documentType));
    }
    if (filters.clientId) {
      conditions.push(eq(documents.clientId, filters.clientId));
    }
    if (filters.ltaId) {
      conditions.push(eq(documents.ltaId, filters.ltaId));
    }
    if (filters.orderId) {
      conditions.push(eq(documents.orderId, filters.orderId));
    }
    if (filters.priceOfferId) {
      conditions.push(eq(documents.priceOfferId, filters.priceOfferId));
    }
    if (filters.startDate) {
      conditions.push(gte(documents.createdAt, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(documents.createdAt, filters.endDate));
    }
    if (filters.searchTerm) {
      conditions.push(
        sql`(${documents.fileName} ILIKE ${`%${filters.searchTerm}%`} OR 
            ${documents.documentType} ILIKE ${`%${filters.searchTerm}%`})`
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
      countQuery = countQuery.where(and(...conditions));
    }

    // Get total count
    const [{ count: totalCount }] = await countQuery;

    // Apply pagination
    const offset = (page - 1) * pageSize;
    const documents = await query
      .orderBy(desc(documents.createdAt))
      .limit(pageSize)
      .offset(offset);

    return { documents, totalCount };
  }

  async updateDocumentMetadata(id: string, updates: {
    viewCount?: number;
    lastViewedAt?: Date;
    metadata?: any;
  }): Promise<any | undefined> {
    const updateData: any = {};

    if (updates.viewCount !== undefined) updateData.viewCount = updates.viewCount;
    if (updates.lastViewedAt) updateData.lastViewedAt = updates.lastViewedAt;
    if (updates.metadata) updateData.metadata = JSON.stringify(updates.metadata);

    const [doc] = await db.update(documents)
      .set(updateData)
      .where(eq(documents.id, id))
      .returning();

    return doc;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return result.rowCount > 0;
  }

  // Document Access Log Methods
  async createDocumentAccessLog(data: {
    documentId: string;
    clientId: string;
    action: 'view' | 'download' | 'generate';
    ipAddress: string | null;
    userAgent: string | null;
    accessedAt: Date;
  }): Promise<void> {
    await this.db.execute(sql`
      INSERT INTO document_access_logs (
        id, document_id, client_id, action, ip_address, user_agent, accessed_at
      ) VALUES (
        gen_random_uuid(), ${data.documentId}, ${data.clientId}, ${data.action},
        ${data.ipAddress}, ${data.userAgent}, ${data.accessedAt}
      )
    `);
  }

  async getDocumentAccessLogs(documentId: string): Promise<any[]> {
    const result = await this.db.execute(sql`
      SELECT dal.*, c.name_en as client_name_en, c.name_ar as client_name_ar
      FROM document_access_logs dal
      LEFT JOIN clients c ON dal.client_id = c.id
      WHERE dal.document_id = ${documentId}
      ORDER BY dal.accessed_at DESC
      LIMIT 100
    `);

    return result.rows;
  }

  async incrementDocumentViewCount(documentId: string): Promise<void> {
    await this.db.execute(sql`
      UPDATE documents
      SET view_count = view_count + 1, last_viewed_at = NOW()
      WHERE id = ${documentId}
    `);
  }

  // Order Feedback
  async createOrderFeedback(data: InsertOrderFeedback): Promise<OrderFeedback> {
    try {
      const [feedback] = await db.insert(orderFeedback).values(data).returning();
      return feedback;
    } catch (error) {
      console.error('Storage: Error creating feedback:', error);
      throw error;
    }
  }

  // LTA Documents
  async createLtaDocument(data: {
    ltaId: string;
    nameEn: string;
    nameAr: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    uploadedBy: string;
  }): Promise<any> {
    const result = await this.db.execute(sql`
      INSERT INTO lta_documents (
        id, lta_id, name_en, name_ar, file_name, file_url,
        file_size, file_type, uploaded_by, created_at
      ) VALUES (
        gen_random_uuid(), ${data.ltaId}, ${data.nameEn}, ${data.nameAr},
        ${data.fileName}, ${data.fileUrl}, ${data.fileSize}, ${data.fileType},
        ${data.uploadedBy}, NOW()
      )
      RETURNING *
    `);
    return result.rows[0];
  }

  async getLtaDocuments(ltaId: string): Promise<any[]> {
    const result = await this.db.execute(sql`
      SELECT * FROM lta_documents 
      WHERE lta_id = ${ltaId}
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  async getLtaDocument(id: string): Promise<any | undefined> {
    const result = await this.db.execute(sql`
      SELECT * FROM lta_documents WHERE id = ${id}
    `);
    return result.rows[0];
  }

  async deleteLtaDocument(id: string): Promise<boolean> {
    await this.db.execute(sql`
      DELETE FROM lta_documents WHERE id = ${id}
    `);
    return true;
  }
}

export const storage = new MemStorage();