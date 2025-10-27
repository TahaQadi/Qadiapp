
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../db';
import { 
  clients, 
  products, 
  ltas, 
  ltaProducts, 
  ltaClients,
  orders,
  orderItems,
  clientDepartments,
  clientLocations,
  orderFeedback,
  issueReports,
  priceRequests,
  demoRequests,
  ltaDocuments
} from '../../shared/schema';
import { storage } from '../storage';
import { hashPassword } from '../auth';
import { TemplateStorage } from '../template-storage';
import { eq } from 'drizzle-orm';

describe('Data Seeding Tests', () => {
  let testClientId: number;
  let testAdminId: number;
  let testProductIds: number[] = [];
  let testLtaId: number;
  let testOrderId: number;

  beforeAll(async () => {
    // Clean up any existing test data
    await db.delete(orderFeedback);
    await db.delete(issueReports);
    await db.delete(priceRequests);
    await db.delete(demoRequests);
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(clientDepartments);
    await db.delete(clientLocations);
    await db.delete(ltaClients);
    await db.delete(ltaProducts);
    await db.delete(ltaDocuments);
    await db.delete(ltas);
    await db.delete(products);
    await db.delete(clients);
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(orderFeedback);
    await db.delete(issueReports);
    await db.delete(priceRequests);
    await db.delete(demoRequests);
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(clientDepartments);
    await db.delete(clientLocations);
    await db.delete(ltaClients);
    await db.delete(ltaProducts);
    await db.delete(ltaDocuments);
    await db.delete(ltas);
    await db.delete(products);
    await db.delete(clients);
  });

  describe('Client Seeding', () => {
    it('should create admin user', async () => {
      const admin = await storage.createClient({
        username: 'test_admin_' + Date.now(),
        password: await hashPassword('admin123'),
        nameEn: 'Test Administrator',
        nameAr: 'مسؤول الاختبار',
        email: 'test.admin@example.com',
        phone: '+966500000001',
        isAdmin: true,
      });

      testAdminId = admin.id;

      expect(admin).toBeDefined();
      expect(admin.isAdmin).toBe(true);
      expect(admin.nameEn).toBe('Test Administrator');
      expect(admin.nameAr).toBe('مسؤول الاختبار');
    });

    it('should create regular client user', async () => {
      const client = await storage.createClient({
        username: 'test_client_' + Date.now(),
        password: await hashPassword('client123'),
        nameEn: 'Test Corporation',
        nameAr: 'شركة الاختبار',
        email: 'test.client@example.com',
        phone: '+966500000002',
        isAdmin: false,
      });

      testClientId = client.id;

      expect(client).toBeDefined();
      expect(client.isAdmin).toBe(false);
      expect(client.nameEn).toBe('Test Corporation');
      expect(client.nameAr).toBe('شركة الاختبار');
    });

    it('should create client departments', async () => {
      const departments = [
        {
          clientId: testClientId,
          departmentType: 'finance' as const,
          contactName: 'John Finance',
          contactEmail: 'finance@test.com',
          contactPhone: '+966500000003',
        },
        {
          clientId: testClientId,
          departmentType: 'purchase' as const,
          contactName: 'Sarah Purchase',
          contactEmail: 'purchase@test.com',
          contactPhone: '+966500000004',
        },
        {
          clientId: testClientId,
          departmentType: 'warehouse' as const,
          contactName: 'Mike Warehouse',
          contactEmail: 'warehouse@test.com',
          contactPhone: '+966500000005',
        },
      ];

      for (const dept of departments) {
        const created = await storage.createClientDepartment(dept);
        expect(created).toBeDefined();
        expect(created.departmentType).toBe(dept.departmentType);
      }

      const allDepts = await storage.getClientDepartments(testClientId);
      expect(allDepts.length).toBe(3);
    });

    it('should create client locations', async () => {
      const locations = [
        {
          clientId: testClientId,
          nameEn: 'Main Office',
          nameAr: 'المكتب الرئيسي',
          addressEn: '123 King Road',
          addressAr: 'طريق الملك ١٢٣',
          city: 'Riyadh',
          country: 'Saudi Arabia',
          isHeadquarters: true,
          phone: '+966500000006',
        },
        {
          clientId: testClientId,
          nameEn: 'West Branch',
          nameAr: 'الفرع الغربي',
          addressEn: '456 Prince Street',
          addressAr: 'شارع الأمير ٤٥٦',
          city: 'Jeddah',
          country: 'Saudi Arabia',
          isHeadquarters: false,
          phone: '+966500000007',
        },
      ];

      for (const loc of locations) {
        const created = await storage.createClientLocation(loc);
        expect(created).toBeDefined();
        expect(created.nameEn).toBe(loc.nameEn);
      }

      const allLocs = await storage.getClientLocations(testClientId);
      expect(allLocs.length).toBe(2);
    });
  });

  describe('Product Seeding', () => {
    it('should create multiple products', async () => {
      const productsData = [
        {
          sku: 'TEST-001',
          nameEn: 'Office Chair',
          nameAr: 'كرسي مكتب',
          descriptionEn: 'Ergonomic office chair',
          descriptionAr: 'كرسي مكتب مريح',
          category: 'Furniture',
        },
        {
          sku: 'TEST-002',
          nameEn: 'Standing Desk',
          nameAr: 'مكتب واقف',
          descriptionEn: 'Adjustable standing desk',
          descriptionAr: 'مكتب واقف قابل للتعديل',
          category: 'Furniture',
        },
        {
          sku: 'TEST-003',
          nameEn: 'Wireless Mouse',
          nameAr: 'ماوس لاسلكي',
          descriptionEn: 'Ergonomic wireless mouse',
          descriptionAr: 'ماوس لاسلكي مريح',
          category: 'Technology',
        },
        {
          sku: 'TEST-004',
          nameEn: 'LED Monitor',
          nameAr: 'شاشة LED',
          descriptionEn: '27-inch LED monitor',
          descriptionAr: 'شاشة LED مقاس ٢٧ بوصة',
          category: 'Technology',
        },
      ];

      for (const product of productsData) {
        const created = await storage.createProduct(product);
        testProductIds.push(created.id);
        expect(created).toBeDefined();
        expect(created.sku).toBe(product.sku);
        expect(created.nameEn).toBe(product.nameEn);
      }

      const allProducts = await storage.getProducts();
      expect(allProducts.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('LTA Seeding', () => {
    it('should create LTA', async () => {
      const lta = await storage.createLta({
        nameEn: 'Test LTA 2024',
        nameAr: 'اتفاقية اختبار 2024',
        descriptionEn: 'Test long-term agreement',
        descriptionAr: 'اتفاقية طويلة الأجل للاختبار',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: 'active',
      });

      testLtaId = lta.id;

      expect(lta).toBeDefined();
      expect(lta.status).toBe('active');
      expect(lta.nameEn).toBe('Test LTA 2024');
    });

    it('should assign products to LTA', async () => {
      for (let i = 0; i < testProductIds.length; i++) {
        const assignment = await storage.assignProductToLta({
          ltaId: testLtaId,
          productId: testProductIds[i],
          contractPrice: ((i + 1) * 100).toString(),
          currency: 'SAR',
        });

        expect(assignment).toBeDefined();
        expect(assignment.ltaId).toBe(testLtaId);
        expect(assignment.productId).toBe(testProductIds[i]);
      }

      const ltaProducts = await storage.getLtaProducts(testLtaId);
      expect(ltaProducts.length).toBe(testProductIds.length);
    });

    it('should assign client to LTA', async () => {
      const assignment = await storage.assignClientToLta({
        ltaId: testLtaId,
        clientId: testClientId,
      });

      expect(assignment).toBeDefined();
      expect(assignment.ltaId).toBe(testLtaId);
      expect(assignment.clientId).toBe(testClientId);
    });

    it('should create LTA document', async () => {
      const [document] = await db.insert(ltaDocuments).values({
        ltaId: testLtaId,
        documentType: 'contract',
        fileName: 'test-contract.pdf',
        filePath: '/test/path/contract.pdf',
        fileSize: 1024,
        uploadedBy: testAdminId,
      }).returning();

      expect(document).toBeDefined();
      expect(document.ltaId).toBe(testLtaId);
      expect(document.documentType).toBe('contract');
    });
  });

  describe('Order Seeding', () => {
    it('should create order', async () => {
      const orderData = {
        clientId: testClientId,
        ltaId: testLtaId,
        items: JSON.stringify([
          {
            productId: testProductIds[0],
            quantity: 5,
            unitPrice: '100.00',
            total: '500.00',
          },
          {
            productId: testProductIds[1],
            quantity: 3,
            unitPrice: '200.00',
            total: '600.00',
          },
        ]),
        totalAmount: '1100.00',
        status: 'pending',
        deliveryLocation: 1,
        notes: 'Test order',
      };

      const [order] = await db.insert(orders).values(orderData).returning();
      testOrderId = order.id;

      expect(order).toBeDefined();
      expect(order.clientId).toBe(testClientId);
      expect(order.status).toBe('pending');
    });

    it('should create order items', async () => {
      const itemsData = [
        {
          orderId: testOrderId,
          productId: testProductIds[0],
          quantity: 5,
          unitPrice: '100.00',
          total: '500.00',
        },
        {
          orderId: testOrderId,
          productId: testProductIds[1],
          quantity: 3,
          unitPrice: '200.00',
          total: '600.00',
        },
      ];

      for (const item of itemsData) {
        const [created] = await db.insert(orderItems).values(item).returning();
        expect(created).toBeDefined();
        expect(created.orderId).toBe(testOrderId);
      }
    });
  });

  describe('Feedback Seeding', () => {
    it('should create order feedback', async () => {
      const [feedback] = await db.insert(orderFeedback).values({
        orderId: testOrderId,
        clientId: testClientId,
        rating: 5,
        wouldRecommend: true,
        comments: 'Excellent service and fast delivery!',
      }).returning();

      expect(feedback).toBeDefined();
      expect(feedback.rating).toBe(5);
      expect(feedback.wouldRecommend).toBe(true);
    });

    it('should create issue report', async () => {
      const [issue] = await db.insert(issueReports).values({
        userId: testClientId,
        userType: 'client',
        issueType: 'bug',
        severity: 'medium',
        title: 'Test Bug Report',
        description: 'This is a test bug report for seeding',
        browserInfo: 'Chrome 120',
        screenSize: '1920x1080',
        status: 'open',
      }).returning();

      expect(issue).toBeDefined();
      expect(issue.issueType).toBe('bug');
      expect(issue.status).toBe('open');
    });
  });

  describe('Price Request Seeding', () => {
    it('should create price request', async () => {
      const [priceRequest] = await db.insert(priceRequests).values({
        clientId: testClientId,
        productId: testProductIds[2],
        requestedQuantity: 10,
        message: 'Need bulk pricing for 10 units',
        status: 'pending',
      }).returning();

      expect(priceRequest).toBeDefined();
      expect(priceRequest.status).toBe('pending');
      expect(priceRequest.requestedQuantity).toBe(10);
    });
  });

  describe('Demo Request Seeding', () => {
    it('should create demo request', async () => {
      const [demoRequest] = await db.insert(demoRequests).values({
        companyName: 'Test Demo Company',
        contactName: 'John Demo',
        email: 'demo@test.com',
        phone: '+966500000008',
        industry: 'Technology',
        message: 'Interested in product demo',
        status: 'pending',
      }).returning();

      expect(demoRequest).toBeDefined();
      expect(demoRequest.status).toBe('pending');
      expect(demoRequest.companyName).toBe('Test Demo Company');
    });
  });

  describe('Template Seeding', () => {
    it('should create default templates', async () => {
      const templates = await TemplateStorage.getTemplates();
      
      // Check if templates exist or create them
      if (templates.length === 0) {
        const templateData = {
          name: 'Test Arabic Price Offer',
          description: 'Test template for price offers',
          category: 'price_offer' as const,
          language: 'ar' as const,
          sections: [
            {
              type: 'header' as const,
              content: {
                companyName: '{{companyNameAr}}',
                logo: true,
              },
              order: 0,
            },
          ],
          variables: ['companyNameAr', 'date'],
          styles: {
            primaryColor: '#2563eb',
            secondaryColor: '#64748b',
            accentColor: '#10b981',
            fontSize: 10,
            fontFamily: 'Helvetica',
            headerHeight: 120,
            footerHeight: 70,
            margins: { top: 140, bottom: 90, left: 50, right: 50 },
          },
          isActive: true,
          isDefault: true,
          version: 1,
          tags: ['test'],
        };

        const template = await TemplateStorage.createTemplate(templateData);
        expect(template).toBeDefined();
        expect(template.category).toBe('price_offer');
      }

      const allTemplates = await TemplateStorage.getTemplates();
      expect(allTemplates.length).toBeGreaterThan(0);
    });
  });

  describe('Data Integrity Tests', () => {
    it('should verify client relationships', async () => {
      const client = await storage.getClient(testClientId);
      expect(client).toBeDefined();

      const departments = await storage.getClientDepartments(testClientId);
      expect(departments.length).toBeGreaterThan(0);

      const locations = await storage.getClientLocations(testClientId);
      expect(locations.length).toBeGreaterThan(0);
    });

    it('should verify LTA relationships', async () => {
      const lta = await storage.getLta(testLtaId);
      expect(lta).toBeDefined();

      const products = await storage.getLtaProducts(testLtaId);
      expect(products.length).toBeGreaterThan(0);

      const clientLtas = await storage.getClientLtas(testClientId);
      expect(clientLtas.length).toBeGreaterThan(0);
    });

    it('should verify order data', async () => {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, testOrderId));

      expect(order).toBeDefined();
      expect(order.clientId).toBe(testClientId);
      expect(order.ltaId).toBe(testLtaId);
    });

    it('should verify feedback data', async () => {
      const feedbackRecords = await db
        .select()
        .from(orderFeedback)
        .where(eq(orderFeedback.orderId, testOrderId));

      expect(feedbackRecords.length).toBeGreaterThan(0);
    });

    it('should verify issue reports', async () => {
      const issues = await db
        .select()
        .from(issueReports)
        .where(eq(issueReports.userId, testClientId));

      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('Summary Statistics', () => {
    it('should generate seeding summary', async () => {
      const stats = {
        clients: await db.select().from(clients),
        products: await db.select().from(products),
        ltas: await db.select().from(ltas),
        orders: await db.select().from(orders),
        feedback: await db.select().from(orderFeedback),
        issues: await db.select().from(issueReports),
        priceRequests: await db.select().from(priceRequests),
        demoRequests: await db.select().from(demoRequests),
      };

      console.log('\n📊 Data Seeding Summary:');
      console.log(`✅ Clients: ${stats.clients.length}`);
      console.log(`✅ Products: ${stats.products.length}`);
      console.log(`✅ LTAs: ${stats.ltas.length}`);
      console.log(`✅ Orders: ${stats.orders.length}`);
      console.log(`✅ Feedback: ${stats.feedback.length}`);
      console.log(`✅ Issues: ${stats.issues.length}`);
      console.log(`✅ Price Requests: ${stats.priceRequests.length}`);
      console.log(`✅ Demo Requests: ${stats.demoRequests.length}`);

      expect(stats.clients.length).toBeGreaterThan(0);
      expect(stats.products.length).toBeGreaterThan(0);
      expect(stats.ltas.length).toBeGreaterThan(0);
      expect(stats.orders.length).toBeGreaterThan(0);
    });
  });
});
