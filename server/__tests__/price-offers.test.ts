import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { storage } from '../storage';
import { db } from '../db';
import { priceOffers, ltas, ltaProducts } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { createTestData, cleanupTestData, type TestData } from './test-fixtures';

describe('Price Offers Integration Tests', () => {
  let testData: TestData;

  beforeAll(async () => {
    testData = await createTestData();
  });

  afterAll(async () => {
    await cleanupTestData(testData);
  });

  describe('Price Offer CRUD Operations', () => {
    it('should create a price offer', async () => {
      const offerData = {
        offerNumber: `TEST-${Date.now()}`,
        clientId: testData.client.id,
        ltaId: testData.lta.id,
        requestId: null,
        items: JSON.stringify([
          {
            productId: testData.product.id,
            sku: testData.product.sku,
            nameEn: testData.product.nameEn,
            nameAr: testData.product.nameAr,
            quantity: 20,
            unitPrice: '90.00',
          }
        ]),
        subtotal: '1800.00',
        tax: '0.00',
        total: '1800.00',
        notes: 'Test price offer',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'pending',
      };

      const offer = await storage.createPriceOffer(offerData);

      expect(offer).toBeDefined();
      expect(offer.clientId).toBe(testData.client.id);
      expect(offer.ltaId).toBe(testData.lta.id);
      expect(offer.status).toBe('pending');
      expect(offer.total).toBe('1800.00');

      // Cleanup
      await db.delete(priceOffers).where(eq(priceOffers.id, offer.id));
    });

    it('should retrieve all price offers for a client', async () => {
      const clientOffers = await storage.getPriceOffersByClient(testData.client.id);

      expect(Array.isArray(clientOffers)).toBe(true);
      expect(clientOffers.some(o => o.id === testData.priceOffer.id)).toBe(true);
    });

    it('should retrieve a single price offer by ID', async () => {
      const offer = await storage.getPriceOffer(testData.priceOffer.id);

      expect(offer).toBeDefined();
      expect(offer?.id).toBe(testData.priceOffer.id);
      expect(offer?.clientId).toBe(testData.client.id);
    });

    it('should retrieve all price offers', async () => {
      const allOffers = await storage.getAllPriceOffers();

      expect(Array.isArray(allOffers)).toBe(true);
      expect(allOffers.some(o => o.id === testData.priceOffer.id)).toBe(true);
    });

    it('should update price offer status', async () => {
      const updated = await storage.updatePriceOfferStatus(
        testData.priceOffer.id,
        'sent'
      );

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('sent');
    });

    it('should delete a price offer', async () => {
      // Create a new offer for deletion
      const offerData = {
        offerNumber: `DELETE-${Date.now()}`,
        clientId: testData.client.id,
        ltaId: testData.lta.id,
        requestId: null,
        items: JSON.stringify([
          {
            productId: testData.product.id,
            sku: testData.product.sku,
            nameEn: testData.product.nameEn,
            nameAr: testData.product.nameAr,
            quantity: 1,
            unitPrice: '10.00',
          }
        ]),
        subtotal: '10.00',
        tax: '0.00',
        total: '10.00',
        notes: 'To be deleted',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'pending',
      };

      const offer = await storage.createPriceOffer(offerData);
      await storage.deletePriceOffer(offer.id);

      const deleted = await storage.getPriceOffer(offer.id);
      expect(deleted).toBeNull();
    });
  });

  describe('Price Offer Acceptance Flow', () => {
    let draftLtaId: string;
    let offerId: string;

    beforeAll(async () => {
      // Create a draft LTA for testing acceptance
      const draftLtaData = {
        nameEn: 'Draft Test LTA',
        nameAr: 'اتفاقية تجريبية مسودة',
        descriptionEn: 'Draft LTA for testing',
        descriptionAr: 'اتفاقية مسودة للاختبار',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'draft',
      };

      const [draftLta] = await db.insert(ltas).values(draftLtaData).returning();
      draftLtaId = draftLta.id;

      // Create a price offer linked to the draft LTA
      const offerData = {
        offerNumber: `ACCEPTANCE-${Date.now()}`,
        clientId: testData.client.id,
        ltaId: draftLtaId,
        requestId: null,
        items: JSON.stringify([
          {
            productId: testData.product.id,
            sku: testData.product.sku,
            nameEn: testData.product.nameEn,
            nameAr: testData.product.nameAr,
            quantity: 15,
            unitPrice: '85.00',
          }
        ]),
        subtotal: '1275.00',
        tax: '0.00',
        total: '1275.00',
        notes: 'Test acceptance offer',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'sent',
      };

      const offer = await storage.createPriceOffer(offerData);
      offerId = offer.id;
    });

    afterAll(async () => {
      // Cleanup
      await db.delete(priceOffers).where(eq(priceOffers.id, offerId));
      await db.delete(ltaProducts).where(eq(ltaProducts.ltaId, draftLtaId));
      await db.delete(ltas).where(eq(ltas.id, draftLtaId));
    });

    it('should accept a price offer and activate LTA', async () => {
      // Simulate acceptance by updating offer status
      const offer = await storage.getPriceOffer(offerId);
      
      if (!offer || !offer.ltaId) {
        throw new Error('Offer or LTA ID is missing');
      }

      // Update LTA status to active (simulating acceptance)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      await storage.updateLta(offer.ltaId, {
        status: 'active',
        startDate,
        endDate,
      });

      // Verify LTA is now active
      const lta = await storage.getLta(offer.ltaId);
      expect(lta?.status).toBe('active');
    });

    it('should assign products to LTA upon acceptance', async () => {
      const offer = await storage.getPriceOffer(offerId);
      
      if (!offer || !offer.ltaId) {
        throw new Error('Offer or LTA ID is missing');
      }

      const items = JSON.parse(offer.items);
      
      // Assign first product to LTA
      if (items.length > 0) {
        const item = items[0];
        await storage.assignProductToLta(offer.ltaId, {
          productId: item.productId,
          contractPrice: item.unitPrice,
          currency: 'USD',
        });

        // Verify product is assigned
        const ltaProducts = await db
          .select()
          .from(ltaProducts)
          .where(eq(ltaProducts.ltaId, offer.ltaId));

        expect(ltaProducts.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Price Offer Expiration', () => {
    it('should validate offer expiration date', async () => {
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      
      const offerData = {
        offerNumber: `EXPIRED-${Date.now()}`,
        clientId: testData.client.id,
        ltaId: testData.lta.id,
        requestId: null,
        items: JSON.stringify([
          {
            productId: testData.product.id,
            sku: testData.product.sku,
            nameEn: testData.product.nameEn,
            nameAr: testData.product.nameAr,
            quantity: 1,
            unitPrice: '1.00',
          }
        ]),
        subtotal: '1.00',
        tax: '0.00',
        total: '1.00',
        notes: 'Expired offer',
        validUntil: expiredDate,
        status: 'sent',
      };

      const offer = await storage.createPriceOffer(offerData);

      // Check if offer is expired
      const isExpired = new Date(offer.validUntil) < new Date();
      expect(isExpired).toBe(true);

      // Cleanup
      await db.delete(priceOffers).where(eq(priceOffers.id, offer.id));
    });
  });
});
