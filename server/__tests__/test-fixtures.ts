import { db } from '../db';
import { 
  clients, products, ltas, orders, priceOffers, orderFeedback, issueReports,
  clientLocations, clientDepartments 
} from '../../shared/schema';
import type { InsertClient, InsertProduct, InsertLta, InsertOrder, InsertPriceOffer } from '../../shared/schema';
import type { InsertOrderFeedback, InsertIssueReport } from '../../shared/feedback-schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export interface TestData {
  client: { id: string; nameEn: string; nameAr: string; email: string };
  admin: { id: string; nameEn: string; nameAr: string; email: string };
  product: { id: string; sku: string; nameEn: string; nameAr: string };
  lta: { id: string; nameEn: string; nameAr: string; status: string };
  order: { id: string; clientId: string; status: string };
  priceOffer: { id: string; offerNumber: string; clientId: string };
  feedback: { id: string; orderId: string; clientId: string };
  issue: { id: string; userId: string; status: string };
}

/**
 * Creates a complete test data set including client, admin, product, LTA, etc.
 * Returns IDs that need to be cleaned up in afterAll hooks
 */
export async function createTestData(): Promise<TestData> {
  // Create test client
  const clientData: InsertClient = {
    nameEn: 'Test Client Company',
    nameAr: 'شركة العميل التجريبية',
    username: `testclient_${randomUUID()}`,
    password: 'hashedpassword123',
    email: `testclient_${randomUUID()}@example.com`,
    phone: '+1234567890',
    isAdmin: false,
  };
  
  const [client] = await db.insert(clients).values(clientData).returning();
  
  // Create test admin
  const adminData: InsertClient = {
    nameEn: 'Test Admin',
    nameAr: 'المدير التجريبي',
    username: `testadmin_${randomUUID()}`,
    password: 'hashedpassword123',
    email: `testadmin_${randomUUID()}@example.com`,
    phone: '+1234567891',
    isAdmin: true,
  };
  
  const [admin] = await db.insert(clients).values(adminData).returning();
  
  // Create test LTA
  const ltaData: InsertLta = {
    nameEn: 'Test LTA 2024',
    nameAr: 'اتفاقية تجريبية 2024',
    descriptionEn: 'Test LTA Description',
    descriptionAr: 'وصف الاتفاقية التجريبية',
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    status: 'draft',
  };
  
  const [lta] = await db.insert(ltas).values(ltaData).returning();
  
  // Create test product
  const productData: InsertProduct = {
    sku: `TEST-${randomUUID().substring(0, 8)}`,
    nameEn: 'Test Product',
    nameAr: 'منتج تجريبي',
    descriptionEn: 'Test product description',
    descriptionAr: 'وصف المنتج التجريبي',
    category: 'test',
    vendorId: null,
    imageUrl: null,
  };
  
  const [product] = await db.insert(products).values(productData).returning();
  
  // Create test order
  const orderData: InsertOrder = {
    clientId: client.id,
    ltaId: lta.id,
    items: JSON.stringify([
      {
        productId: product.id,
        sku: product.sku,
        nameEn: product.nameEn,
        nameAr: product.nameAr,
        quantity: 5,
        unitPrice: '100.00',
      }
    ]),
    totalAmount: '500.00',
    status: 'pending',
  };
  
  const [order] = await db.insert(orders).values(orderData).returning();
  
  // Create test price offer
  const priceOfferData: InsertPriceOffer = {
    offerNumber: `OFFER-${randomUUID().substring(0, 8)}`,
    clientId: client.id,
    ltaId: lta.id,
    requestId: null,
    items: JSON.stringify([
      {
        productId: product.id,
        sku: product.sku,
        nameEn: product.nameEn,
        nameAr: product.nameAr,
        quantity: 10,
        unitPrice: '95.00',
      }
    ]),
    subtotal: '950.00',
    tax: '0.00',
    total: '950.00',
    notes: 'Test price offer',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'pending',
  };
  
  const [priceOffer] = await db.insert(priceOffers).values(priceOfferData).returning();
  
  // Create test feedback
  const feedbackData: InsertOrderFeedback = {
    orderId: order.id,
    clientId: client.id,
    rating: 5,
    orderingProcessRating: 5,
    productQualityRating: 4,
    deliverySpeedRating: 5,
    communicationRating: 5,
    comments: 'Great service!',
    wouldRecommend: true,
  };
  
  const [feedback] = await db.insert(orderFeedback).values(feedbackData).returning();
  
  // Create test issue report
  const issueData: InsertIssueReport = {
    userId: client.id,
    userType: 'client',
    orderId: order.id,
    issueType: 'bug',
    severity: 'medium',
    title: 'Test Issue Report',
    description: 'This is a test issue description',
    steps: 'Step 1: Reproduce issue',
    expectedBehavior: 'Should work correctly',
    actualBehavior: 'Does not work',
    browserInfo: 'Chrome 120',
    screenSize: '1920x1080',
    status: 'open',
  };
  
  const [issue] = await db.insert(issueReports).values(issueData).returning();
  
  return {
    client: { id: client.id, nameEn: client.nameEn, nameAr: client.nameAr, email: client.email! },
    admin: { id: admin.id, nameEn: admin.nameEn, nameAr: admin.nameAr, email: admin.email! },
    product: { id: product.id, sku: product.sku, nameEn: product.nameEn, nameAr: product.nameAr },
    lta: { id: lta.id, nameEn: lta.nameEn, nameAr: lta.nameAr, status: lta.status },
    order: { id: order.id, clientId: order.clientId, status: order.status },
    priceOffer: { id: priceOffer.id, offerNumber: priceOffer.offerNumber, clientId: priceOffer.clientId },
    feedback: { id: feedback.id, orderId: feedback.orderId, clientId: feedback.clientId },
    issue: { id: issue.id, userId: issue.userId, status: issue.status },
  };
}

/**
 * Cleans up all test data created during tests
 */
export async function cleanupTestData(testData: TestData): Promise<void> {
  try {
    await db.delete(issueReports).where(eq(issueReports.id, testData.issue.id));
    await db.delete(orderFeedback).where(eq(orderFeedback.id, testData.feedback.id));
    await db.delete(priceOffers).where(eq(priceOffers.id, testData.priceOffer.id));
    await db.delete(orders).where(eq(orders.id, testData.order.id));
    await db.delete(products).where(eq(products.id, testData.product.id));
    await db.delete(ltas).where(eq(ltas.id, testData.lta.id));
    await db.delete(clients).where(eq(clients.id, testData.admin.id));
    await db.delete(clients).where(eq(clients.id, testData.client.id));
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

/**
 * Creates minimal test client for simpler test cases
 */
export async function createTestClient(): Promise<{ id: string; email: string; isAdmin: boolean }> {
  const clientData: InsertClient = {
    nameEn: 'Simple Test Client',
    nameAr: 'عميل تجريبي بسيط',
    username: `simpleclient_${randomUUID()}`,
    password: 'hashedpassword123',
    email: `simpleclient_${randomUUID()}@example.com`,
    isAdmin: false,
  };
  
  const [client] = await db.insert(clients).values(clientData).returning();
  return { id: client.id, email: client.email!, isAdmin: client.isAdmin };
}

/**
 * Cleans up a test client
 */
export async function cleanupTestClient(clientId: string): Promise<void> {
  await db.delete(clients).where(eq(clients.id, clientId));
}
