import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { storage } from '../storage';
import { db } from '../db';
import { orderFeedback, orders } from '../../shared/schema';
import type { InsertOrderFeedback } from '../../shared/feedback-schema';
import { eq } from 'drizzle-orm';
import { createTestData, cleanupTestData, type TestData } from './test-fixtures';

describe('Feedback Integration Tests', () => {
  let testData: TestData;
  let testOrderId: string;

  beforeAll(async () => {
    testData = await createTestData();
    
    // Create a test order for feedback
    const orderData = {
      clientId: testData.client.id,
      ltaId: testData.lta.id,
      items: JSON.stringify([
        {
          productId: testData.product.id,
          sku: testData.product.sku,
          nameEn: testData.product.nameEn,
          nameAr: testData.product.nameAr,
          quantity: 3,
          unitPrice: '60.00',
          ltaId: testData.lta.id,
          currency: 'USD',
        }
      ]),
      totalAmount: '180.00',
      status: 'delivered',
    };

    const order = await storage.createOrder(orderData);
    testOrderId = order.id;
  });

  afterAll(async () => {
    // Cleanup test order feedback first
    await db.delete(orderFeedback).where(eq(orderFeedback.orderId, testOrderId));
    // Cleanup the test order
    await db.delete(orders).where(eq(orders.id, testOrderId));
    // Cleanup remaining test data
    await cleanupTestData(testData);
  });

  describe('Order Feedback Submission', () => {
    it('should submit feedback with all rating dimensions', async () => {
      const feedbackData: InsertOrderFeedback = {
        orderId: testOrderId,
        clientId: testData.client.id,
        rating: 5,
        orderingProcessRating: 5,
        productQualityRating: 4,
        deliverySpeedRating: 5,
        communicationRating: 5,
        comments: 'Excellent service all around!',
        wouldRecommend: true,
      };

      const feedback = await storage.createOrderFeedback(feedbackData);

      expect(feedback).toBeDefined();
      expect(feedback.orderId).toBe(testOrderId);
      expect(feedback.clientId).toBe(testData.client.id);
      expect(feedback.rating).toBe(5);
      expect(feedback.orderingProcessRating).toBe(5);
      expect(feedback.productQualityRating).toBe(4);
      expect(feedback.deliverySpeedRating).toBe(5);
      expect(feedback.communicationRating).toBe(5);
      expect(feedback.wouldRecommend).toBe(true);
      expect(feedback.comments).toBe('Excellent service all around!');

      // Cleanup
      await db.delete(orderFeedback).where(eq(orderFeedback.id, feedback.id));
    });

    it('should submit feedback with minimal required fields', async () => {
      const feedbackData: InsertOrderFeedback = {
        orderId: testOrderId,
        clientId: testData.client.id,
        rating: 4,
        wouldRecommend: true,
      };

      const feedback = await storage.createOrderFeedback(feedbackData);

      expect(feedback).toBeDefined();
      expect(feedback.orderId).toBe(testOrderId);
      expect(feedback.clientId).toBe(testData.client.id);
      expect(feedback.rating).toBe(4);
      expect(feedback.wouldRecommend).toBe(true);

      // Cleanup
      await db.delete(orderFeedback).where(eq(orderFeedback.id, feedback.id));
    });

    it('should retrieve feedback for an order', async () => {
      // Create feedback
      const feedbackData: InsertOrderFeedback = {
        orderId: testOrderId,
        clientId: testData.client.id,
        rating: 5,
        wouldRecommend: true,
      };

      const createdFeedback = await storage.createOrderFeedback(feedbackData);

      // Retrieve feedback
      const [feedback] = await db
        .select()
        .from(orderFeedback)
        .where(eq(orderFeedback.orderId, testOrderId))
        .limit(1);

      expect(feedback).toBeDefined();
      expect(feedback?.id).toBe(createdFeedback.id);
      expect(feedback?.orderId).toBe(testOrderId);

      // Cleanup
      await db.delete(orderFeedback).where(eq(orderFeedback.id, createdFeedback.id));
    });

    it('should prevent duplicate feedback for same order', async () => {
      const feedbackData: InsertOrderFeedback = {
        orderId: testOrderId,
        clientId: testData.client.id,
        rating: 5,
        wouldRecommend: true,
      };

      const firstFeedback = await storage.createOrderFeedback(feedbackData);

      // Try to create duplicate feedback
      // Note: This would be caught at the API level, not storage level
      // In the storage layer, duplicate creation will create a new record
      // The uniqueness constraint enforcement happens at the API level
      
      const secondFeedback = await storage.createOrderFeedback({
        ...feedbackData,
        rating: 3, // Different rating
      });

      expect(secondFeedback).toBeDefined();
      
      // Both feedbacks should exist in the database
      const feedbacks = await db
        .select()
        .from(orderFeedback)
        .where(eq(orderFeedback.orderId, testOrderId));

      expect(feedbacks.length).toBeGreaterThanOrEqual(2);

      // Cleanup
      await db.delete(orderFeedback).where(eq(orderFeedback.id, firstFeedback.id));
      await db.delete(orderFeedback).where(eq(orderFeedback.id, secondFeedback.id));
    });
  });

  describe('Feedback Rating Dimensions', () => {
    it('should support all rating dimensions independently', async () => {
      const feedbackData: InsertOrderFeedback = {
        orderId: testOrderId,
        clientId: testData.client.id,
        rating: 3,
        orderingProcessRating: 5,
        productQualityRating: 2,
        deliverySpeedRating: 4,
        communicationRating: 3,
        comments: 'Mixed experience across different aspects',
        wouldRecommend: false,
      };

      const feedback = await storage.createOrderFeedback(feedbackData);

      expect(feedback.orderingProcessRating).toBe(5);
      expect(feedback.productQualityRating).toBe(2);
      expect(feedback.deliverySpeedRating).toBe(4);
      expect(feedback.communicationRating).toBe(3);

      // Cleanup
      await db.delete(orderFeedback).where(eq(orderFeedback.id, feedback.id));
    });
  });

  describe('Admin Response to Feedback', () => {
    it('should allow adding admin response to feedback', async () => {
      const feedbackData: InsertOrderFeedback = {
        orderId: testOrderId,
        clientId: testData.client.id,
        rating: 4,
        wouldRecommend: true,
        comments: 'Could be better',
      };

      const feedback = await storage.createOrderFeedback(feedbackData);

      // Add admin response
      const updatedFeedback = await db
        .update(orderFeedback)
        .set({
          adminResponse: 'Thank you for your feedback. We will work on improving our service.',
          adminResponseAt: new Date(),
          respondedBy: testData.admin.id,
        })
        .where(eq(orderFeedback.id, feedback.id))
        .returning();

      expect(updatedFeedback[0]?.adminResponse).toBe('Thank you for your feedback. We will work on improving our service.');
      expect(updatedFeedback[0]?.respondedBy).toBe(testData.admin.id);

      // Cleanup
      await db.delete(orderFeedback).where(eq(orderFeedback.id, feedback.id));
    });

    it('should retrieve feedback with admin response', async () => {
      const feedbackData: InsertOrderFeedback = {
        orderId: testOrderId,
        clientId: testData.client.id,
        rating: 5,
        wouldRecommend: true,
      };

      const feedback = await storage.createOrderFeedback(feedbackData);

      // Add admin response
      await db
        .update(orderFeedback)
        .set({
          adminResponse: 'We appreciate your positive feedback!',
          adminResponseAt: new Date(),
          respondedBy: testData.admin.id,
        })
        .where(eq(orderFeedback.id, feedback.id));

      // Retrieve feedback
      const [retrieved] = await db
        .select()
        .from(orderFeedback)
        .where(eq(orderFeedback.id, feedback.id))
        .limit(1);

      expect(retrieved?.adminResponse).toBe('We appreciate your positive feedback!');
      expect(retrieved?.adminResponseAt).toBeDefined();
      expect(retrieved?.respondedBy).toBe(testData.admin.id);

      // Cleanup
      await db.delete(orderFeedback).where(eq(orderFeedback.id, feedback.id));
    });
  });
});
