import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { storage } from '../storage';
import { db } from '../db';
import { orders, orderTemplates, orderHistory } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { createTestData, cleanupTestData, type TestData } from './test-fixtures';

describe('Orders Integration Tests', () => {
  let testData: TestData;

  beforeAll(async () => {
    testData = await createTestData();
  });

  afterAll(async () => {
    await cleanupTestData(testData);
  });

  describe('Order Creation', () => {
    it('should create an order with valid items and pricing', async () => {
      const orderData = {
        clientId: testData.client.id,
        ltaId: testData.lta.id,
        items: JSON.stringify([
          {
            productId: testData.product.id,
            sku: testData.product.sku,
            nameEn: testData.product.nameEn,
            nameAr: testData.product.nameAr,
            quantity: 10,
            unitPrice: '100.00',
            ltaId: testData.lta.id,
            currency: 'USD',
          }
        ]),
        totalAmount: '1000.00',
        status: 'pending',
      };

      const order = await storage.createOrder(orderData);

      expect(order).toBeDefined();
      expect(order.clientId).toBe(testData.client.id);
      expect(order.totalAmount).toBe('1000.00');
      expect(order.status).toBe('pending');
      expect(JSON.parse(order.items)).toHaveLength(1);

      // Cleanup
      await db.delete(orders).where(eq(orders.id, order.id));
    });

    it('should track order history on creation', async () => {
      const orderData = {
        clientId: testData.client.id,
        ltaId: testData.lta.id,
        items: JSON.stringify([
          {
            productId: testData.product.id,
            sku: testData.product.sku,
            nameEn: testData.product.nameEn,
            nameAr: testData.product.nameAr,
            quantity: 5,
            unitPrice: '50.00',
            ltaId: testData.lta.id,
            currency: 'USD',
          }
        ]),
        totalAmount: '250.00',
        status: 'pending',
      };

      const order = await storage.createOrder(orderData);

      // Order history should be created automatically
      const histories = await db
        .select()
        .from(orderHistory)
        .where(eq(orderHistory.orderId, order.id));

      expect(histories.length).toBeGreaterThan(0);

      // Cleanup
      await db.delete(orderHistory).where(eq(orderHistory.orderId, order.id));
      await db.delete(orders).where(eq(orders.id, order.id));
    });
  });

  describe('Order Status Updates', () => {
    let testOrderId: string;

    beforeAll(async () => {
      const orderData = {
        clientId: testData.client.id,
        ltaId: testData.lta.id,
        items: JSON.stringify([
          {
            productId: testData.product.id,
            sku: testData.product.sku,
            nameEn: testData.product.nameEn,
            nameAr: testData.product.nameAr,
            quantity: 2,
            unitPrice: '75.00',
            ltaId: testData.lta.id,
            currency: 'USD',
          }
        ]),
        totalAmount: '150.00',
        status: 'pending',
      };

      const order = await storage.createOrder(orderData);
      testOrderId = order.id;
    });

    afterAll(async () => {
      await db.delete(orderHistory).where(eq(orderHistory.orderId, testOrderId));
      await db.delete(orders).where(eq(orders.id, testOrderId));
    });

    it('should update order status from pending to processing', async () => {
      const updated = await storage.updateOrderStatus(testOrderId, 'processing');

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('processing');
    });

    it('should update order status from processing to delivered', async () => {
      await storage.updateOrderStatus(testOrderId, 'processing');
      
      const updated = await storage.updateOrderStatus(testOrderId, 'delivered');

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('delivered');
    });

    it('should retrieve orders for a specific client', async () => {
      const clientOrders = await storage.getOrders(testData.client.id);

      expect(Array.isArray(clientOrders)).toBe(true);
      expect(clientOrders.some(o => o.id === testOrderId)).toBe(true);
    });

    it('should retrieve a single order by ID', async () => {
      const order = await storage.getOrder(testOrderId);

      expect(order).toBeDefined();
      expect(order?.id).toBe(testOrderId);
      expect(order?.clientId).toBe(testData.client.id);
    });
  });

  describe('Order Templates', () => {
    let templateId: string;

    afterAll(async () => {
      if (templateId) {
        await db.delete(orderTemplates).where(eq(orderTemplates.id, templateId));
      }
    });

    it('should create an order template', async () => {
      const template = await storage.createOrderTemplate({
        clientId: testData.client.id,
        name: 'Test Template',
        items: JSON.stringify([
          { productId: testData.product.id, quantity: 3 }
        ]),
      });

      expect(template).toBeDefined();
      expect(template.clientId).toBe(testData.client.id);
      expect(template.name).toBe('Test Template');

      templateId = template.id;
    });

    it('should retrieve order templates for a client', async () => {
      const templates = await storage.getOrderTemplates(testData.client.id);

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.some(t => t.id === templateId)).toBe(true);
    });

    it('should retrieve a single order template by ID', async () => {
      const template = await storage.getOrderTemplate(templateId);

      expect(template).toBeDefined();
      expect(template?.id).toBe(templateId);
      expect(template?.clientId).toBe(testData.client.id);
    });

    it('should delete an order template', async () => {
      await storage.deleteOrderTemplate(templateId);

      const template = await storage.getOrderTemplate(templateId);
      expect(template).toBeUndefined();

      templateId = ''; // Prevent cleanup in afterAll
    });
  });
});
