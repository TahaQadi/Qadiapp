import { renderToString } from 'react-dom/server';

import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { errorLogger } from "./error-logger";
import { setupAuth, isAuthenticated, requireAuth, requireAdmin } from "./auth";
import onboardingRoutes from "./onboarding-routes";
import passwordResetRoutes from "./password-reset-routes";
import orderModificationRoutes from './order-modification-routes';
import pushRoutes from './push-routes';
import analyticsRoutes from './analytics-routes';
import demoRequestRoutes from './demo-request-routes';
import feedbackRoutes from './feedback-routes';
import feedbackAnalyticsRoutes from './feedback-analytics-routes';
import { setupDocumentRoutes } from './document-routes';
import { setupTemplateManagementRoutes } from './template-management-routes';
import { setupInvoiceContractRoutes } from './invoice-contract-routes';
import { documentTriggerService } from './document-triggers';
import { ApiHandler, AuthenticatedHandler, AdminHandler, AuthenticatedRequest, AdminRequest } from "./types";
import multer from "multer";
import { PDFGenerator } from "./pdf-generator";
import { PDFStorage } from "./object-storage";
import { TemplateStorage } from "./template-storage";
import { TemplatePDFGenerator } from "./template-pdf-generator";
import { PDFAccessControl } from "./pdf-access-control";
import { DocumentUtils } from "./document-utils";
import {
  loginSchema,
  priceImportRowSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  createLocationSchema,
  updateLocationSchema,
  createOrderSchema,
  cartItemSchema,
  saveTemplateSchema,
  createProductSchema,
  updateProductSchema,
  createVendorSchema,
  updateVendorSchema,
  createClientSchema,
  updateClientSchema,
  updateOwnProfileSchema,
  createCompanyUserSchema,
  updateCompanyUserSchema,
  insertLtaSchema,
  insertLtaProductSchema,
  insertLtaClientSchema,
  bulkAssignProductsSchema,
  type CartItem,
} from "@shared/schema";
import { createTemplateSchema, updateTemplateSchema } from "@shared/template-schema";
import { z } from "zod";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import express from 'express'; // Import express to use its middleware like express.json()

import { generateSitemap } from "./sitemap";

// --- Database imports for specific operations within the routes ---
import { db, schema, orders, notifications, orderFeedback } from './db';
import { eq } from 'drizzle-orm';
import webpush from 'web-push'; // Assuming web-push is installed and configured for push notifications

// Placeholder for web-push configuration (replace with your actual VAPID keys)
// webpush.setVapidDetails(
//   'mailto:your-email@example.com',
//   process.env.VAPID_PUBLIC_KEY!,
//   process.env.VAPID_PRIVATE_KEY!
// );
// -----------------------------------------------------------------


const uploadMemory = multer({ storage: multer.memoryStorage() });

