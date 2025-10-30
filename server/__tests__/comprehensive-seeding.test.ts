
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
  ltaDocuments,
  templates
} from '../../shared/schema';
import { storage } from '../storage';
import { hashPassword } from '../auth';
import { TemplateStorage } from '../template-storage';
import { eq } from 'drizzle-orm';

describe('Comprehensive Seeding and Data Integrity Tests', () => {
  const testData = {
    clientIds: [] as number[],
    productIds: [] as number[],
    ltaIds: [] as number[],
    orderIds: [] as number[],
    templateIds: [] as number[]
  };

  beforeAll(async () => {
    console.log('🧹 Cleaning up existing test data...');
    await cleanupTestData();
  });

  afterAll(async () => {
    console.log('🧹 Final cleanup...');
    await cleanupTestData();
  });

  async function cleanupTestData() {
    try {
      await db.delete(orderFeedback).execute();
      await db.delete(issueReports).execute();
      await db.delete(priceRequests).execute();
      await db.delete(demoRequests).execute();
      await db.delete(orderItems).execute();
      await db.delete(orders).execute();
      await db.delete(clientDepartments).execute();
      await db.delete(clientLocations).execute();
      await db.delete(ltaClients).execute();
      await db.delete(ltaProducts).execute();
      await db.delete(ltaDocuments).execute();
      await db.delete(ltas).execute();
      await db.delete(products).execute();
      await db.delete(clients).where(eq(clients.username, 'test_stress_admin')).execute();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  describe('Phase 1: User Seeding (10 clients)', () => {
    it('should create admin user', async () => {
      const admin = await storage.createClient({
        username: 'test_stress_admin',
        password: await hashPassword('admin123'),
        nameEn: 'Stress Test Administrator',
        nameAr: 'مسؤول اختبار الضغط',
        email: 'stress.admin@test.com',
        phone: '+966500000001',
        isAdmin: true,
      });

      testData.clientIds.push(admin.id);
      expect(admin.isAdmin).toBe(true);
      console.log(`✅ Admin created: ID ${admin.id}`);
    });

    it('should create 10 test client companies', async () => {
      const companies = [
        { nameEn: 'Alpha Corporation', nameAr: 'شركة ألفا' },
        { nameEn: 'Beta Industries', nameAr: 'صناعات بيتا' },
        { nameEn: 'Gamma Enterprises', nameAr: 'مؤسسات جاما' },
        { nameEn: 'Delta Solutions', nameAr: 'حلول دلتا' },
        { nameEn: 'Epsilon Trading', nameAr: 'تجارة إبسيلون' },
        { nameEn: 'Zeta Holdings', nameAr: 'ممتلكات زيتا' },
        { nameEn: 'Eta Manufacturing', nameAr: 'تصنيع إيتا' },
        { nameEn: 'Theta Logistics', nameAr: 'لوجستيات ثيتا' },
        { nameEn: 'Iota Retail', nameAr: 'تجزئة أيوتا' },
        { nameEn: 'Kappa Services', nameAr: 'خدمات كابا' }
      ];

      for (let i = 0; i < companies.length; i++) {
        const client = await storage.createClient({
          username: `test_client_${i}_${Date.now()}`,
          password: await hashPassword('client123'),
          nameEn: companies[i].nameEn,
          nameAr: companies[i].nameAr,
          email: `client${i}@test.com`,
          phone: `+96650000000${i + 2}`,
          isAdmin: false,
        });

        testData.clientIds.push(client.id);
        console.log(`✅ Client ${i + 1}/10 created: ${companies[i].nameEn}`);
      }

      expect(testData.clientIds.length).toBe(11); // 10 clients + 1 admin
    });

    it('should create departments for each client (3 per client = 30 total)', async () => {
      let totalDepts = 0;
      const deptTypes = ['finance', 'purchase', 'warehouse'] as const;

      for (const clientId of testData.clientIds.slice(1)) { // Skip admin
        for (const deptType of deptTypes) {
          await storage.createClientDepartment({
            clientId,
            departmentType: deptType,
            contactName: `${deptType} Manager`,
            contactEmail: `${deptType}.${clientId}@test.com`,
            contactPhone: `+966${clientId}${Math.floor(Math.random() * 1000000)}`,
          });
          totalDepts++;
        }
      }

      console.log(`✅ Created ${totalDepts} departments`);
      expect(totalDepts).toBe(30);
    });

    it('should create locations for each client (2 per client = 20 total)', async () => {
      let totalLocs = 0;
      const cities = ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina'];

      for (const clientId of testData.clientIds.slice(1)) {
        for (let i = 0; i < 2; i++) {
          await storage.createClientLocation({
            clientId,
            nameEn: i === 0 ? 'Headquarters' : 'Branch Office',
            nameAr: i === 0 ? 'المقر الرئيسي' : 'المكتب الفرعي',
            addressEn: `${Math.floor(Math.random() * 999)} Street`,
            addressAr: `شارع ${Math.floor(Math.random() * 999)}`,
            city: cities[Math.floor(Math.random() * cities.length)],
            country: 'Saudi Arabia',
            isHeadquarters: i === 0,
            phone: `+966${clientId}${Math.floor(Math.random() * 1000000)}`,
          });
          totalLocs++;
        }
      }

      console.log(`✅ Created ${totalLocs} locations`);
      expect(totalLocs).toBe(20);
    });
  });

  describe('Phase 2: Product Seeding (50 products)', () => {
    it('should create 50 diverse products', async () => {
      const categories = ['Furniture', 'Technology', 'Office Supplies', 'Equipment', 'Accessories'];
      
      for (let i = 1; i <= 50; i++) {
        const product = await storage.createProduct({
          sku: `STRESS-${i.toString().padStart(3, '0')}`,
          nameEn: `Product ${i}`,
          nameAr: `منتج ${i}`,
          descriptionEn: `Test product description ${i}`,
          descriptionAr: `وصف المنتج ${i}`,
          category: categories[Math.floor(Math.random() * categories.length)],
        });

        testData.productIds.push(product.id);
        
        if (i % 10 === 0) {
          console.log(`✅ Products created: ${i}/50`);
        }
      }

      expect(testData.productIds.length).toBe(50);
    });
  });

  describe('Phase 3: LTA Seeding (5 LTAs)', () => {
    it('should create 5 LTAs with different statuses', async () => {
      const ltaConfigs = [
        { status: 'active', months: 12 },
        { status: 'active', months: 6 },
        { status: 'pending', months: 12 },
        { status: 'inactive', months: 12 },
        { status: 'expired', months: 12 }
      ];

      for (let i = 0; i < ltaConfigs.length; i++) {
        const config = ltaConfigs[i];
        const lta = await storage.createLta({
          nameEn: `Stress Test LTA ${i + 1}`,
          nameAr: `اتفاقية اختبار الضغط ${i + 1}`,
          descriptionEn: `Test LTA with ${config.status} status`,
          descriptionAr: `اتفاقية اختبار بحالة ${config.status}`,
          startDate: new Date('2024-01-01'),
          endDate: new Date(2024, config.months, 1),
          status: config.status as any,
        });

        testData.ltaIds.push(lta.id);
        console.log(`✅ LTA ${i + 1}/5 created: ${config.status}`);
      }

      expect(testData.ltaIds.length).toBe(5);
    });

    it('should assign products to LTAs (200 assignments)', async () => {
      let totalAssignments = 0;

      for (const ltaId of testData.ltaIds) {
        // Assign 40 random products to each LTA
        const randomProducts = testData.productIds
          .sort(() => Math.random() - 0.5)
          .slice(0, 40);

        for (const productId of randomProducts) {
          await storage.assignProductToLta({
            ltaId,
            productId,
            contractPrice: (Math.random() * 1000 + 50).toFixed(2),
            currency: 'SAR',
          });
          totalAssignments++;
        }
      }

      console.log(`✅ Created ${totalAssignments} LTA-Product assignments`);
      expect(totalAssignments).toBe(200);
    });

    it('should assign clients to LTAs (50 assignments)', async () => {
      let totalAssignments = 0;

      for (const ltaId of testData.ltaIds) {
        for (const clientId of testData.clientIds.slice(1)) { // Skip admin
          await storage.assignClientToLta({
            ltaId,
            clientId,
          });
          totalAssignments++;
        }
      }

      console.log(`✅ Created ${totalAssignments} LTA-Client assignments`);
      expect(totalAssignments).toBe(50);
    });
  });

  describe('Phase 4: Order Seeding (100 orders)', () => {
    it('should create 100 orders with items', async () => {
      const statuses = ['pending', 'approved', 'processing', 'shipped', 'delivered', 'cancelled'];
      
      for (let i = 0; i < 100; i++) {
        const clientId = testData.clientIds[1 + (i % 10)]; // Distribute across clients
        const ltaId = testData.ltaIds[i % testData.ltaIds.length];
        
        // Create order items
        const itemCount = Math.floor(Math.random() * 5) + 1;
        const items = [];
        let totalAmount = 0;

        for (let j = 0; j < itemCount; j++) {
          const productId = testData.productIds[Math.floor(Math.random() * testData.productIds.length)];
          const quantity = Math.floor(Math.random() * 10) + 1;
          const unitPrice = (Math.random() * 500 + 50).toFixed(2);
          const total = (parseFloat(unitPrice) * quantity).toFixed(2);
          
          items.push({ productId, quantity, unitPrice, total });
          totalAmount += parseFloat(total);
        }

        const [order] = await db.insert(orders).values({
          clientId,
          ltaId,
          items: JSON.stringify(items),
          totalAmount: totalAmount.toFixed(2),
          status: statuses[Math.floor(Math.random() * statuses.length)] as any,
          deliveryLocation: 1,
          notes: `Stress test order ${i + 1}`,
        }).returning();

        testData.orderIds.push(order.id);

        // Create order items
        for (const item of items) {
          await db.insert(orderItems).values({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          });
        }

        if ((i + 1) % 20 === 0) {
          console.log(`✅ Orders created: ${i + 1}/100`);
        }
      }

      expect(testData.orderIds.length).toBe(100);
    });
  });

  describe('Phase 5: Feedback & Support Seeding', () => {
    it('should create order feedback (50 entries)', async () => {
      for (let i = 0; i < 50; i++) {
        const orderId = testData.orderIds[i];
        const clientId = testData.clientIds[1 + (i % 10)];

        await db.insert(orderFeedback).values({
          orderId,
          clientId,
          rating: Math.floor(Math.random() * 5) + 1,
          wouldRecommend: Math.random() > 0.3,
          comments: `Test feedback ${i + 1}`,
        });
      }

      const feedbackCount = await db.select().from(orderFeedback);
      console.log(`✅ Created ${feedbackCount.length} feedback entries`);
      expect(feedbackCount.length).toBeGreaterThanOrEqual(50);
    });

    it('should create issue reports (30 entries)', async () => {
      const issueTypes = ['bug', 'feature_request', 'question', 'complaint'];
      const severities = ['low', 'medium', 'high', 'critical'];

      for (let i = 0; i < 30; i++) {
        await db.insert(issueReports).values({
          userId: testData.clientIds[1 + (i % 10)],
          userType: 'client',
          issueType: issueTypes[Math.floor(Math.random() * issueTypes.length)] as any,
          severity: severities[Math.floor(Math.random() * severities.length)] as any,
          title: `Test Issue ${i + 1}`,
          description: `Issue description ${i + 1}`,
          browserInfo: 'Chrome 120',
          screenSize: '1920x1080',
          status: 'open',
        });
      }

      const issueCount = await db.select().from(issueReports);
      console.log(`✅ Created ${issueCount.length} issue reports`);
      expect(issueCount.length).toBeGreaterThanOrEqual(30);
    });

    it('should create price requests (20 entries)', async () => {
      for (let i = 0; i < 20; i++) {
        await db.insert(priceRequests).values({
          clientId: testData.clientIds[1 + (i % 10)],
          productId: testData.productIds[i],
          requestedQuantity: Math.floor(Math.random() * 100) + 10,
          message: `Price request ${i + 1}`,
          status: i < 10 ? 'pending' : 'responded',
        });
      }

      const priceRequestCount = await db.select().from(priceRequests);
      console.log(`✅ Created ${priceRequestCount.length} price requests`);
      expect(priceRequestCount.length).toBeGreaterThanOrEqual(20);
    });

    it('should create demo requests (15 entries)', async () => {
      for (let i = 0; i < 15; i++) {
        await db.insert(demoRequests).values({
          companyName: `Demo Company ${i + 1}`,
          contactName: `Contact ${i + 1}`,
          email: `demo${i + 1}@test.com`,
          phone: `+966${500000000 + i}`,
          industry: 'Technology',
          message: `Demo request ${i + 1}`,
          status: i < 8 ? 'pending' : 'contacted',
        });
      }

      const demoRequestCount = await db.select().from(demoRequests);
      console.log(`✅ Created ${demoRequestCount.length} demo requests`);
      expect(demoRequestCount.length).toBeGreaterThanOrEqual(15);
    });
  });

  describe('Phase 6: Final Statistics & Validation', () => {
    it('should generate comprehensive statistics', async () => {
      const stats = {
        clients: await db.select().from(clients),
        products: await db.select().from(products),
        ltas: await db.select().from(ltas),
        ltaProducts: await db.select().from(ltaProducts),
        ltaClients: await db.select().from(ltaClients),
        orders: await db.select().from(orders),
        orderItems: await db.select().from(orderItems),
        departments: await db.select().from(clientDepartments),
        locations: await db.select().from(clientLocations),
        feedback: await db.select().from(orderFeedback),
        issues: await db.select().from(issueReports),
        priceRequests: await db.select().from(priceRequests),
        demoRequests: await db.select().from(demoRequests),
      };

      console.log('\n📊 ═══════════════════════════════════════════════════════');
      console.log('    COMPREHENSIVE SEEDING STATISTICS');
      console.log('═══════════════════════════════════════════════════════\n');
      console.log(`👥 Clients:              ${stats.clients.length}`);
      console.log(`📦 Products:             ${stats.products.length}`);
      console.log(`📋 LTAs:                 ${stats.ltas.length}`);
      console.log(`🔗 LTA-Product Links:    ${stats.ltaProducts.length}`);
      console.log(`🔗 LTA-Client Links:     ${stats.ltaClients.length}`);
      console.log(`🛒 Orders:               ${stats.orders.length}`);
      console.log(`📝 Order Items:          ${stats.orderItems.length}`);
      console.log(`🏢 Departments:          ${stats.departments.length}`);
      console.log(`📍 Locations:            ${stats.locations.length}`);
      console.log(`⭐ Feedback:             ${stats.feedback.length}`);
      console.log(`🐛 Issue Reports:        ${stats.issues.length}`);
      console.log(`💰 Price Requests:       ${stats.priceRequests.length}`);
      console.log(`🎯 Demo Requests:        ${stats.demoRequests.length}`);
      console.log('\n═══════════════════════════════════════════════════════\n');

      expect(stats.clients.length).toBeGreaterThanOrEqual(11);
      expect(stats.products.length).toBeGreaterThanOrEqual(50);
      expect(stats.orders.length).toBeGreaterThanOrEqual(100);
    });
  });
});