const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'attached_assets/products/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomUUID();
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadImage = multer({
  storage: uploadStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Document upload configuration
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'attached_assets/documents/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomUUID();
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for documents
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|xls|xlsx|txt|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (extname) {
      cb(null, true);
    } else {
      cb(new Error('Only document files are allowed (PDF, DOC, DOCX, XLS, XLSX, TXT, ZIP)'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Onboarding routes (public)
  app.use('/api', onboardingRoutes);

  // Password reset routes (mixed access)
  app.use('/api', passwordResetRoutes);

  // Order modification routes
  app.use('/api', orderModificationRoutes);

  // Push notification routes
  app.use('/api/push', pushRoutes);

  // Analytics and error monitoring routes
  app.use("/api", analyticsRoutes);

  // Demo request routes (public POST, admin GET/PATCH)
  app.use(demoRequestRoutes);

  // Document routes
  setupDocumentRoutes(app);
  setupTemplateManagementRoutes(app);
  setupInvoiceContractRoutes(app); // NEW: Invoice & Contract generation

  // Test document triggers endpoint (for development)
  app.post('/api/test/document-triggers', async (req: any, res) => {
    try {
      const { eventType, data } = req.body;

      if (!eventType || !data) {
        return res.status(400).json({ message: 'eventType and data are required' });
      }

      await documentTriggerService.queueEvent({
        type: eventType,
        data,
        clientId: data.clientId || 'test-client',
        timestamp: new Date()
      });

      res.json({
        success: true,
        message: 'Event queued successfully',
        queueStatus: documentTriggerService.getQueueStatus()
      });
    } catch (error) {
      // Log error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Test document trigger error:', error);
      }
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Feedback routes
  app.use('/api', feedbackRoutes);
  app.use('/api', feedbackAnalyticsRoutes);

  // Auth endpoint - returns authenticated user data
  app.get('/api/auth/user', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // req.user is already populated by Passport Local Strategy
      res.json(req.user);
    } catch (error) {
      // Log error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching user:", error);
      }
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Client Profile Routes
  app.get("/api/client/profile", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const client = req.client;
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      const departments = await storage.getClientDepartments(client.id);
      const locations = await storage.getClientLocations(client.id);

      res.json({
        client: {
          id: client.id,
          nameEn: client.nameEn,
          nameAr: client.nameAr,
          username: client.username,
          email: client.email,
          phone: client.phone,
        },
        departments,
        locations,
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Department Routes
  app.post("/api/client/departments", requireAuth, async (req: any, res) => {
    try {
      const validatedData = createDepartmentSchema.parse(req.body);
      const department = await storage.createClientDepartment({
        clientId: req.client.id,
        ...validatedData,
      });
      res.status(201).json(department);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put("/api/client/departments/:id", requireAuth, async (req: any, res) => {
    try {
      const validatedData = updateDepartmentSchema.parse(req.body);
      const department = await storage.updateClientDepartment(req.params.id, validatedData);
      if (!department) {
        return res.status(404).json({
          message: "Department not found",
          messageAr: "القسم غير موجود",
        });
      }
      res.json(department);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete("/api/client/departments/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteClientDepartment(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Location Routes
  app.post("/api/client/locations", requireAuth, async (req: any, res) => {
    try {
      const validatedData = createLocationSchema.parse(req.body);
      const location = await storage.createClientLocation({
        clientId: req.client.id,
        ...validatedData,
      });
      res.status(201).json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put("/api/client/locations/:id", requireAuth, async (req: any, res) => {
    try {
      const validatedData = updateLocationSchema.parse(req.body);
      const location = await storage.updateClientLocation(req.params.id, validatedData);
      if (!location) {
        return res.status(404).json({
          message: "Location not found",
          messageAr: "الموقع غير موجود",
        });
      }
      res.json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete("/api/client/locations/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteClientLocation(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Products Routes - Get all products with client's LTA prices (if any)
  app.get("/api/products", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const products = await storage.getAllProductsWithClientPrices(req.client.id);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error instanceof Error ? error.message : 'Unknown error' : 'Unknown error' });
    }
  });

  // ============================================
  // PRICE MANAGEMENT - Client Routes
  // ============================================

  // Client: Create price request
  app.post("/api/price-requests", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      let { ltaId, products, notes } = req.body;

      if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({
          message: "Products are required",
          messageAr: "المنتجات مطلوبة"
        });
      }

      // Bootstrap flow: If no ltaId provided, check if client has any active LTAs
      if (!ltaId) {
        const clientLtas = await storage.getClientLtas(req.client.id);
        const activeLtas = clientLtas.filter(lta => lta.status === 'active');

        if (activeLtas.length === 0) {
          // Auto-create draft LTA for this client
          const client = await storage.getClient(req.client.id);
          const ltaCount = (await storage.getLtas()).length + 1;
          const ltaName = `Draft Contract - ${client?.nameEn || 'Client'} - ${new Date().toISOString().split('T')[0]}`;

          const newLta = await storage.createLta({
            nameEn: ltaName,
            nameAr: `عقد مسودة - ${client?.nameAr || 'عميل'} - ${new Date().toISOString().split('T')[0]}`,
            descriptionEn: 'Auto-generated draft contract from price request',
            descriptionAr: 'عقد مسودة تم إنشاؤه تلقائياً من طلب السعر',
            status: 'draft'
          });

          // Assign draft LTA to client
          await storage.assignLtaToClient(newLta.id, req.client.id);

          ltaId = newLta.id;
        } else {
          return res.status(400).json({
            message: "Please select an LTA",
            messageAr: "يرجى اختيار اتفاقية"
          });
        }
      } else {
        // Verify client has access to this LTA
        const clientLtas = await storage.getClientLtas(req.client.id);
        const hasAccess = clientLtas.some(lta => lta.id === ltaId);

        if (!hasAccess) {
          return res.status(403).json({
            message: "You don't have access to this LTA",
            messageAr: "ليس لديك صلاحية الوصول لهذه الاتفاقية"
          });
        }
      }

      // Generate request number
      const count = (await storage.getAllPriceRequests()).length + 1;
      const requestNumber = `PR-${Date.now()}-${count.toString().padStart(4, '0')}`;

      // Create price request
      const priceRequest = await storage.createPriceRequest({
        requestNumber,
        clientId: req.client.id,
        ltaId,
        products,
        notes: notes || null,
        status: 'pending'
      });

      // Notify admins
      const client = await storage.getClient(req.client.id);
      const admins = await storage.getAdminClients();

      for (const admin of admins) {
        await storage.createNotification({
          clientId: admin.id,
          type: 'system',
          titleEn: 'New Price Request',
          titleAr: 'طلب سعر جديد',
          messageEn: `${client?.nameEn} requested pricing for ${products.length} product(s)`,
          messageAr: `طلب ${client?.nameAr} تسعير لـ ${products.length} منتج`,
          metadata: JSON.stringify({ requestId: priceRequest.id })
        });
      }

      // Notify client
      await storage.createNotification({
        clientId: req.client.id,
        type: 'system',
        titleEn: 'Price Request Submitted',
        titleAr: 'تم إرسال طلب السعر',
        messageEn: `Your request #${requestNumber} has been submitted`,
        messageAr: `تم إرسال طلبك رقم ${requestNumber}`,
        metadata: JSON.stringify({ requestId: priceRequest.id })
      });

      res.json({
        message: "Price request submitted successfully",
        messageAr: "تم إرسال طلب السعر بنجاح"
      });
    } catch (error) {
      // Log error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Price request error:', error);
      }
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء إرسال طلب السعر"
      });
    }
  });

  // Client: Get my price requests
  app.get("/api/price-requests", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const requests = await storage.getPriceRequestsByClient(req.client.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Client: Get price offers sent to me
  app.get("/api/price-offers", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const offers = await storage.getPriceOffersByClient(req.client.id);
      console.log(`[Price Offers] Client ${req.client.id} has ${offers.length} offers`);
      res.json(offers);
    } catch (error) {
      // Log error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('[Price Offers] Error fetching offers:', error);
      }
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Client: View price offer (marks as viewed)
  app.get("/api/price-offers/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const offer = await storage.getPriceOffer(req.params.id);

      if (!offer) {
        return res.status(404).json({ message: "Offer not found", messageAr: "العرض غير موجود" });
      }

      if (offer.clientId !== req.client.id) {
        return res.status(403).json({ message: "Unauthorized", messageAr: "غير مصرح" });
      }

      // Mark as viewed if not already
      if (!offer.viewedAt && offer.status === 'sent') {
        await storage.updatePriceOffer(req.params.id, {
          viewedAt: new Date(),
          status: 'viewed'
        });
      }

      const updatedOffer = await storage.getPriceOffer(req.params.id);
      res.json(updatedOffer);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Client: Accept/Reject price offer
  app.post("/api/price-offers/:id/respond", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { action, note } = req.body;

      if (!action || !['accept', 'reject'].includes(action)) {
        return res.status(400).json({ message: "Invalid action", messageAr: "إجراء غير صالح" });
      }

      const offer = await storage.getPriceOffer(req.params.id);

      if (!offer) {
        return res.status(404).json({ message: "Offer not found", messageAr: "العرض غير موجود" });
      }

      if (offer.clientId !== req.client.id) {
        return res.status(403).json({ message: "Unauthorized", messageAr: "غير مصرح" });
      }

      if (offer.status !== 'sent' && offer.status !== 'viewed') {
        return res.status(400).json({
          message: "Offer cannot be modified",
          messageAr: "لا يمكن تعديل العرض"
        });
      }

      // Check if expired
      if (new Date(offer.validUntil) < new Date()) {
        return res.status(400).json({
          message: "Offer has expired",
          messageAr: "انتهت صلاحية العرض"
        });
      }

      const newStatus = action === 'accept' ? 'accepted' : 'rejected';

      // Auto-activate draft LTA if offer is accepted
      if (newStatus === 'accepted' && offer.ltaId) {
        const lta = await storage.getLta(offer.ltaId);

        if (lta && lta.status === 'draft') {
          // Activate the LTA with 1-year validity
          const startDate = new Date();
          const endDate = new Date();
          endDate.setFullYear(endDate.getFullYear() + 1);

          await storage.updateLta(offer.ltaId, {
            status: 'active',
            startDate,
            endDate
          });

          // Populate lta_products from offer items
          const items = offer.items as any[];
          for (const item of items) {
            try {
              await storage.assignProductToLta(offer.ltaId, {
                productId: item.productId,
                contractPrice: item.unitPrice.toString(),
                currency: 'USD'
              });
            } catch (error) {
              // Ignore duplicate product errors
            }
          }
        }
      }

      // Update offer status
      await storage.updatePriceOffer(req.params.id, {
        status: newStatus,
        responseNote: note || null,
        respondedAt: new Date()
      });

      // If accepted, add products to LTA if not already there
      if (action === 'accept') {
        const items = typeof offer.items === 'string' ? JSON.parse(offer.items) : offer.items;
        if (offer.ltaId && Array.isArray(items)) {
          for (const item of items) {
            try {
              await storage.assignProductToLta({
                ltaId: offer.ltaId,
                productId: item.productId,
                contractPrice: item.unitPrice.toString(),
                currency: item.currency || 'USD'
              });
            } catch (error) {
              // Ignore duplicate product errors
            }
          }
        }
      }

      // Notify admins
      const client = await storage.getClient(req.client.id);
      const admins = await storage.getAdminClients();

      for (const admin of admins) {
        await storage.createNotification({
          clientId: admin.id,
          type: 'system',
          titleEn: `Price Offer ${action === 'accept' ? 'Accepted' : 'Rejected'}`,
          titleAr: action === 'accept' ? 'تم قبول عرض السعر' : 'تم رفض عرض السعر',
          messageEn: `${client?.nameEn} ${action === 'accept' ? 'accepted' : 'rejected'} offer #${offer.offerNumber}`,
          messageAr: `${action === 'accept' ? 'قبل' : 'رفض'} ${client?.nameAr} العرض رقم ${offer.offerNumber}`,
          metadata: JSON.stringify({ offerId: offer.id })
        });
      }

      res.json({
        success: true,
        message: "Response submitted successfully",
        messageAr: "تم إرسال الرد بنجاح"
      });
    } catch (error) {
      // Log error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Price offer response error:', error);
      }
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: 'حدث خطأ غير معروف'
      });
    }
  });

  // ============================================
  // PRICE MANAGEMENT - Admin Routes
  // ============================================

  // Admin: Get all price requests
  app.get("/api/admin/price-requests", requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const requests = await storage.getAllPriceRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Admin: Get single price request
  app.get("/api/admin/price-requests/:id", requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const request = await storage.getPriceRequestWithDetails(req.params.id);
      if (!request) {
        return res.status(404).json({
          message: "Price request not found",
          messageAr: "طلب السعر غير موجود"
        });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get all price offers for admin
  app.get('/api/admin/price-offers', requireAdmin, async (req, res) => {
    try {
      const offers = await storage.getAllPriceOffers();
      res.json(offers);
    } catch (error) {
      // Log error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching price offers:', error);
      }
      res.status(500).json({ message: 'Failed to fetch price offers' });
    }
  });

  // Update price offer status
  app.patch('/api/admin/price-offers/:id/status', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['draft', 'sent', 'viewed', 'accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const updatedOffer = await storage.updatePriceOfferStatus(id, status);

      if (!updatedOffer) {
        return res.status(404).json({ message: 'Price offer not found' });
      }

      res.json(updatedOffer);
    } catch (error) {
      // Log error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating price offer status:', error);
      }
      res.status(500).json({ message: 'Failed to update price offer status' });
    }
  });

  // Admin: Create price offer (draft)
  app.post("/api/admin/price-offers", requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const { requestId, clientId, ltaId, items, subtotal, tax, total, notes, validUntil } = req.body;

      if (!clientId || !ltaId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          message: "Client ID, LTA ID, and items are required",
          messageAr: "معرف العميل ومعرف الاتفاقية والمنتجات مطلوبة"
        });
      }

      if (subtotal === undefined || subtotal === null) {
        return res.status(400).json({
          message: "Subtotal is required",
          messageAr: "المجموع الفرعي مطلوب"
        });
      }

      if (total === undefined || total === null) {
        return res.status(400).json({
          message: "Total is required",
          messageAr: "المجموع الإجمالي مطلوب"
        });
      }

      // Validate and enrich items with product names
      const enrichedItems = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Check if names are missing
        if (!item.nameEn || !item.nameAr) {
          const product = await storage.getProduct(item.productId);

          if (!product) {
            return res.status(400).json({
              message: `Product not found for item ${i + 1}`,
              messageAr: `المنتج غير موجود للعنصر ${i + 1}`
            });
          }

          // Enrich with product names
          enrichedItems.push({
            ...item,
            nameEn: item.nameEn || product.nameEn || 'Unknown Product',
            nameAr: item.nameAr || product.nameAr || 'منتج غير معروف',
            sku: item.sku || product.sku || 'N/A'
          });
        } else {
          enrichedItems.push(item);
        }
      }

      // Generate offer number
      const count = (await storage.getAllPriceOffers()).length + 1;
      const offerNumber = `PO-${Date.now()}-${count.toString().padStart(4, '0')}`;

      // Create price offer with enriched items
      const offer = await storage.createPriceOffer({
        offerNumber,
        requestId: requestId || null,
        clientId,
        ltaId,
        items: enrichedItems,
        subtotal: typeof subtotal === 'number' ? subtotal.toString() : subtotal.toString(),
        tax: tax !== undefined && tax !== null ? (typeof tax === 'number' ? tax.toString() : tax.toString()) : '0',
        total: typeof total === 'number' ? total.toString() : total.toString(),
        notes: notes || null,
        validUntil: new Date(validUntil || Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        status: 'draft',
        createdBy: req.client.id
      });

      // If created from request, mark request as processed
      if (requestId) {
        await storage.updatePriceRequestStatus(requestId, 'processed');

        // Notify client that their request has been processed
        const request = await storage.getPriceRequest(requestId);
        if (request) {
          await storage.createNotification({
            clientId: request.clientId,
            type: 'system',
            titleEn: 'Price Request Processed',
            titleAr: 'تمت معالجة طلب السعر',
            messageEn: `Your price request ${request.requestNumber} has been processed. An offer will be sent to you shortly.`,
            messageAr: `تمت معالجة طلب السعر ${request.requestNumber}. سيتم إرسال عرض السعر قريباً.`,
            metadata: JSON.stringify({ requestId: request.id, offerId: offer.id })
          });
        }
      }

      // Document generation removed - now manual only via admin UI

      res.json(offer);
    } catch (error) {
      // Log error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Create offer error:', error);
      }
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Admin: Generate PDF for price request - Using NEW template system
  app.post("/api/admin/price-requests/:id/generate-pdf", requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const { language = 'ar' } = req.body; // Default to Arabic (template system is Arabic-only)
      const priceRequest = await db.query.priceRequests.findFirst({
        where: eq(schema.priceRequests.id, req.params.id)
      });

      if (!priceRequest) {
        return res.status(404).json({
          message: "Price request not found",
          messageAr: "طلب السعر غير موجود"
        });
      }

      // Get client and LTA details
      const client = await storage.getClient(priceRequest.clientId);
      const lta = await storage.getLta(priceRequest.ltaId);

      if (!client || !lta) {
        return res.status(404).json({
          message: "Client or LTA not found",
          messageAr: "العميل أو الاتفاقية غير موجودة"
        });
      }

      // Get products from price request
      const products = typeof priceRequest.products === 'string'
        ? JSON.parse(priceRequest.products)
        : priceRequest.products;

      const items = [];
      for (const item of products) {
        const product = await db.query.products.findFirst({
          where: eq(schema.products.id, item.productId)
        });
        if (product) {
          items.push({
            sku: product.sku,
            nameAr: product.nameAr,
            nameEn: product.nameEn,
            quantity: item.quantity || 1,
            unitPrice: product.sellingPricePiece || '0.00'
          });
        }
      }

      // Use NEW template system with DocumentUtils
      const documentResult = await DocumentUtils.generateDocument({
        templateCategory: 'price_offer', // Use price_offer template for requests
        variables: [
          { key: 'date', value: new Date().toLocaleDateString('ar-SA') },
          { key: 'offerNumber', value: priceRequest.requestNumber },
          { key: 'clientName', value: client.nameAr },
          { key: 'ltaName', value: lta.nameAr },
          { key: 'validUntil', value: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA') },
          { key: 'items', value: items },
          { key: 'subtotal', value: items.reduce((sum, item) => sum + (parseFloat(item.unitPrice) * item.quantity), 0).toFixed(2) },
          { key: 'discount', value: '0' },
          { key: 'total', value: items.reduce((sum, item) => sum + (parseFloat(item.unitPrice) * item.quantity), 0).toFixed(2) },
          { key: 'notes', value: priceRequest.notes || '' },
          { key: 'validityDays', value: '30' },
          { key: 'deliveryDays', value: '5' },
          { key: 'paymentTerms', value: '30' },
          { key: 'warrantyDays', value: '7' }
        ],
        clientId: priceRequest.clientId,
        metadata: { 
          priceRequestId: priceRequest.id,
          ltaId: priceRequest.ltaId
        },
        force: true // Always generate new PDF for price requests (they're not reusable like offers)
      });

      if (!documentResult.success || !documentResult.documentId) {
        return res.status(500).json({
          message: documentResult.error || 'Failed to generate PDF',
          messageAr: 'فشل في إنشاء ملف PDF'
        });
      }

      // Get the generated document
      const document = await storage.getDocumentMetadata(documentResult.documentId);
      if (!document) {
        return res.status(500).json({
          message: 'Document created but not found',
          messageAr: 'تم إنشاء المستند ولكن لم يتم العثور عليه'
        });
      }

      // Download the PDF from storage
      const downloadResult = await PDFStorage.downloadPDF(document.fileUrl, document.checksum || undefined);
      if (!downloadResult.ok || !downloadResult.data) {
        return res.status(500).json({
          message: downloadResult.error || 'Failed to download PDF',
          messageAr: 'فشل تحميل ملف PDF'
        });
      }

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="price-request-${priceRequest.requestNumber}.pdf"`);
      res.send(downloadResult.data);

    } catch (error) {
      // Log error for debugging
      console.error('Error generating PDF for price request:', error);
      return res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to generate PDF',
        messageAr: 'فشل في إنشاء ملف PDF'
      });
    }
  });

  // Client: Download price offer PDF
  app.get("/api/price-offers/:id/download", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const offerId = req.params.id;
      
      // Get price offer
      const offer = await storage.getPriceOffer(offerId);
      if (!offer) {
        return res.status(404).json({ message: "Offer not found", messageAr: "العرض غير موجود" });
      }

      // Check if user has access (must be the offer's client or admin)
      if (offer.clientId !== req.user?.id && req.user?.role !== 'admin') {
        return res.status(403).json({ 
          message: "Access denied", 
          messageAr: "غير مصرح بالوصول" 
        });
      }

      // Find the document by price offer ID
      const documents = await storage.searchDocuments({ priceOfferId: offerId });
      const document = documents.find(doc => doc.priceOfferId === offerId);

      if (!document || !document.fileUrl) {
        return res.status(404).json({ 
          message: "PDF not found", 
          messageAr: "لم يتم العثور على ملف PDF" 
        });
      }

      // Download from storage
      const downloadResult = await PDFStorage.downloadPDF(document.fileUrl, document.checksum || undefined);
      
      if (!downloadResult.ok || !downloadResult.data) {
        return res.status(500).json({ 
          message: "Failed to download PDF", 
          messageAr: "فشل تحميل PDF" 
        });
      }

      // Log access
      await PDFAccessControl.logDocumentAccess({
        documentId: document.id,
        clientId: offer.clientId,
        action: 'download',
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      });

      // Send PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${offer.offerNumber}.pdf"`);
      res.setHeader('Content-Length', downloadResult.data.length.toString());
      res.send(downloadResult.data);

    } catch (error) {
      console.error('Price offer download error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Download failed',
        messageAr: 'فشل التحميل'
      });
    }
  });

  // Admin: Send price offer (generates PDF and sends to client)
  app.post("/api/admin/price-offers/:id/send", requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const offer = await storage.getPriceOffer(req.params.id);

      if (!offer) {
        return res.status(404).json({ message: "Offer not found", messageAr: "العرض غير موجود" });
      }

      if (offer.status !== 'draft') {
        return res.status(400).json({
          message: "Only draft offers can be sent",
          messageAr: "يمكن إرسال المسودات فقط"
        });
      }

      // Get client and LTA details for PDF
      const client = await storage.getClient(offer.clientId);
      const lta = await storage.getLta(offer.ltaId);

      if (!client || !lta) {
        return res.status(404).json({
          message: "Client or LTA not found",
          messageAr: "العميل أو الاتفاقية غير موجودة"
        });
      }

      // Use NEW optimized DocumentUtils with deduplication and caching
      const items = typeof offer.items === 'string' ? JSON.parse(offer.items) : offer.items;
      
      const documentResult = await DocumentUtils.generateDocument({
        templateCategory: 'price_offer',
        variables: [
          { key: 'date', value: new Date(offer.createdAt).toLocaleDateString('ar-SA') },
          { key: 'offerNumber', value: offer.offerNumber },
          { key: 'clientName', value: client.nameAr },
          { key: 'validUntil', value: new Date(offer.validUntil).toLocaleDateString('ar-SA') },
          { key: 'items', value: items },
          { key: 'subtotal', value: offer.subtotal.toString() },
          { key: 'discount', value: '0' },
          { key: 'total', value: offer.total.toString() },
          { key: 'validityDays', value: '30' },
          { key: 'deliveryDays', value: '5' },
          { key: 'paymentTerms', value: '30' },
          { key: 'warrantyDays', value: '7' }
        ],
        clientId: offer.clientId,
        metadata: { priceOfferId: offer.id },
        force: false // Use deduplication
      });

      if (!documentResult.success) {
        return res.status(500).json({
          message: documentResult.error || "Failed to generate PDF",
          messageAr: "فشل إنشاء ملف PDF"
        });
      }

      // Update offer with PDF and mark as sent
      await storage.updatePriceOffer(req.params.id, {
        status: 'sent',
        sentAt: new Date(),
        pdfFileName: documentResult.fileName || ''
      });

      // Notify client
      await storage.createNotification({
        clientId: offer.clientId,
        type: 'system',
        titleEn: 'New Price Offer',
        titleAr: 'عرض سعر جديد',
        messageEn: `You have received price offer #${offer.offerNumber}`,
        messageAr: `لقد استلمت عرض السعر رقم ${offer.offerNumber}`,
        metadata: JSON.stringify({ offerId: offer.id })
      });

      res.json({
        message: "Offer sent successfully",
        messageAr: "تم إرسال العرض بنجاح",
        pdfFileName: documentResult.fileName,
        documentId: documentResult.documentId
      });
    } catch (error) {
      console.error('Send offer error:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Admin: Delete price offer
  app.delete("/api/admin/price-offers/:id", requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      await storage.deletePriceOffer(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Admin: Bulk delete price offers
  app.post("/api/admin/price-offers/bulk-delete", requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid request: ids array required" });
      }

      for (const id of ids) {
        await storage.deletePriceOffer(id);
      }

      res.json({
        success: true,
        message: `Deleted ${ids.length} price offers`,
        messageAr: `تم حذف ${ids.length} عروض أسعار`
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Admin: Delete order
  app.delete("/api/admin/orders/:id", requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const orderId = req.params.id;
      
      // Check if order exists
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({
          message: "Order not found",
          messageAr: "الطلب غير موجود"
        });
      }

      // Delete the order
      await db.delete(orders).where(eq(orders.id, orderId));

      res.json({
        success: true,
        message: "Order deleted successfully",
        messageAr: "تم حذف الطلب بنجاح"
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Admin: Bulk delete orders
  app.post("/api/admin/orders/bulk-delete", requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid request: ids array required" });
      }

      for (const id of ids) {
        await db.delete(orders).where(eq(orders.id, id));
      }

      res.json({
        success: true,
        message: `Deleted ${ids.length} orders`,
        messageAr: `تم حذف ${ids.length} طلبات`
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Admin Client Management Routes
  app.get("/api/admin/clients", requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const clients = await storage.getClients();
      const clientsBasicInfo = clients.map(client => ({
        id: client.id,
        username: client.username,
        nameEn: client.nameEn,
        nameAr: client.nameAr,
        email: client.email,
        phone: client.phone,
        isAdmin: client.isAdmin,
        domain: client.domain,
        registrationId: client.registrationId,
        industry: client.industry,
        hqCity: client.hqCity,
        hqCountry: client.hqCountry,
        paymentTerms: client.paymentTerms,
        priceTier: client.priceTier,
        riskTier: client.riskTier,
        contractModel: client.contractModel,
      }));
      res.json(clientsBasicInfo);
    } catch (error) {
      res.status(500).json({
        message: "Error fetching clients",
        messageAr: "خطأ في جلب العملاء"
      });
    }
  });

  app.get("/api/admin/clients/:id", requireAdmin, async (req: any, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({
          message: "Client not found",
          messageAr: "العميل غير موجود",
        });
      }

      const departments = await storage.getClientDepartments(client.id);
      const locations = await storage.getClientLocations(client.id);

      res.json({
        client: {
          id: client.id,
          username: client.username,
          nameEn: client.nameEn || '',
          nameAr: client.nameAr || '',
          email: client.email || null,
          phone: client.phone || null,
          isAdmin: client.isAdmin || false,
          // Organization fields
          domain: client.domain || null,
          registrationId: client.registrationId || null,
          industry: client.industry || null,
          hqCity: client.hqCity || null,
          hqCountry: client.hqCountry || null,
          paymentTerms: client.paymentTerms || null,
          priceTier: client.priceTier || null,
          riskTier: client.riskTier || null,
          contractModel: client.contractModel || null,
        },
        departments: departments || [],
        locations: locations || [],
      });
    } catch (error) {
      console.error('Error fetching client details:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Error fetching client details",
        messageAr: "خطأ في جلب تفاصيل العميل"
      });
    }
  });

  app.post("/api/admin/clients", requireAdmin, async (req: any, res) => {
    try {
      const validatedData = createClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json({
        id: client.id,
        username: client.username,
        nameEn: client.nameEn,
        nameAr: client.nameAr,
        email: client.email,
        phone: client.phone,
        isAdmin: client.isAdmin,
        domain: client.domain,
        registrationId: client.registrationId,
        industry: client.industry,
        hqCity: client.hqCity,
        hqCountry: client.hqCountry,
        paymentTerms: client.paymentTerms,
        priceTier: client.priceTier,
        riskTier: client.riskTier,
        contractModel: client.contractModel,
        message: "Client created successfully",
        messageAr: "تم إنشاء العميل بنجاح"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      if (error instanceof Error ? error.message : 'Unknown error'?.includes('duplicate') || error instanceof Error ? error.message : 'Unknown error'?.includes('unique')) {
        return res.status(409).json({
          message: "Username already exists",
          messageAr: "اسم المستخدم موجود بالفعل"
        });
      }
      res.status(500).json({
        message: "Error creating client",
        messageAr: "خطأ في إنشاء العميل"
      });
    }
  });

  app.put("/api/admin/clients/:id", requireAdmin, async (req: any, res) => {
    try {
      const validatedData = updateClientSchema.parse(req.body);
      const client = await storage.updateClient(req.params.id, validatedData);
      if (!client) {
        return res.status(404).json({
          message: "Client not found",
          messageAr: "العميل غير موجود",
        });
      }
      res.json({
        id: client.id,
        username: client.username,
        nameEn: client.nameEn,
        nameAr: client.nameAr,
        email: client.email,
        phone: client.phone,
        isAdmin: client.isAdmin,
        domain: client.domain,
        registrationId: client.registrationId,
        industry: client.industry,
        hqCity: client.hqCity,
        hqCountry: client.hqCountry,
        paymentTerms: client.paymentTerms,
        priceTier: client.priceTier,
        riskTier: client.riskTier,
        contractModel: client.contractModel,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({
        message: "Error updating client",
        messageAr: "خطأ في تحديث العميل"
      });
    }
  });

  app.delete("/api/admin/clients/:id", requireAdmin, async (req: any, res) => {
    try {
      await storage.deleteClient(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({
        message: "Error deleting client",
        messageAr: "خطأ في حذف العميل"
      });
    }
  });

  // Toggle admin status for a client
  app.patch("/api/admin/clients/:id/admin-status", requireAdmin, async (req: any, res) => {
    try {
      const { isAdmin } = req.body;

      if (typeof isAdmin !== 'boolean') {
        return res.status(400).json({
          message: "isAdmin must be a boolean",
          messageAr: "يجب أن يكون isAdmin قيمة منطقية"
        });
      }

      // Update the client
      const client = await storage.updateClient(req.params.id, { isAdmin });

      if (!client) {
        return res.status(404).json({
          message: "Client not found",
          messageAr: "العميل غير موجود",
        });
      }

      // Atomic check: verify at least one admin exists after update
      const allClients = await storage.getClients();
      const adminClients = allClients.filter(c => c.isAdmin);

      if (adminClients.length === 0) {
        // Rollback: restore admin status
        await storage.updateClient(req.params.id, { isAdmin: true });
        return res.status(400).json({
          message: "Cannot demote the last admin. Promote another user to admin first.",
          messageAr: "لا يمكن تخفيض رتبة المسؤول الأخير. قم بترقية مستخدم آخر إلى مسؤول أولاً.",
        });
      }

      res.json({
        id: client.id,
        username: client.username,
        nameEn: client.nameEn,
        nameAr: client.nameAr,
        email: client.email,
        phone: client.phone,
        isAdmin: client.isAdmin,
        message: isAdmin
          ? "Client promoted to admin"
          : "Client demoted from admin",
        messageAr: isAdmin
          ? "تمت ترقية العميل إلى مسؤول"
          : "تم تخفيض رتبة العميل من مسؤول"
      });
    } catch (error) {
      res.status(500).json({
        message: "Error updating admin status",
        messageAr: "خطأ في تحديث حالة المسؤول"
      });
    }
  });

  // Bulk import clients from CSV
  app.post("/api/admin/clients/bulk-import", requireAdmin, async (req: any, res) => {
    try {
      const { clients } = req.body;
      
      if (!Array.isArray(clients) || clients.length === 0) {
        return res.status(400).json({
          message: "Clients array is required and must not be empty",
          messageAr: "مصفوفة العملاء مطلوبة ولا يجب أن تكون فارغة"
        });
      }

      const results = {
        successCount: 0,
        errorCount: 0,
        errors: [] as Array<{ index: number; username: string; error: string }>
      };

      // Process each client
      for (let i = 0; i < clients.length; i++) {
        const clientData = clients[i];
        
        try {
          // Validate required fields
          if (!clientData.username || !clientData.password || !clientData.nameEn || !clientData.nameAr) {
            throw new Error("Missing required fields: username, password, nameEn, nameAr");
          }

          // Check if username already exists
          const existingClient = await storage.getClientByUsername(clientData.username);
          if (existingClient) {
            throw new Error(`Username '${clientData.username}' already exists`);
          }

          // Create client
          const client = await storage.createClient({
            username: clientData.username,
            password: clientData.password,
            nameEn: clientData.nameEn,
            nameAr: clientData.nameAr,
            email: clientData.email || null,
            phone: clientData.phone || null,
            isAdmin: clientData.isAdmin || false,
          });

          // Add departments if provided
          if (clientData.departmentTypes && Array.isArray(clientData.departmentTypes)) {
            for (const deptType of clientData.departmentTypes) {
              await storage.createClientDepartment({
                clientId: client.id,
                departmentType: deptType,
                contactName: null,
                contactEmail: null,
                contactPhone: null,
              });
            }
          }

          // Add location if provided
          if (clientData.locationName) {
            await storage.createClientLocation({
              clientId: client.id,
              nameEn: clientData.locationName,
              nameAr: clientData.locationName, // Use same name for both languages if not provided
              addressEn: clientData.locationAddress || '',
              addressAr: clientData.locationAddress || '',
              city: clientData.locationCity || null,
              country: clientData.locationCountry || null,
              phone: null,
              latitude: null,
              longitude: null,
              isHeadquarters: true, // Default to headquarters for imported locations
            });
          }

          results.successCount++;
        } catch (error) {
          results.errorCount++;
          results.errors.push({
            index: i + 1,
            username: clientData.username || 'Unknown',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        ...results,
        message: `Bulk import completed. ${results.successCount} clients imported successfully, ${results.errorCount} failed.`,
        messageAr: `اكتمل الاستيراد المجمع. تم استيراد ${results.successCount} عميل بنجاح، فشل ${results.errorCount}.`
      });
    } catch (error) {
      res.status(500).json({
        message: "Error during bulk import",
        messageAr: "خطأ أثناء الاستيراد المجمع"
      });
    }
  });

  // Company User Management (Admin)
  app.get("/api/admin/company-users/:companyId", requireAdmin, async (req: any, res) => {
    try {
      const users = await storage.getCompanyUsers(req.params.companyId);
      res.json(users.map(user => ({
        id: user.id,
        username: user.username,
        nameEn: user.nameEn,
        nameAr: user.nameAr,
        email: user.email,
        phone: user.phone,
        departmentType: user.departmentType,
        isActive: user.isActive,
        createdAt: user.createdAt,
      })));
    } catch (error) {
      res.status(500).json({
        message: "Error fetching company users",
        messageAr: "خطأ في جلب مستخدمي الشركة"
      });
    }
  });

  app.post("/api/admin/company-users/:companyId", requireAdmin, async (req: any, res) => {
    try {
      const validatedData = createCompanyUserSchema.parse(req.body);

      // Hash the password before storing
      const { hashPassword } = await import('./auth');
      const hashedPassword = await hashPassword(validatedData.password);

      const user = await storage.createCompanyUser({
        ...validatedData,
        companyId: req.params.companyId,
        password: hashedPassword,
      });

      res.status(201).json({
        id: user.id,
        username: user.username,
        nameEn: user.nameEn,
        nameAr: user.nameAr,
        email: user.email,
        phone: user.phone,
        departmentType: user.departmentType,
        isActive: user.isActive,
        message: "User created successfully",
        messageAr: "تم إنشاء المستخدم بنجاح"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({
        message: "Error creating user",
        messageAr: "خطأ في إنشاء المستخدم"
      });
    }
  });

  app.patch("/api/admin/company-users/:id", requireAdmin, async (req: any, res) => {
    try {
      const validatedData = updateCompanyUserSchema.parse(req.body);

      // If password is being updated, hash it
      let updateData = validatedData;
      if (validatedData.password) {
        const { hashPassword } = await import('./auth');
        const hashedPassword = await hashPassword(validatedData.password);
        updateData = { ...validatedData, password: hashedPassword };
      }

      const user = await storage.updateCompanyUser(req.params.id, updateData);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
          messageAr: "المستخدم غير موجود"
        });
      }

      res.json({
        id: user.id,
        username: user.username,
        nameEn: user.nameEn,
        nameAr: user.nameAr,
        email: user.email,
        phone: user.phone,
        departmentType: user.departmentType,
        isActive: user.isActive,
        message: "User updated successfully",
        messageAr: "تم تحديث المستخدم بنجاح"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({
        message: "Error updating user",
        messageAr: "خطأ في تحديث المستخدم"
      });
    }
  });

  app.delete("/api/admin/company-users/:id", requireAdmin, async (req: any, res) => {
    try {
      await storage.deleteCompanyUser(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({
        message: "Error deleting user",
        messageAr: "خطأ في حذف المستخدم"
      });
    }
  });

  // Admin Department Management
  app.post("/api/admin/clients/:clientId/departments", requireAdmin, async (req: any, res) => {
    try {
      const validatedData = createDepartmentSchema.parse(req.body);
      const department = await storage.createClientDepartment({
        clientId: req.params.clientId,
        ...validatedData,
      });
      res.status(201).json(department);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({
        message: "Error creating department",
        messageAr: "خطأ في إنشاء القسم"
      });
    }
  });

  app.put("/api/admin/departments/:id", requireAdmin, async (req: any, res) => {
    try {
      const validatedData = updateDepartmentSchema.parse(req.body);
      const department = await storage.updateClientDepartment(req.params.id, validatedData);
      if (!department) {
        return res.status(404).json({
          message: "Department not found",
          messageAr: "القسم غير موجود",
        });
      }
      res.json(department);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({
        message: "Error updating department",
        messageAr: "خطأ في تحديث القسم"
      });
    }
  });

  app.delete("/api/admin/departments/:id", requireAdmin, async (req: any, res) => {
    try {
      await storage.deleteClientDepartment(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({
        message: "Error deleting department",
        messageAr: "خطأ في حذف القسم"
      });
    }
  });

  // Admin Location Management
  app.post("/api/admin/clients/:clientId/locations", requireAdmin, async (req: any, res) => {
    try {
      const validatedData = createLocationSchema.parse(req.body);
      const location = await storage.createClientLocation({
        clientId: req.params.clientId,
        ...validatedData,
      });
      res.status(201).json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({
        message: "Error creating location",
        messageAr: "خطأ في إنشاء الموقع"
      });
    }
  });

  app.put("/api/admin/locations/:id", requireAdmin, async (req: any, res) => {
    try {
      const validatedData = updateLocationSchema.parse(req.body);
      const location = await storage.updateClientLocation(req.params.id, validatedData);
      if (!location) {
        return res.status(404).json({
          message: "Location not found",
          messageAr: "الموقع غير موجود",
        });
      }
      res.json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({
        message: "Error updating location",
        messageAr: "خطأ في تحديث الموقع"
      });
    }
  });

  app.delete("/api/admin/locations/:id", requireAdmin, async (req: any, res) => {
    try {
      await storage.deleteClientLocation(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({
        message: "Error deleting location",
        messageAr: "خطأ في حذف الموقع"
      });
    }
  });

  // Admin Vendor Management
  app.get("/api/admin/vendors", requireAdmin, async (req: any, res) => {
    try {
      const vendors = await storage.getVendors();
      res.json(vendors);
    } catch (error) {
      res.status(500).json({
        message: "Error fetching vendors",
        messageAr: "خطأ في جلب الموردين"
      });
    }
  });

  app.get("/api/admin/vendors/:id", requireAdmin, async (req: any, res) => {
    try {
      const vendor = await storage.getVendor(req.params.id);
      if (!vendor) {
        return res.status(404).json({
          message: "Vendor not found",
          messageAr: "المورد غير موجود",
        });
      }
      res.json(vendor);
    } catch (error) {
      res.status(500).json({
        message: "Error fetching vendor",
        messageAr: "خطأ في جلب المورد"
      });
    }
  });

  app.post("/api/admin/vendors", requireAdmin, async (req: any, res) => {
    try {
      const validatedData = createVendorSchema.parse(req.body);

      // Check for duplicate vendor number
      const existingVendor = await storage.getVendorByNumber(validatedData.vendorNumber);
      if (existingVendor) {
        return res.status(400).json({
          message: "Vendor number already exists",
          messageAr: "رقم المورد موجود بالفعل"
        });
      }

      const vendor = await storage.createVendor(validatedData);
      res.status(201).json(vendor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({
        message: "Error creating vendor",
        messageAr: "خطأ في إنشاء المورد"
      });
    }
  });

  app.put("/api/admin/vendors/:id", requireAdmin, async (req: any, res) => {
    try {
      const validatedData = updateVendorSchema.parse(req.body);

      // Check for duplicate vendor number if it's being updated
      if (validatedData.vendorNumber) {
        const existingVendor = await storage.getVendorByNumber(validatedData.vendorNumber);
        if (existingVendor && existingVendor.id !== req.params.id) {
          return res.status(400).json({
            message: "Vendor number already exists",
            messageAr: "رقم المورد موجود بالفعل"
          });
        }
      }

      const vendor = await storage.updateVendor(req.params.id, validatedData);
      if (!vendor) {
        return res.status(404).json({
          message: "Vendor not found",
          messageAr: "المورد غير موجود",
        });
      }
      res.json(vendor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({
        message: "Error updating vendor",
        messageAr: "خطأ في تحديث المورد"
      });
    }
  });

  app.delete("/api/admin/vendors/:id", requireAdmin, async (req: any, res) => {
    try {
      await storage.deleteVendor(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({
        message: "Error deleting vendor",
        messageAr: "خطأ في حذف المورد"
      });
    }
  });

  // Client Self-Service Profile Update
  app.put("/api/client/profile", requireAuth, async (req: any, res) => {
    try {
      const validatedData = updateOwnProfileSchema.parse(req.body);
      const client = await storage.updateClient(req.client.id, validatedData);
      if (!client) {
        return res.status(404).json({
          message: "Client not found",
          messageAr: "العميل غير موجود",
        });
      }
      res.json({
        id: client.id,
        username: client.username,
        nameEn: client.nameEn,
        nameAr: client.nameAr,
        email: client.email,
        phone: client.phone,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({
        message: "Error updating profile",
        messageAr: "خطأ في تحديث الملف الشخصي"
      });
    }
  });

  // Admin Orders Management - Optimized with caching hints
  app.get("/api/admin/orders", requireAdmin, async (req: any, res) => {
    try {
      const { page, pageSize, status, search, all } = req.query;

      // Set cache control headers for better performance
      res.setHeader('Cache-Control', 'private, max-age=60'); // Cache for 1 minute

      // If 'all' parameter is present, return all orders without pagination
      if (all === 'true') {
        const orders = await storage.getOrders();
        res.json({ orders });
        return;
      }

      // Get all orders first (this should be cached at storage level)
      let orders = await storage.getOrders();

      // Apply status filter
      if (status && status !== 'all') {
        orders = orders.filter(order => order.status === status);
      }

      // Apply search filter (search in order ID)
      if (search) {
        const searchLower = search.toString().toLowerCase();
        orders = orders.filter(order =>
          order.id.toLowerCase().includes(searchLower)
        );
      }

      // Apply pagination
      const pageNum = parseInt(page as string) || 1;
      const pageSizeNum = parseInt(pageSize as string) || 10;
      const startIndex = (pageNum - 1) * pageSizeNum;
      const endIndex = startIndex + pageSizeNum;
      const paginatedOrders = orders.slice(startIndex, endIndex);
      const totalPages = Math.ceil(orders.length / pageSizeNum);

      res.json({
        orders: paginatedOrders,
        totalPages,
        totalCount: orders.length,
        currentPage: pageNum
      });
    } catch (error) {
      res.status(500).json({
        message: "Error fetching orders",
        messageAr: "خطأ في جلب الطلبات"
      });
    }
  });

  // Admin Error Logs Endpoints
  app.get("/api/admin/error-logs", requireAdmin, async (req: any, res) => {
    try {
      const { level, limit } = req.query;
      const limitNum = limit ? parseInt(limit as string) : 50;

      let logs;
      if (level) {
        logs = await errorLogger.getErrorsByLevel(level as any, limitNum);
      } else {
        logs = await errorLogger.getRecentErrors(limitNum);
      }

      res.json(logs);
    } catch (error) {
      errorLogger.logError(error as Error, {
        route: '/api/admin/error-logs',
        userId: req.client.id
      });
      res.status(500).json({
        message: "Error fetching error logs",
        messageAr: "خطأ في جلب سجلات الأخطاء"
      });
    }
  });

  app.get("/api/admin/error-logs/stats", requireAdmin, async (req: any, res) => {
    try {
      const stats = await errorLogger.getErrorStats();
      res.json(stats);
    } catch (error) {
      errorLogger.logError(error as Error, {
        route: '/api/admin/error-logs/stats',
        userId: req.client.id
      });
      res.status(500).json({
        message: "Error fetching error stats",
        messageAr: "خطأ في جلب إحصائيات الأخطاء"
      });
    }
  });

  app.delete("/api/admin/error-logs/clear", requireAdmin, async (req: any, res) => {
    try {
      const { daysToKeep } = req.query;
      const days = daysToKeep ? parseInt(daysToKeep as string) : 30;

      const deleted = await errorLogger.clearOldLogs(days);

      errorLogger.logInfo('Error logs cleared', {
        route: '/api/admin/error-logs/clear',
        userId: req.client.id,
        deletedCount: deleted,
        daysToKeep: days
      });

      res.json({
        message: `Cleared ${deleted} old error logs`,
        messageAr: `تم مسح ${deleted} سجلات أخطاء قديمة`,
        deleted
      });
    } catch (error) {
      errorLogger.logError(error as Error, {
        route: '/api/admin/error-logs/clear',
        userId: req.client.id
      });
      res.status(500).json({
        message: "Error clearing error logs",
        messageAr: "خطأ في مسح سجلات الأخطاء"
      });
    }
  });

  // Get order history (authenticated users)
  app.get('/api/orders/:id/history', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Verify order access
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Non-admin users can only view their own orders
      if (!req.client.isAdmin && order.clientId !== req.client.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const history = await storage.getOrderHistory(id);
      res.json(history);
    } catch (error) {
      console.error('Error fetching order history:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Export order to PDF (admin only) - Using NEW template system
  app.post('/api/admin/orders/export-pdf', requireAdmin, async (req: any, res) => {
    try {
      const { order, client, lta, items, language } = req.body;

      // Use NEW DocumentUtils with deduplication
      const documentResult = await DocumentUtils.generateDocument({
        templateCategory: 'order',
        variables: [
          { key: 'orderId', value: order.id },
          { key: 'orderDate', value: new Date(order.createdAt).toLocaleDateString('ar-SA') },
          { key: 'clientName', value: client.nameAr || client.nameEn },
          { key: 'deliveryAddress', value: order.deliveryAddress || client.address || '' },
          { key: 'clientPhone', value: client.phone || '' },
          { key: 'paymentMethod', value: order.paymentMethod || 'تحويل بنكي' },
          { key: 'reference', value: order.referenceNumber || lta?.referenceNumber || '' },
          { key: 'items', value: items },
          { key: 'totalAmount', value: order.totalAmount?.toString() || '0' },
          { key: 'deliveryDays', value: '5' }
        ],
        clientId: client.id,
        metadata: { orderId: order.id }
      });

      if (!documentResult.success) {
        return res.status(500).json({
          message: documentResult.error || 'Failed to generate PDF',
          messageAr: 'فشل إنشاء PDF'
        });
      }

      // Download the generated PDF and send to client
      const downloadResult = await PDFStorage.downloadPDF(documentResult.fileName!);
      
      if (!downloadResult.ok || !downloadResult.data) {
        return res.status(500).json({
          message: 'Failed to retrieve PDF',
          messageAr: 'فشل استرجاع PDF'
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="order-${order.id.slice(0, 8)}.pdf"`);
      res.setHeader('Content-Length', downloadResult.data.length.toString());
      res.send(downloadResult.data);
    } catch (error) {
      console.error('PDF export error:', error);
      res.status(500).json({
        message: 'Failed to export PDF',
        messageAr: 'فشل تصدير PDF'
      });
    }
  });

  // Update order status (admin only)
  app.patch("/api/admin/orders/:id/status", requireAdmin, async (req: AdminRequest, res) => {
    try {
      const { status, notes } = req.body;
      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Get current order to track previous status
      const currentOrder = await storage.getOrder(req.params.id);
      if (!currentOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      const previousStatus = currentOrder.status;

      // Update order status
      const order = await storage.updateOrderStatus(req.params.id, status);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Create order history entry (only if status actually changed)
      if (previousStatus !== status) {
        await storage.createOrderHistory({
          orderId: req.params.id,
          status: status,
          changedBy: req.user!.id,
          notes: notes || null,
          isAdminNote: true,
        });
      }

      // Get the order details for notification
      const fullOrder = await db.query.orders.findFirst({
        where: eq(orders.id, req.params.id),
      });

      if (fullOrder) {
        const statusMessages: Record<string, { en: string; ar: string }> = {
          confirmed: { en: "Order confirmed and being processed", ar: "تم تأكيد الطلب وجاري معالجته" },
          processing: { en: "Order is now being processed", ar: "جاري معالجة الطلب" },
          shipped: { en: "Order has been shipped", ar: "تم شحن الطلب" },
          delivered: { en: "Order delivered successfully", ar: "تم توصيل الطلب بنجاح" },
          cancelled: { en: "Order has been cancelled", ar: "تم إلغاء الطلب" },
          pending: { en: "Status updated to pending", ar: "تم تحديث الحالة إلى قيد الانتظار" },
        };

        // Send notification for status change (only if status actually changed)
        if (previousStatus !== status) {
          await storage.createNotification({
            clientId: fullOrder.clientId,
            type: 'order_status_changed',
            titleEn: statusMessages[status]?.en || 'Order status updated',
            titleAr: statusMessages[status]?.ar || 'تم تحديث حالة الطلب',
            messageEn: `Order #${fullOrder.id.substring(0, 8)} status updated`,
            messageAr: `تم تحديث حالة الطلب #${fullOrder.id.substring(0, 8)}`,
            actionUrl: `/orders`,
            metadata: JSON.stringify({
              orderId: fullOrder.id,
              status,
              previousStatus,
              timestamp: new Date().toISOString(),
            }),
          });
        }

        // Send feedback request notification if order is delivered
        if (status === 'delivered') {
          // Check if feedback already exists
          const existingFeedback = await db
            .select()
            .from(orderFeedback)
            .where(eq(orderFeedback.orderId, fullOrder.id))
            .limit(1);

          if (existingFeedback.length === 0) {
            // Send feedback request notification after 5 seconds (configurable)
            setTimeout(async () => {
              await storage.createNotification({
                clientId: fullOrder.clientId,
                type: 'feedback_request',
                titleEn: 'How was your order?',
                titleAr: 'كيف كان طلبك؟',
                messageEn: 'Share your experience to help us improve',
                messageAr: 'شارك تجربتك لمساعدتنا على التحسين',
                actionUrl: `/orders?feedback=${fullOrder.id}`,
                metadata: JSON.stringify({
                  orderId: fullOrder.id,
                  type: 'feedback_request',
                }),
              });

              // Send push notification if client has subscribed
              const subscriptions = await storage.getPushSubscriptions(fullOrder.clientId);
              if (subscriptions.length > 0) {
                const payload = JSON.stringify({
                  title: 'How was your order?',
                  body: 'Share your experience to help us improve',
                  icon: '/icon-192.png',
                  badge: '/icon-192.png',
                  data: {
                    url: `/orders?feedback=${fullOrder.id}`,
                  },
                });

                for (const subscription of subscriptions) {
                  try {
                    await webpush.sendNotification(subscription, payload);
                  } catch (error: any) {
                    if (error.statusCode === 404 || error.statusCode === 410) {
                      await storage.deletePushSubscription(subscription.endpoint);
                    }
                  }
                }
              }
            }, 3600000); // 1 hour delay (production-ready timing)
          }
        }

        // Send push notification
        try {
          const subscriptions = await storage.getPushSubscriptions(fullOrder.clientId);
          const notificationMessage = status === 'delivered'
            ? 'Your order has been delivered! Share your feedback.'
            : statusMessages[status as keyof typeof statusMessages]?.en || 'Order status updated';

          const payload = JSON.stringify({
            title: status === 'delivered' ? 'Order Delivered' : 'Order Status Update',
            body: notificationMessage,
            url: '/orders',
            tag: 'order-status',
          });

          await Promise.allSettled(
            subscriptions.map(async (sub: PushSubscription) => {
              try {
                await webpush.sendNotification({
                  endpoint: sub.endpoint,
                  keys: sub.keys as { p256dh: string; auth: string },
                }, payload);
              } catch (error: any) {
                if (error.statusCode === 410 || error.statusCode === 404) {
                  await storage.deletePushSubscription(sub.endpoint);
                }
              }
            })
          );
        } catch (error) {
          console.error('Error sending push notification:', error);
        }

        // Document generation removed - now manual only via admin UI
      }

      res.json(order);
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Admin Product Management Routes
  // Get product by SKU (public for SEO)
  app.get("/api/products/sku/:sku", async (req, res) => {
    try {
      const { sku } = req.params;
      const allProducts = await storage.getProducts();
      const product = allProducts.find(p => p.sku === sku);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // If user is authenticated, include pricing info
      if (req.user?.id) {
        const clientId = req.user.id;
        const clientLtas = await storage.getClientLtas(clientId);
        const ltaIds = clientLtas.map(lta => lta.id);
        const ltaProducts = await storage.getLtaProducts(ltaIds);

        const ltaProduct = ltaProducts.find(lp => lp.productId === product.id);

        return res.json({
          ...product,
          contractPrice: ltaProduct?.contractPrice,
          currency: ltaProduct?.currency,
          ltaId: ltaProduct?.ltaId,
          hasPrice: !!ltaProduct,
        });
      }

      // Public view without pricing
      return res.json({
        ...product,
        hasPrice: false,
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get product by subcategory and name (public for SEO with new URL structure)
  app.get("/api/products/:subCategory/:productName", async (req, res) => {
    try {
      const { productName } = req.params;
      const allProducts = await storage.getProducts();

      // Find product by matching slugified name
      const product = allProducts.find(p => {
        const slugifiedName = p.nameEn.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        return slugifiedName === productName;
      });

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // If user is authenticated, include pricing info
      if (req.user?.id) {
        const clientId = req.user.id;
        const clientLtas = await storage.getClientLtas(clientId);
        const ltaIds = clientLtas.map(lta => lta.id);
        const ltaProducts = await storage.getLtaProducts(ltaIds);

        const ltaProduct = ltaProducts.find(lp => lp.productId === product.id);

        return res.json({
          ...product,
          contractPrice: ltaProduct?.contractPrice,
          currency: ltaProduct?.currency,
          ltaId: ltaProduct?.ltaId,
          hasPrice: !!ltaProduct,
        });
      }

      // Public view without pricing
      return res.json({
        ...product,
        hasPrice: false,
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get products by category (public for SEO)
  app.get("/api/products/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const allProducts = await storage.getProducts();
      const categoryProducts = allProducts.filter(p => p.category === category);

      if (req.user?.id) {
        const clientId = req.user.id;
        const clientLtas = await storage.getClientLtas(clientId);
        const ltaIds = clientLtas.map(lta => lta.id);
        const ltaProducts = await storage.getLtaProducts(ltaIds);

        const productsWithPricing = categoryProducts.map(product => {
          const ltaProduct = ltaProducts.find(lp => lp.productId === product.id);
          return {
            ...product,
            contractPrice: ltaProduct?.contractPrice,
            currency: ltaProduct?.currency,
            ltaId: ltaProduct?.ltaId,
            hasPrice: !!ltaProduct,
          };
        });

        return res.json(productsWithPricing);
      }

      const productsWithoutPricing = categoryProducts.map(p => ({
        ...p,
        hasPrice: false,
      }));

      res.json(productsWithoutPricing);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get all products (public for catalog) - with caching
  app.get("/api/products/public", async (req, res) => {
    try {
      // Set cache headers for better performance
      res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes

      const allProducts = await storage.getProducts();

      // Optimize response by only sending necessary fields
      const productsWithoutPricing = allProducts.map(p => ({
        id: p.id,
        sku: p.sku,
        nameEn: p.nameEn,
        nameAr: p.nameAr,
        descriptionEn: p.descriptionEn,
        descriptionAr: p.descriptionAr,
        mainCategory: p.mainCategory,
        category: p.category,
        unitType: p.unitType,
        imageUrl: p.imageUrl,
        hasPrice: false,
      }));

      res.json(productsWithoutPricing);
    } catch (error) {
      console.error('Error fetching public products:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get all products for admin (no LTA filtering)
  app.get("/api/products/all", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const allProducts = await storage.getProducts();
      res.json(allProducts);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/products", requireAdmin, async (req: any, res) => {
    try {
      const validatedData = createProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء إنشاء المنتج",
      });
    }
  });

  app.put("/api/products/:id", requireAdmin, async (req: any, res) => {
    try {
      const validatedData = updateProductSchema.parse(req.body);
      const product = await storage.updateProduct(req.params.id, validatedData);
      if (!product) {
        return res.status(404).json({
          message: "Product not found",
          messageAr: "المنتج غير موجود",
        });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء تحديث المنتج",
      });
    }
  });

  app.delete("/api/products/:id", requireAdmin, async (req: any, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء حذف المنتج",
      });
    }
  });

  // Price Import Route
  app.post("/api/client/import-prices", requireAuth, uploadMemory.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No file uploaded",
          messageAr: "لم يتم تحميل أي ملف",
        });
      }

      const fileContent = req.file.buffer.toString('utf-8');
      const lines = fileContent.split('\n').filter((line: string) => line.trim());

      // Skip header line
      const dataLines = lines.slice(1);
      const pricingData = [];
      const errors: Array<{ line: number; message: string; messageAr: string }> = [];

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];
        const [sku, price, currency] = line.split(',').map((s: string) => s.trim());

        if (!sku || !price) {
          errors.push({
            line: i + 2,
            message: `Missing SKU or price`,
            messageAr: `SKU أو السعر مفقود`,
          });
          continue;
        }

        try {
          const validated = priceImportRowSchema.parse({ sku, price, currency });
          pricingData.push({ sku: validated.sku, price: validated.price, currency: validated.currency });
        } catch (parseError) {
          if (parseError instanceof z.ZodError) {
            errors.push({
              line: i + 2,
              message: parseError.errors[0]?.message || "Invalid format",
              messageAr: "تنسيق غير صالح",
            });
          }
        }
      }

      const importedCount = await storage.bulkImportPricing(req.client.id, pricingData);

      res.json({
        message: `Successfully imported ${importedCount} prices`,
        messageAr: `تم استيراد ${importedCount} سعر بنجاح`,
        imported: importedCount,
        total: dataLines.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء استيراد الأسعار",
      });
    }
  });

  // Document Template Management (Admin)
  app.get("/api/admin/templates", requireAdmin, async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const templates = await TemplateStorage.getTemplates(category);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/admin/templates/:id", requireAdmin, async (req, res) => {
    try {
      const template = await TemplateStorage.getTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/admin/templates", requireAdmin, async (req, res) => {
    try {
      const validatedData = createTemplateSchema.parse(req.body);
      const template = await TemplateStorage.createTemplate(validatedData);
      res.json(template);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Invalid data' });
    }
  });

  app.put("/api/admin/templates/:id", requireAdmin, async (req, res) => {
    try {
      const validatedData = updateTemplateSchema.parse(req.body);
      const template = await TemplateStorage.updateTemplate(req.params.id, validatedData);
      res.json(template);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Invalid data' });
    }
  });

  app.delete("/api/admin/templates/:id", requireAdmin, async (req, res) => {
    try {
      await TemplateStorage.deleteTemplate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Template duplicate
  app.post("/api/admin/templates/:id/duplicate", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const duplicate = await TemplateStorage.duplicateTemplate(id, name);
      res.json(duplicate);
    } catch (error: any) {
      log("Template duplication error:", error);
      res.status(500).json({
        message: "Failed to duplicate template",
        messageAr: "فشل نسخ القالب"
      });
    }
  });

  // Template import
  app.post("/api/admin/templates/import", requireAdmin, uploadMemory.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No file uploaded",
          messageAr: "لم يتم تحميل أي ملف",
        });
      }

      const fileContent = req.file.buffer.toString('utf-8');
      let templateData;

      try {
        templateData = JSON.parse(fileContent);
      } catch (parseError) {
        return res.status(400).json({
          message: "Invalid JSON format",
          messageAr: "تنسيق JSON غير صالح",
        });
      }

      // Handle both single template and array of templates
      const templates = Array.isArray(templateData) ? templateData : [templateData];
      const results = { success: 0, errors: [] as string[] };

      for (const template of templates) {
        try {
          // Validate template structure
          const validated = createTemplateSchema.parse(template);
          await TemplateStorage.createTemplate(validated);
          results.success++;
        } catch (error: any) {
          const errorMsg = `Template "${template.nameEn || 'unknown'}": ${error.message}`;
          results.errors.push(errorMsg);
          log("Template import error:", errorMsg);
        }
      }

      res.json(results);
    } catch (error: any) {
      log("Template import error:", error);
      res.status(500).json({
        message: error.message || "Failed to import templates",
        messageAr: "فشل استيراد القوالب",
      });
    }
  });


  // Order Templates Routes (User cart templates)
  app.get("/api/client/templates", requireAuth, async (req: any, res) => {
    try {
      const templates = await storage.getOrderTemplates(req.client.id);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/client/templates/:id", requireAuth, async (req: any, res) => {
    try {
      const template = await storage.getOrderTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({
          message: "Template not found",
          messageAr: "القالب غير موجود",
        });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/client/templates", requireAuth, async (req: any, res) => {
    try {
      const validatedData = saveTemplateSchema.parse(req.body);
      const template = await storage.createOrderTemplate({
        clientId: req.client.id,
        nameEn: validatedData.nameEn,
        nameAr: validatedData.nameAr,
        items: JSON.stringify(validatedData.items),
      });
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete("/api/client/templates/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteOrderTemplate(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Orders Routes
  app.get("/api/client/orders", requireAuth, async (req: any, res) => {
    try {
      const orders = await storage.getOrders(req.client.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/client/orders", requireAuth, async (req: any, res) => {
    try {
      // Validate request body with schema
      const validatedData = createOrderSchema.parse(req.body);

      // Step 1: Extract and validate ltaId from items
      const ltaIds = Array.from(new Set(validatedData.items.map(item => item.ltaId).filter(Boolean)));
      if (ltaIds.length === 0) {
        errorLogger.logWarning('Order creation attempted without LTA', {
          route: '/api/client/orders',
          userId: req.client.id,
          requestBody: { itemCount: validatedData.items.length }
        });
        return res.status(400).json({
          message: 'Order must include LTA information',
          messageAr: 'يجب أن يتضمن الطلب معلومات الاتفاقية',
        });
      }
      if (ltaIds.length > 1) {
        return res.status(400).json({
          message: 'All items must be from the same LTA',
          messageAr: 'يجب أن تكون جميع العناصر من نفس الاتفاقية',
        });
      }
      const ltaId = ltaIds[0];

      // Step 2: Validate client is assigned to this LTA
      const clientLtas = await storage.getClientLtas(req.client.id);
      const clientLta = clientLtas.find(lta => lta.id === ltaId);

      if (!clientLta) {
        return res.status(403).json({
          message: 'You are not authorized to order from this LTA',
          messageAr: 'أنت غير مخول بالطلب من هذه الاتفاقية',
        });
      }

      // Validate LTA status and dates
      if (clientLta.status !== 'active') {
        return res.status(400).json({
          message: 'This LTA is not active',
          messageAr: 'هذه الاتفاقية غير نشطة',
        });
      }

      const now = new Date();
      if (new Date(clientLta.startDate) > now) {
        return res.status(400).json({
          message: 'This LTA has not started yet',
          messageAr: 'لم تبدأ هذه الاتفاقية بعد',
        });
      }

      if (new Date(clientLta.endDate) < now) {
        return res.status(400).json({
          message: 'This LTA has expired',
          messageAr: 'انتهت صلاحية هذه الاتفاقية',
        });
      }

      // Step 3: Get LTA products with pricing and validate
      const ltaProducts = await storage.getProductsForLta(ltaId);
      
      // Create a map of productId -> pricing info
      const ltaProductMap = new Map(
        ltaProducts
          .filter(p => p.contractPrice) // Only include products with pricing
          .map(p => [p.id, { 
            price: p.contractPrice!, 
            currency: p.currency || 'ILS', 
            nameEn: p.nameEn, 
            nameAr: p.nameAr 
          }])
      );

      // Validate each item against LTA products and pricing
      let totalAmount = 0;
      const validatedItems: CartItem[] = [];

      for (const item of validatedData.items) {
        // Check product exists in LTA
        if (!ltaProductMap.has(item.productId)) {
          return res.status(400).json({
            message: `Product ${item.sku} is not available in this LTA`,
            messageAr: `المنتج ${item.sku} غير متاح في هذه الاتفاقية`,
          });
        }

        // Validate price matches LTA contract price
        const ltaProductInfo = ltaProductMap.get(item.productId)!;
        if (item.price !== ltaProductInfo.price) {
          return res.status(400).json({
            message: `Invalid price for product ${item.sku}`,
            messageAr: `سعر غير صحيح للمنتج ${item.sku}`,
          });
        }

        // Calculate total using LTA price
        const actualPrice = parseFloat(ltaProductInfo.price);
        const itemTotal = actualPrice * item.quantity;
        totalAmount += itemTotal;

        // Create validated item with complete data
        validatedItems.push({
          productId: item.productId,
          nameEn: ltaProductInfo.nameEn,
          nameAr: ltaProductInfo.nameAr,
          sku: item.sku,
          quantity: item.quantity,
          price: ltaProductInfo.price,
          ltaId: item.ltaId,
          currency: ltaProductInfo.currency,
        });
      }

      // Step 4: Create order with ltaId
      const order = await storage.createOrder({
        clientId: req.client.id,
        items: JSON.stringify(validatedItems),
        totalAmount: totalAmount.toFixed(2),
        status: validatedData.status || 'pending',
        pipefyCardId: validatedData.pipefyCardId,
        ltaId, // Include ltaId in order
      });

      const client = await storage.getClient(req.client.id);

      // Send to Pipefy webhook if configured
      let finalOrder = order;
      if (process.env.PIPEFY_WEBHOOK_URL) {
        try {
          const pipefyResponse = await fetch(process.env.PIPEFY_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: order.id,
              client_id: order.clientId,
              client_name_en: client?.nameEn,
              client_name_ar: client?.nameAr,
              items: validatedItems,
              total_amount: order.totalAmount,
              lta_id: order.ltaId,
              created_at: order.createdAt,
            }),
          });

          if (pipefyResponse.ok) {
            const pipefyData = await pipefyResponse.json();
            if (pipefyData.card_id) {
              // Update order with Pipefy card ID
              finalOrder = await storage.createOrder({
                ...order,
                pipefyCardId: pipefyData.card_id,
              });
            }
          }
        } catch (pipefyError: any) {
          console.error('Pipefy webhook error:', pipefyError);
          // Continue even if Pipefy fails - order is already created
        }
      }

      // Create in-app notification
      try {
        await storage.createNotification({
          clientId: req.client.id,
          type: 'order_created',
          titleEn: 'Order Placed Successfully',
          titleAr: 'تم تقديم الطلب بنجاح',
          messageEn: `Your order #${finalOrder.id.substring(0, 8)} has been placed successfully. Total: ${finalOrder.totalAmount} ${validatedItems[0]?.currency || 'USD'}`,
          messageAr: `تم تقديم طلبك #${finalOrder.id.substring(0, 8)} بنجاح. المجموع: ${finalOrder.totalAmount} ${validatedItems[0]?.currency || 'USD'}`,
          metadata: JSON.stringify({ orderId: finalOrder.id }),
        });
      } catch (notifError: any) {
        console.error('Error creating notification:', notifError);
      }

      // Trigger document generation for order placed
      // Document generation removed - now manual only via admin UI

      res.status(201).json(finalOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorLogger.logWarning('Order validation failed', {
          route: '/api/client/orders',
          userId: req.client?.id,
          validationErrors: error.errors
        });
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }

      errorLogger.logError(error as Error, {
        route: '/api/client/orders',
        userId: req.client?.id,
        requestBody: req.body
      });

      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء إنشاء الطلب",
      });
    }
  });

  // Notifications Routes
  app.get("/api/client/notifications", requireAuth, async (req: any, res) => {
    try {
      const notifications = await storage.getClientNotifications(req.client.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/client/notifications/unread-count", requireAuth, async (req: any, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.client.id);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.patch("/api/client/notifications/:id/read", requireAuth, async (req: any, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      if (!notification) {
        return res.status(404).json({
          message: "Notification not found",
          messageAr: "الإشعار غير موجود",
        });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.patch("/api/client/notifications/mark-all-read", requireAuth, async (req: any, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.client.id);
      res.json({
        message: "All notifications marked as read",
        messageAr: "تم وضع علامة مقروء على جميع الإشعارات",
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete("/api/client/notifications/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Client LTA Routes - Get LTAs assigned to client
  app.get('/api/client/ltas', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ltas = await storage.getClientLtas(req.client.id);
      res.json(ltas);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء جلب الاتفاقيات"
      });
    }
  });

  // Client LTA Products - Get products for a specific LTA
  app.get('/api/ltas/:ltaId/products', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Verify client has access to this LTA
      const clientLtas = await storage.getClientLtas(req.client.id);
      const hasAccess = clientLtas.some(lta => lta.id === req.params.ltaId);

      if (!hasAccess) {
        return res.status(403).json({
          message: "You don't have access to this LTA",
          messageAr: "ليس لديك صلاحية الوصول لهذه الاتفاقية"
        });
      }

      const products = await storage.getProductsForLta(req.params.ltaId);
      res.json(products);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء جلب المنتجات"
      });
    }
  });

  // LTA Management Endpoints (Admin)
  app.post('/api/admin/ltas', requireAdmin, async (req: any, res) => {
    try {
      const validatedData = insertLtaSchema.parse(req.body);
      const lta = await storage.createLta(validatedData);
      res.status(201).json({
        ...lta,
        message: "LTA created successfully",
        messageAr: "تم إنشاء الاتفاقية طويلة الأجل بنجاح"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق"
        });
      }
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء إنشاء الاتفاقية"
      });
    }
  });

  app.get('/api/admin/ltas', requireAdmin, async (req: any, res) => {
    try {
      const ltas = await storage.getAllLtas();
      res.json(ltas);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء جلب الاتفاقيات"
      });
    }
  });

  app.get('/api/admin/ltas/:id', requireAdmin, async (req: any, res) => {
    try {
      const lta = await storage.getLta(req.params.id);
      if (!lta) {
        return res.status(404).json({
          message: "LTA not found",
          messageAr: "الاتفاقية غير موجودة"
        });
      }
      res.json(lta);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء جلب الاتفاقية"
      });
    }
  });

  app.patch('/api/admin/ltas/:id', requireAdmin, async (req: any, res) => {
    try {
      const validatedData = insertLtaSchema.partial().parse(req.body);
      const lta = await storage.updateLta(req.params.id, validatedData);
      if (!lta) {
        return res.status(404).json({
          message: "LTA not found",
          messageAr: "الاتفاقية غير موجودة"
        });
      }
      res.json({
        ...lta,
        message: "LTA updated successfully",
        messageAr: "تم تحديث الاتفاقية بنجاح"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق"
        });
      }
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء تحديث الاتفاقية"
      });
    }
  });

  app.delete('/api/admin/ltas/:id', requireAdmin, async (req: any, res) => {
    try {
      const orders = await storage.getOrders(req.params.id);
      const ltaOrders = orders.filter(order => order.ltaId === req.params.id);

      if (ltaOrders.length > 0) {
        return res.status(400).json({
          message: "Cannot delete LTA with existing orders",
          messageAr: "لا يمكن حذف الاتفاقية التي تحتوي على طلبات موجودة"
        });
      }

      const deleted = await storage.deleteLta(req.params.id);
      if (!deleted) {
        return res.status(404).json({
          message: "LTA not found",
          messageAr: "الاتفاقية غير موجودة"
        });
      }

      res.json({
        message: "LTA deleted successfully",
        messageAr: "تم حذف الاتفاقية بنجاح"
      });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء حذف الاتفاقية"
      });
    }
  });

  // LTA Products Endpoints (Admin)
  app.post('/api/admin/ltas/:ltaId/products', requireAdmin, async (req: any, res) => {
    try {
      const validatedData = insertLtaProductSchema.parse({
        ltaId: req.params.ltaId,
        ...req.body
      });
      const ltaProduct = await storage.assignProductToLta(validatedData);

      // Notify client if clientId is provided (from price request)
      if (req.body.clientId) {
        try {
          const product = await storage.getProduct(validatedData.productId);
          const lta = await storage.getLta(req.params.ltaId);

          if (product && lta) {
            await storage.createNotification({
              clientId: req.body.clientId,
              type: 'price_assigned',
              titleEn: 'Price Offer Ready',
              titleAr: 'عرض السعر جاهز',
              messageEn: `Your price request for ${product.nameEn} has been processed. Price: ${validatedData.contractPrice} ${validatedData.currency}`,
              messageAr: `تمت معالجة طلب السعر الخاص بـ ${product.nameAr}. السعر: ${validatedData.contractPrice} ${validatedData.currency}`,
              metadata: JSON.stringify({
                productId: product.id,
                sku: product.sku,
                ltaId: lta.id,
                ltaNameEn: lta.nameEn,
                ltaNameAr: lta.nameAr,
                contractPrice: validatedData.contractPrice,
                currency: validatedData.currency,
              }),
            });
          }
        } catch (notifError) {
          console.error('Error creating price assignment notification:', notifError);
          // Don't fail the request if notification fails
        }
      }

      res.status(201).json({
        ...ltaProduct,
        message: "Product assigned to LTA successfully",
        messageAr: "تم تعيين المنتج للاتفاقية بنجاح"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق"
        });
      }
      if (error instanceof Error ? error.message : 'Unknown error'?.includes('duplicate') || error instanceof Error ? error.message : 'Unknown error'?.includes('unique')) {
        return res.status(409).json({
          message: "Product already assigned to this LTA",
          messageAr: "المنتج مُعيّن بالفعل لهذه الاتفاقية"
        });
      }
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء تعيين المنتج"
      });
    }
  });

  app.delete('/api/admin/ltas/:ltaId/products/:productId', requireAdmin, async (req: any, res) => {
    try {
      const removed = await storage.removeProductFromLta(req.params.ltaId, req.params.productId);
      if (!removed) {
        return res.status(404).json({
          message: "Product assignment not found",
          messageAr: "تعيين المنتج غير موجود"
        });
      }
      res.json({
        message: "Product removed from LTA successfully",
        messageAr: "تم إزالة المنتج من الاتفاقية بنجاح"
      });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء إزالة المنتج"
      });
    }
  });

  app.get('/api/admin/ltas/:ltaId/products', requireAdmin, async (req: any, res) => {
    try {
      const products = await storage.getProductsForLta(req.params.ltaId);
      res.json(products);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء جلب منتجات الاتفاقية"
      });
    }
  });

  app.patch('/api/admin/lta-products/:id', requireAdmin, async (req: any, res) => {
    try {
      const { contractPrice, currency } = req.body;
      if (!contractPrice) {
        return res.status(400).json({
          message: "Contract price is required",
          messageAr: "سعر العقد مطلوب"
        });
      }
      const ltaProduct = await storage.updateLtaProductPrice(req.params.id, contractPrice, currency);
      if (!ltaProduct) {
        return res.status(404).json({
          message: "LTA product not found",
          messageAr: "منتج الاتفاقية غير موجود"
        });
      }
      res.json({
        ...ltaProduct,
        message: "Product pricing updated successfully",
        messageAr: "تم تحديث سعر المنتج بنجاح"
      });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء تحديث السعر"
      });
    }
  });

  // Bulk assign products to LTA
  app.post('/api/admin/ltas/:ltaId/products/bulk', requireAdmin, async (req: any, res) => {
    try {
      const { ltaId } = req.params;
      const result = bulkAssignProductsSchema.safeParse({ ltaId, ...req.body });

      if (!result.success) {
        return res.status(400).json({
          message: 'Invalid data',
          messageAr: 'بيانات غير صالحة',
          errors: result.error.errors,
        });
      }

      const assignmentResult = await storage.bulkAssignProductsToLta(ltaId, result.data.products);

      return res.status(200).json({
        message: `Successfully assigned ${assignmentResult.success} products`,
        messageAr: `تم تعيين ${assignmentResult.success} منتجات بنجاح`,
        ...assignmentResult,
      });
    } catch (error) {
      console.error('Bulk assign products error:', error);
      return res.status(500).json({
        message: 'Failed to assign products',
        messageAr: 'فشل تعيين المنتجات',
      });
    }
  });

  // LTA Clients Endpoints (Admin)
  app.post('/api/admin/ltas/:ltaId/clients', requireAdmin, async (req: any, res) => {
    try {
      const validatedData = insertLtaClientSchema.parse({
        ltaId: req.params.ltaId,
        ...req.body
      });
      const ltaClient = await storage.assignClientToLta(validatedData);
      res.status(201).json({
        ...ltaClient,
        message: "Client assigned to LTA successfully",
        messageAr: "تم تعيين العميل للاتفاقية بنجاح"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق"
        });
      }
      if (error instanceof Error ? error.message : 'Unknown error'?.includes('duplicate') || error instanceof Error ? error.message : 'Unknown error'?.includes('unique')) {
        return res.status(409).json({
          message: "Client already assigned to this LTA",
          messageAr: "العميل مُعيّن بالفعل لهذه الاتفاقية"
        });
      }
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء تعيين العميل"
      });
    }
  });

  app.delete('/api/admin/ltas/:ltaId/clients/:clientId', requireAdmin, async (req: any, res) => {
    try {
      const removed = await storage.removeClientFromLta(req.params.ltaId, req.params.clientId);
      if (!removed) {
        return res.status(404).json({
          message: "Client assignment not found",
          messageAr: "تعيين العميل غير موجود"
        });
      }
      res.json({
        message: "Client removed from LTA successfully",
        messageAr: "تم إزالة العميل من الاتفاقية بنجاح"
      });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء إزالة العميل"
      });
    }
  });

  app.get('/api/admin/ltas/:ltaId/clients', requireAdmin, async (req: any, res) => {
    try {
      const clients = await storage.getClientsForLta(req.params.ltaId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء جلب عملاء الاتفاقية"
      });
    }
  });

  // Get all LTA assignments (for admin price request page)
  app.get('/api/admin/lta-assignments', requireAdmin, async (req: any, res) => {
    try {
      const ltas = await storage.getAllLtas();
      const assignments = {
        ltaClients: [] as Array<{ ltaId: string; clientId: string }>,
        ltaProducts: [] as Array<{ ltaId: string; productId: string; contractPrice: string; currency: string }>
      };

      // Fetch all LTA-client and LTA-product mappings
      for (const lta of ltas) {
        // Get clients for this LTA
        const clients = await storage.getLtaClients(lta.id);
        assignments.ltaClients.push(...clients.map(c => ({ ltaId: lta.id, clientId: c.clientId })));

        // Get products for this LTA
        const products = await storage.getProductsForLta(lta.id);
        assignments.ltaProducts.push(...products.map(p => ({
          ltaId: lta.id,
          productId: p.id,
          contractPrice: p.contractPrice || '',
          currency: p.currency || 'USD'
        })));
      }

      res.json(assignments);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء جلب تعيينات الاتفاقيات"
      });
    }
  });

  // LTA Documents Endpoints (Admin)
  app.post('/api/admin/ltas/:ltaId/documents', requireAdmin, uploadDocument.single('document'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No document file uploaded",
          messageAr: "لم يتم تحميل ملف المستند"
        });
      }

      const { nameEn, nameAr } = req.body;
      if (!nameEn || !nameAr) {
        return res.status(400).json({
          message: "Document name (English and Arabic) is required",
          messageAr: "اسم المستند (بالإنجليزية والعربية) مطلوب"
        });
      }

      const fileUrl = `/attached_assets/documents/${req.file.filename}`;
      const document = await storage.createLtaDocument({
        ltaId: req.params.ltaId,
        nameEn,
        nameAr,
        fileName: req.file.originalname,
        fileUrl,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        uploadedBy: req.client.id,
      });

      res.status(201).json({
        ...document,
        message: "Document uploaded successfully",
        messageAr: "تم تحميل المستند بنجاح"
      });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء تحميل المستند"
      });
    }
  });

  app.get('/api/admin/ltas/:ltaId/documents', requireAdmin, async (req: any, res) => {
    try {
      const documents = await storage.getLtaDocuments(req.params.ltaId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء جلب المستندات"
      });
    }
  });

  app.delete('/api/admin/ltas/:ltaId/documents/:documentId', requireAdmin, async (req: any, res) => {
    try {
      const document = await storage.getLtaDocument(req.params.documentId);
      if (!document) {
        return res.status(404).json({
          message: "Document not found",
          messageAr: "المستند غير موجود"
        });
      }

      // Delete file from disk - normalize absolute URL to local path
      const relativePath = document.fileUrl.startsWith('/')
        ? document.fileUrl.slice(1)
        : document.fileUrl;
      const filePath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const deleted = await storage.deleteLtaDocument(req.params.documentId);
      if (!deleted) {
        return res.status(404).json({
          message: "Document not found",
          messageAr: "المستند غير موجود"
        });
      }

      res.json({
        message: "Document deleted successfully",
        messageAr: "تم حذف المستند بنجاح"
      });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء حذف المستند"
      });
    }
  });

  // Document Search and Management (Admin)
  app.get('/api/admin/documents/search', requireAdmin, async (req: any, res) => {
    try {
      const { documentType, clientId, ltaId, startDate, endDate, searchTerm } = req.query;

      const filters: any = {};
      if (documentType) filters.documentType = documentType;
      if (clientId) filters.clientId = clientId;
      if (ltaId) filters.ltaId = ltaId;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (searchTerm) filters.searchTerm = searchTerm;

      const documents = await storage.searchDocuments(filters);
      res.json(documents);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "خطأ في البحث عن المستندات"
      });
    }
  });

  app.get('/api/admin/documents/:id', requireAdmin, async (req: any, res) => {
    try {
      const document = await storage.getDocumentById(req.params.id);
      if (!document) {
        return res.status(404).json({
          message: "Document not found",
          messageAr: "المستند غير موجود"
        });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "خطأ في جلب المستند"
      });
    }
  });

  app.patch('/api/admin/documents/:id/metadata', requireAdmin, async (req: any, res) => {
    try {
      const { metadata } = req.body;
      const document = await storage.updateDocumentMetadata(req.params.id, { metadata });
      res.json(document);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "خطأ في تحديث المستند"
      });
    }
  });

  // Generate secure download token for PDF
  app.post('/api/pdf/generate-token/:documentId', requireAuth, async (req: any, res) => {
    try {
      const { PDFAccessControl } = await import('./pdf-access-control');
      const documentId = req.params.documentId;

      // Check access permission
      const { allowed, reason } = await PDFAccessControl.canAccessDocument(
        documentId,
        req.client.id,
        req.client.isAdmin
      );

      if (!allowed) {
        return res.status(403).json({
          message: reason || "Access denied",
          messageAr: "الوصول مرفوض"
        });
      }

      const token = PDFAccessControl.generateDownloadToken(documentId, req.client.id);

      // Log token generation
      await PDFAccessControl.logDocumentAccess({
        documentId,
        clientId: req.client.id,
        action: 'view',
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      res.json({ token, expiresIn: '2 hours' });
    } catch (error) {
      console.error('Token generation error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "فشل إنشاء رمز التنزيل"
      });
    }
  });

  // Download PDF from Object Storage with token verification
  app.get('/api/pdf/download/:fileName(*)', async (req: any, res) => {
    try {
      const { PDFAccessControl } = await import('./pdf-access-control');
      const fileName = req.params.fileName;
      const token = req.query.token as string;

      if (!fileName) {
        return res.status(400).json({
          message: "File name is required",
          messageAr: "اسم الملف مطلوب"
        });
      }

      if (!token) {
        return res.status(401).json({
          message: "Download token required",
          messageAr: "رمز التنزيل مطلوب"
        });
      }

      // Verify token
      const verification = PDFAccessControl.verifyDownloadToken(token);
      if (!verification.valid) {
        return res.status(401).json({
          message: verification.error || "Invalid or expired token",
          messageAr: "رمز غير صالح أو منتهي الصلاحية"
        });
      }

      const downloadResult = await PDFStorage.downloadPDF(fileName);

      if (!downloadResult.ok || !downloadResult.data) {
        console.error('PDF download failed:', fileName, 'Error:', downloadResult.error);
        return res.status(404).json({
          message: "PDF not found or corrupted",
          messageAr: "لم يتم العثور على PDF أو الملف تالف",
          error: downloadResult.error
        });
      }

      // Extract just the filename for the download
      const displayFileName = fileName.split('/').pop() || 'document.pdf';

      // Ensure we're sending a proper Buffer
      const pdfBuffer = Buffer.isBuffer(downloadResult.data)
        ? downloadResult.data
        : Buffer.from(downloadResult.data);


      // Validate buffer has PDF header
      const pdfHeader = pdfBuffer.slice(0, 4).toString();
      if (pdfHeader !== '%PDF') {
        console.error('Downloaded file is not a valid PDF. Header:', pdfHeader);
        return res.status(500).json({
          message: "Downloaded file is not a valid PDF",
          messageAr: "الملف المحمل ليس PDF صالح"
        });
      }

      // Log download
      if (verification.documentId && verification.clientId) {
        await PDFAccessControl.logDocumentAccess({
          documentId: verification.documentId,
          clientId: verification.clientId,
          action: 'download',
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        });
      }

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      res.setHeader('Content-Disposition', `attachment; filename="${displayFileName}"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Send buffer
      res.send(pdfBuffer);
    } catch (error) {
      console.error('PDF download error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "فشل تنزيل PDF"
      });
    }
  });


  // Client LTA Endpoints
  app.get('/api/client/ltas', requireAuth, async (req: any, res) => {
    try {
      const ltas = await storage.getClientLtas(req.client.id);
      res.json(ltas);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء جلب الاتفاقيات"
      });
    }
  });

  // Client: Get documents for an assigned LTA
  app.get('/api/client/ltas/:ltaId/documents', requireAuth, async (req: any, res) => {
    try {
      const { ltaId } = req.params;
      // Ensure the requesting client is assigned to this LTA (or is admin)
      const assignedLtas = await storage.getClientLtas(req.client.id);
      const isAssigned = assignedLtas.some((l: any) => l.id === ltaId);

      if (!isAssigned && !req.client.isAdmin) {
        return res.status(403).json({
          message: 'Access denied to LTA documents',
          messageAr: 'غير مصرح بالوصول إلى مستندات الاتفاقية'
        });
      }

      const docs = await storage.getLtaDocuments(ltaId);
      res.json(docs);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: 'حدث خطأ أثناء جلب مستندات الاتفاقية'
      });
    }
  });

  // Image Upload Endpoint
  app.post('/api/admin/products/:id/image', requireAdmin, uploadImage.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No image file uploaded",
          messageAr: "لم يتم تحميل ملف الصورة"
        });
      }

      const imageUrl = `/attached_assets/products/${req.file.filename}`;
      const product = await storage.updateProduct(req.params.id, { imageUrl });

      if (!product) {
        return res.status(404).json({
          message: "Product not found",
          messageAr: "المنتج غير موجود"
        });
      }

      res.json({
        ...product,
        message: "Product image uploaded successfully",
        messageAr: "تم تحميل صورة المنتج بنجاح"
      });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء تحميل الصورة"
      });
    }
  });

  // Bulk Export Products
  app.get('/api/admin/products/export', requireAdmin, async (req: any, res) => {
    try {
      const products = await storage.getProducts();
      const vendors = await storage.getVendors();

      // Create vendor lookup map
      const vendorMap = new Map(vendors.map(v => [v.id, v.vendorNumber]));

      const csvHeader = 'SKU,Name (EN),Name (AR),Category Num,Unit Type,Unit,Unit Per Box,Cost Price Per Box,Cost Price Per Piece,Specifications (AR),Vendor Number,Main Category,Category,Selling Price Pack,Selling Price Piece,Description (EN),Description (AR),Image URL\n';
      const csvRows = products.map(p => {
        const escapeCsv = (value: string | null | undefined) => {
          if (!value) return '';
          const escaped = value.replace(/"/g, '""');
          return `"${escaped}"`;
        };

        const vendorNumber = p.vendorId ? vendorMap.get(p.vendorId) || '' : '';

        return [
          escapeCsv(p.sku),
          escapeCsv(p.nameEn),
          escapeCsv(p.nameAr),
          escapeCsv(p.categoryNum),
          escapeCsv(p.unitType),
          escapeCsv(p.unit),
          escapeCsv(p.unitPerBox),
          escapeCsv(p.costPricePerBox),
          escapeCsv(p.costPricePerPiece),
          escapeCsv(p.specificationsAr),
          escapeCsv(vendorNumber),
          escapeCsv(p.mainCategory),
          escapeCsv(p.category),
          escapeCsv(p.sellingPricePack),
          escapeCsv(p.sellingPricePiece),
          escapeCsv(p.descriptionEn),
          escapeCsv(p.descriptionAr),
          escapeCsv(p.imageUrl)
        ].join(',');
      }).join('\n');

      const csv = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="products_${Date.now()}.csv"`);
      res.send('\uFEFF' + csv); // Add BOM for Excel compatibility
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء تصدير المنتجات"
      });
    }
  });

  // Bulk Import Vendors
  app.post('/api/admin/vendors/import', requireAdmin, uploadMemory.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No CSV file uploaded",
          messageAr: "لم يتم تحميل ملف CSV"
        });
      }

      const csvContent = req.file.buffer.toString('utf-8').replace(/^\uFEFF/, ''); // Remove BOM
      const rows = csvContent.split('\n').filter((row: string) => row.trim());

      if (rows.length < 2) {
        return res.status(400).json({
          message: "CSV file is empty or invalid",
          messageAr: "ملف CSV فارغ أو غير صالح"
        });
      }

      const dataRows = rows.slice(1);

      const results = {
        success: [] as any[],
        errors: [] as any[]
      };

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row.trim()) continue;

        let values: string[] = [];
        try {
          // Parse CSV row with quote handling
          let currentValue = '';
          let inQuotes = false;

          for (let j = 0; j < row.length; j++) {
            const char = row[j];

            if (char === '"') {
              if (inQuotes && row[j + 1] === '"') {
                currentValue += '"';
                j++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              values.push(currentValue.trim());
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim());

          const [vendorNumber, nameEn, nameAr, contactEmail, contactPhone, address] = values;

          if (!vendorNumber || !nameEn || !nameAr) {
            results.errors.push({
              row: i + 2,
              vendorNumber: vendorNumber || 'N/A',
              message: 'Vendor number, English name, and Arabic name are required',
              messageAr: 'رقم المورد والاسم بالإنجليزية والاسم بالعربية مطلوبة'
            });
            continue;
          }

          // Check if vendor exists by vendor number
          const existingVendor = await storage.getVendorByNumber(vendorNumber);

          const vendorData = {
            vendorNumber,
            nameEn,
            nameAr,
            contactEmail: contactEmail || null,
            contactPhone: contactPhone || null,
            address: address || null
          };

          if (existingVendor) {
            // Update existing vendor
            const updated = await storage.updateVendor(existingVendor.id, vendorData);
            results.success.push({
              row: i + 2,
              vendorNumber,
              action: 'updated',
              actionAr: 'تم التحديث'
            });
          } else {
            // Create new vendor
            const created = await storage.createVendor(vendorData);
            results.success.push({
              row: i + 2,
              vendorNumber,
              action: 'created',
              actionAr: 'تم الإنشاء'
            });
          }
        } catch (error) {
          results.errors.push({
            row: i + 2,
            vendorNumber: values[0] || 'N/A',
            message: error instanceof Error ? error.message : 'Unknown error',
            messageAr: 'حدث خطأ أثناء معالجة الصف'
          });
        }
      }

      res.json({
        ...results,
        message: `Import completed: ${results.success.length} succeeded, ${results.errors.length} failed`,
        messageAr: `اكتمل الاستيراد: ${results.success.length} نجح، ${results.errors.length} فشل`
      });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء استيراد الموردين"
      });
    }
  });

  // Bulk Import Products
  app.post('/api/admin/products/import', requireAdmin, uploadMemory.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No CSV file uploaded",
          messageAr: "لم يتم تحميل ملف CSV"
        });
      }

      const csvContent = req.file.buffer.toString('utf-8').replace(/^\uFEFF/, ''); // Remove BOM
      const rows = csvContent.split('\n').filter((row: string) => row.trim());

      if (rows.length < 2) {
        return res.status(400).json({
          message: "CSV file is empty or invalid",
          messageAr: "ملف CSV فارغ أو غير صالح"
        });
      }

      const header = rows[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));
      const dataRows = rows.slice(1);

      const results = {
        success: [] as any[],
        errors: [] as any[],
        total: dataRows.length
      };

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row.trim()) continue;

        let values: string[] = [];
        try {
          // Parse CSV row with quote handling
          let currentValue = '';
          let inQuotes = false;

          for (let j = 0; j < row.length; j++) {
            const char = row[j];

            if (char === '"') {
              if (inQuotes && row[j + 1] === '"') {
                currentValue += '"';
                j++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              values.push(currentValue.trim());
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim());

          const [
            sku, nameEn, nameAr, categoryNum, unitType, unit, unitPerBox,
            costPricePerBox, costPricePerPiece, specificationsAr, vendorNumber,
            mainCategory, category, sellingPricePack, sellingPricePiece,
            descriptionEn, descriptionAr, imageUrl
          ] = values;

          if (!sku || !nameEn || !nameAr) {
            results.errors.push({
              row: i + 2,
              sku: sku || 'N/A',
              message: 'SKU, Name (EN), and Name (AR) are required',
              messageAr: 'رمز المنتج والاسم بالإنجليزية والاسم بالعربية مطلوبة'
            });
            continue;
          }

          // Look up vendor by vendor number
          let vendorId = null;
          if (vendorNumber) {
            const vendor = await storage.getVendorByNumber(vendorNumber);
            vendorId = vendor?.id || null;
          }

          // Check if product exists
          const existingProduct = await storage.getProductBySku(sku);

          const productData = {
            sku,
            nameEn,
            nameAr,
            categoryNum: categoryNum || null,
            unitType: unitType || null,
            unit: unit || null,
            unitPerBox: unitPerBox || null,
            costPricePerBox: costPricePerBox || null,
            costPricePerPiece: costPricePerPiece || null,
            specificationsAr: specificationsAr || null,
            vendorId,
            mainCategory: mainCategory || null,
            category: category || null,
            sellingPricePack: sellingPricePack || null,
            sellingPricePiece: sellingPricePiece || null,
            descriptionEn: descriptionEn || null,
            descriptionAr: descriptionAr || null,
            imageUrl: imageUrl || null
          };

          if (existingProduct) {
            // Update existing product
            const updated = await storage.updateProduct(existingProduct.id, productData);
            results.success.push({
              row: i + 2,
              sku,
              action: 'updated',
              actionAr: 'تم التحديث'
            });
          } else {
            // Create new product
            const created = await storage.createProduct(productData);
            results.success.push({
              row: i + 2,
              sku,
              action: 'created',
              actionAr: 'تم الإنشاء'
            });
          }
        } catch (error) {
          results.errors.push({
            row: i + 2,
            sku: values[0] || 'N/A',
            message: error instanceof Error ? error.message : 'Unknown error',
            messageAr: 'حدث خطأ أثناء معالجة الصف'
          });
        }
      }

      res.json({
        ...results,
        message: `Import completed: ${results.success.length} succeeded, ${results.errors.length} failed`,
        messageAr: `اكتمل الاستيراد: ${results.success.length} نجح، ${results.errors.length} فشل`
      });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unknown error',
        messageAr: "حدث خطأ أثناء استيراد المنتجات"
      });
    }
  });

  // Dynamic meta tags for social media crawlers
  app.get('/api/meta-tags/product/:subCategory/:productName', async (req, res) => {
    try {
      const products = await storage.getProducts();
      const product = products.find(p => {
        const slugifiedName = p.nameEn.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        return slugifiedName === req.params.productName;
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const baseUrl = process.env.BASE_URL || 'https://your-domain.com';
      const slugifiedSubCategory = (product.subCategory || 'products').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      res.json({
        title: `${product.nameEn} - Al Qadi Portal`,
        description: product.descriptionEn || product.nameEn,
        image: product.imageUrl ? `${baseUrl}${product.imageUrl}` : `${baseUrl}/logo.png`,
        url: `${baseUrl}/products/${slugifiedSubCategory}/${req.params.productName}`,
        keywords: `${product.sku}, ${product.nameEn}, ${product.nameAr}, ${product.category || 'products'}`,
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });



  // SEO Routes
  app.get('/sitemap.xml', async (_req, res) => {
    try {
      const sitemap = await generateSitemap();
      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  app.get('/robots.txt', (_req, res) => {
    const baseUrl = process.env.BASE_URL || 'https://your-domain.com';
    const robotsTxt = `User-agent: *
Allow: /
Allow: /catalog
Allow: /catalog/*
Allow: /products/*

Disallow: /admin
Disallow: /admin/*
Disallow: /api/*
Disallow: /profile
Disallow: /ordering
Disallow: /price-request

Sitemap: ${baseUrl}/sitemap.xml`;

    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });

  app.get('/feed.xml', async (_req, res) => {
    try {
      const { generateRSSFeed } = await import('./rss-feed');
      const feed = await generateRSSFeed();
      res.header('Content-Type', 'application/rss+xml');
      res.send(feed);
    } catch (error) {
      console.error('Error generating RSS feed:', error);
      res.status(500).send('Error generating RSS feed');
    }
  });

  // ======================
  // DOCUMENT API ROUTES
  // ======================

  // Generate PDF from template
  app.post('/api/documents/generate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { templateId, variables, language = 'both' } = req.body;

      if (!templateId || !variables) {
        return res.status(400).json({ error: 'Template ID and variables are required' });
      }

      // Get template
      const template = await TemplateStorage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Generate PDF
      const pdfBuffer = await TemplatePDFGenerator.generateFromTemplate(template as any, variables, language);

      // Upload to object storage
      const category = template.category.toUpperCase().replace('_', '_') as any;
      const fileName = `${template.category}-${Date.now()}.pdf`;
      const uploadResult = await PDFStorage.uploadPDF(pdfBuffer, fileName, category);

      if (!uploadResult.ok) {
        return res.status(500).json({ error: uploadResult.error });
      }

      // Create document record
      const document = await storage.createDocumentMetadata({
        documentType: template.category as any,
        fileName,
        fileUrl: uploadResult.fileName!,
        fileSize: pdfBuffer.length,
        clientId: req.user!.isAdmin ? variables.clientId : req.user!.id,
        ltaId: variables.ltaId,
        orderId: variables.orderId,
        priceOfferId: variables.priceOfferId,
        checksum: uploadResult.checksum,
        metadata: {
          templateId,
          variables,
          generatedBy: req.user!.id,
          generatedAt: new Date().toISOString()
        }
      });

      // Log generation
      await PDFAccessControl.logDocumentAccess({
        documentId: document.id,
        clientId: req.user!.id,
        action: 'generate',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        documentId: document.id,
        fileName,
        fileUrl: uploadResult.fileName
      });
    } catch (error) {
      console.error('Document generation error:', error);
      res.status(500).json({ error: 'Failed to generate document' });
    }
  });

  // Get document download token
  app.post('/api/documents/:id/token', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocumentById(id);

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Check permissions
      if (!req.user!.isAdmin && document.clientId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Generate token
      const token = PDFAccessControl.generateDownloadToken(
        id,
        req.user!.id,
        { expiresInHours: 2 }
      );

      res.json({ token });
    } catch (error) {
      console.error('Token generation error:', error);
      res.status(500).json({ error: 'Failed to generate token' });
    }
  });

  // Download document with token
  app.get('/api/documents/:id/download', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'Token is required' });
      }

      // Verify token
      const verification = PDFAccessControl.verifyDownloadToken(token);
      if (!verification.valid || verification.documentId !== id) {
        return res.status(401).json({ error: verification.error || 'Invalid token' });
      }

      // Get document
      const document = await storage.getDocumentById(id);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Download from storage
      const downloadResult = await PDFStorage.downloadPDF(document.fileUrl, document.checksum || undefined);
      if (!downloadResult.ok) {
        return res.status(500).json({ error: downloadResult.error });
      }

      // Log download
      await PDFAccessControl.logDocumentAccess({
        documentId: id,
        clientId: verification.clientId!,
        action: 'download',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Increment view count
      await storage.incrementDocumentViewCount(id);

      // Send file
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      res.send(downloadResult.data);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Failed to download document' });
    }
  });

  // List/search documents
  app.get('/api/documents', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { documentType, searchTerm, startDate, endDate } = req.query;

      const filters: any = {};

      if (documentType && typeof documentType === 'string') {
        filters.documentType = documentType;
      }

      if (searchTerm && typeof searchTerm === 'string') {
        filters.searchTerm = searchTerm;
      }

      if (startDate && typeof startDate === 'string') {
        filters.startDate = new Date(startDate);
      }

      if (endDate && typeof endDate === 'string') {
        filters.endDate = new Date(endDate);
      }

      // Non-admin users can only see their own documents
      if (!req.user!.isAdmin) {
        filters.clientId = req.user!.id;
      }

      const documents = await storage.searchDocuments(filters);

      res.json({ documents });
    } catch (error) {
      console.error('Document search error:', error);
      res.status(500).json({ error: 'Failed to search documents' });
    }
  });

  // Get document details
  app.get('/api/documents/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocumentById(id);

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Check permissions
      if (!req.user!.isAdmin && document.clientId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({ document });
    } catch (error) {
      console.error('Get document error:', error);
      res.status(500).json({ error: 'Failed to get document' });
    }
  });

  // Get document access logs
  app.get('/api/documents/:id/logs', requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const { id } = req.params;
      const logs = await storage.getDocumentAccessLogs(id);

      res.json({ logs });
    } catch (error) {
      console.error('Get logs error:', error);
      res.status(500).json({ error: 'Failed to get access logs' });
    }
  });

  // ======================
  // END DOCUMENT ROUTES
  // ======================


  // Public catalog endpoint
  app.get('/api/catalog', async (c) => {
    // Placeholder for catalog logic
    return c.json({ message: 'Catalog endpoint' });
  });

  // PDF generation endpoint
  app.post("/api/admin/generate-pdf", async (req: AdminRequest, res: Response) => {
    try {
      const { templateId, variables, language } = req.body;

      if (!templateId || !variables) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const template = await TemplateStorage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      const pdfBuffer = await TemplatePDFGenerator.generate({
        template,
        variables,
        language: language || 'en',
      });

      const fileName = `${template.nameEn.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

      // Store in object storage
      const fileUrl = await PDFStorage.savePDF(pdfBuffer, fileName);

      // Create document record
      const document = await storage.createDocument({
        fileName,
        fileUrl,
        documentType: template.category,
        fileSize: pdfBuffer.length,
        uploadedBy: req.user!.id,
      });

      res.json({
        success: true,
        documentId: document.id,
        fileUrl,
        fileName
      });
    } catch (error: any) {
      log(`PDF generation error: ${error.message}`);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Generate PDF from template with data
  app.post("/api/templates/:id/generate", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { variables, language, saveToDocuments } = req.body;

      const template = await TemplateStorage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      const pdfBuffer = await TemplatePDFGenerator.generate({
        template,
        variables: variables || [],
        language: language || 'en',
      });

      const fileName = `${template.nameEn.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

      if (saveToDocuments) {
        const fileUrl = await PDFStorage.savePDF(pdfBuffer, fileName);

        const document = await storage.createDocument({
          fileName,
          fileUrl,
          documentType: template.category,
          fileSize: pdfBuffer.length,
          uploadedBy: req.user!.id,
          clientId: req.user!.isAdmin ? undefined : req.user!.id,
        });

        return res.json({
          success: true,
          documentId: document.id,
          fileUrl,
          fileName,
        });
      }

      // Return PDF directly
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      log(`Template PDF generation error: ${error.message}`);
      res.status(500).json({ message: "Failed to generate PDF from template" });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error reporting endpoint (for client-side errors)
  app.post('/api/errors', express.json(), (req, res) => {
    try {
      const { message, stack, context, timestamp, userAgent, url } = req.body;

      console.error('[Client Error]', {
        message,
        url,
        userAgent,
        context,
        timestamp: new Date(timestamp).toISOString(),
      });

      // Log to error logger if critical
      if (context?.component || context?.action) {
        errorLogger.logError(new Error(message), {
          route: url,
          ...context,
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('[Error Reporting Failed]', error);
      res.status(500).json({ success: false });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}