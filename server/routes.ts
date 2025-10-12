import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
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
  insertLtaSchema,
  insertLtaProductSchema,
  insertLtaClientSchema,
  bulkAssignProductsSchema,
  type CartItem,
} from "@shared/schema";
import { z } from "zod";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { emailService } from "./email";

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

// Middleware to get client data from Replit Auth user
async function getClientFromAuth(req: any, res: any, next: any) {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find client linked to this Replit Auth user
    const clients = await storage.getClients();
    let client = clients.find(c => c.userId === userId);

    // If no client exists, this is first login - create a client record
    if (!client) {
      const replitUser = await storage.getUser(userId);
      if (!replitUser) {
        return res.status(401).json({ message: "User not found" });
      }

      // First user to log in becomes admin
      const isFirstUser = clients.length === 0;

      // Create a client record linked to this Replit Auth user
      client = await storage.createClient({
        userId: userId,
        nameEn: `${replitUser.firstName || ''} ${replitUser.lastName || ''}`.trim() || replitUser.email || 'User',
        nameAr: `${replitUser.firstName || ''} ${replitUser.lastName || ''}`.trim() || replitUser.email || 'مستخدم',
        username: replitUser.email || `user_${userId.substring(0, 8)}`,
        password: '', // Not used with Replit Auth
        email: replitUser.email || null,
        phone: null,
        isAdmin: isFirstUser,
      });
    }

    // Attach client to request
    (req as any).client = client;
    next();
  } catch (error: any) {
    console.error("Error in getClientFromAuth:", error);
    res.status(500).json({ message: error.message });
  }
}

// Require auth middleware (uses Replit Auth + loads client)
async function requireAuth(req: any, res: any, next: any) {
  await isAuthenticated(req, res, async () => {
    await getClientFromAuth(req, res, next);
  });
}

// Require admin middleware
async function requireAdmin(req: any, res: any, next: any) {
  await requireAuth(req, res, () => {
    if (!(req as any).client?.isAdmin) {
      return res.status(403).json({
        message: "Unauthorized - Admin access required",
        messageAr: "غير مصرح - مطلوب صلاحيات المسؤول"
      });
    }
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Auth endpoint - returns user with client data
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const replitUser = await storage.getUser(userId);

      // Find or create client linked to this user
      const clients = await storage.getClients();
      let client = clients.find(c => c.userId === userId);

      if (!client && replitUser) {
        // First user to log in becomes admin
        const isFirstUser = clients.length === 0;

        client = await storage.createClient({
          userId: userId,
          nameEn: `${replitUser.firstName || ''} ${replitUser.lastName || ''}`.trim() || replitUser.email || 'User',
          nameAr: `${replitUser.firstName || ''} ${replitUser.lastName || ''}`.trim() || replitUser.email || 'مستخدم',
          username: replitUser.email || `user_${userId.substring(0, 8)}`,
          password: '', // Not used with Replit Auth
          email: replitUser.email || null,
          phone: null,
          isAdmin: isFirstUser,
        });
      }

      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json({
        id: client.id,
        username: client.username,
        nameEn: client.nameEn,
        nameAr: client.nameAr,
        email: client.email,
        phone: client.phone,
        isAdmin: client.isAdmin,
        profileImageUrl: replitUser?.profileImageUrl,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Client Profile Routes
  app.get("/api/client/profile", requireAuth, async (req: any, res) => {
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({ message: error.message });
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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/client/departments/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteClientDepartment(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({ message: error.message });
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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/client/locations/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteClientLocation(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Products Routes - Get all products with client's LTA prices (if any)
  app.get("/api/products", requireAuth, async (req: any, res) => {
    try {
      const products = await storage.getAllProductsWithClientPrices(req.client.id);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Request price offer for products
  app.post("/api/client/price-request", requireAuth, async (req: any, res) => {
    try {
      const { productIds, message } = req.body;

      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({
          message: "Product IDs are required",
          messageAr: "معرفات المنتجات مطلوبة"
        });
      }

      const client = await storage.getClient(req.client.id);
      const products = [];

      for (const productId of productIds) {
        const product = await storage.getProduct(productId);
        if (product) {
          products.push(product);
        }
      }

      // Create notification for admins
      const admins = await storage.getAdminClients();
      for (const admin of admins) {
        await storage.createNotification({
          clientId: admin.id,
          type: 'price_request',
          titleEn: 'New Price Offer Request',
          titleAr: 'طلب عرض سعر جديد',
          messageEn: `${client?.nameEn} has requested pricing for ${products.length} product(s)`,
          messageAr: `طلب ${client?.nameAr} تسعير لـ ${products.length} منتج`,
          metadata: JSON.stringify({
            clientId: req.client.id,
            clientNameEn: client?.nameEn,
            clientNameAr: client?.nameAr,
            productIds,
            products: products.map(p => ({ id: p.id, sku: p.sku, nameEn: p.nameEn, nameAr: p.nameAr })),
            message: message || null
          }),
        });
      }

      // Create notification for client
      await storage.createNotification({
        clientId: req.client.id,
        type: 'price_request_sent',
        titleEn: 'Price Request Submitted',
        titleAr: 'تم إرسال طلب السعر',
        messageEn: `Your price request for ${products.length} product(s) has been sent to administrators`,
        messageAr: `تم إرسال طلب السعر الخاص بك لـ ${products.length} منتج إلى المسؤولين`,
        metadata: JSON.stringify({ productIds }),
      });

      res.json({
        message: "Price request submitted successfully",
        messageAr: "تم إرسال طلب السعر بنجاح"
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
        messageAr: "حدث خطأ أثناء إرسال طلب السعر"
      });
    }
  });

  // Admin Client Management Routes
  app.get("/api/admin/clients", requireAdmin, async (req: any, res) => {
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
      }));
      res.json(clientsBasicInfo);
    } catch (error: any) {
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
          nameEn: client.nameEn,
          nameAr: client.nameAr,
          email: client.email,
          phone: client.phone,
          isAdmin: client.isAdmin,
        },
        departments,
        locations,
      });
    } catch (error: any) {
      res.status(500).json({
        message: "Error fetching client details",
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
        message: "Client created successfully",
        messageAr: "تم إنشاء العميل بنجاح"
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
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
      });
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
      res.status(500).json({
        message: "Error updating admin status",
        messageAr: "خطأ في تحديث حالة المسؤول"
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get all products (public for catalog)
  app.get("/api/products/public", async (req, res) => {
    try {
      const allProducts = await storage.getProducts();

      const productsWithoutPricing = allProducts.map(p => ({
        ...p,
        hasPrice: false,
      }));

      res.json(productsWithoutPricing);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get all products for admin (no LTA filtering)
  app.get("/api/products/all", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const allProducts = await storage.getProducts();
      res.json(allProducts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/products", requireAdmin, async (req: any, res) => {
    try {
      const validatedData = createProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({
        message: error.message,
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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({
        message: error.message,
        messageAr: "حدث خطأ أثناء تحديث المنتج",
      });
    }
  });

  app.delete("/api/products/:id", requireAdmin, async (req: any, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
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
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
        messageAr: "حدث خطأ أثناء استيراد الأسعار",
      });
    }
  });

  // Order Templates Routes
  app.get("/api/client/templates", requireAuth, async (req: any, res) => {
    try {
      const templates = await storage.getOrderTemplates(req.client.id);
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/client/templates/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteOrderTemplate(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Orders Routes
  app.get("/api/client/orders", requireAuth, async (req: any, res) => {
    try {
      const orders = await storage.getOrders(req.client.id);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/client/orders", requireAuth, async (req: any, res) => {
    try {
      // Validate request body with schema
      const validatedData = createOrderSchema.parse(req.body);

      // Step 1: Extract and validate ltaId from items
      const ltaIds = Array.from(new Set(validatedData.items.map(item => item.ltaId)));
      if (ltaIds.length === 0) {
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
      const isClientInLta = clientLtas.some(lta => lta.id === ltaId);

      if (!isClientInLta) {
        return res.status(403).json({
          message: 'You are not authorized to order from this LTA',
          messageAr: 'أنت غير مخول بالطلب من هذه الاتفاقية',
        });
      }

      // Step 3: Get LTA products with pricing and validate
      const ltaProducts = await storage.getProductsForLta(ltaId);
      const ltaProductMap = new Map(
        ltaProducts.map(p => [p.id, { price: p.contractPrice, currency: p.currency, nameEn: p.nameEn, nameAr: p.nameAr }])
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

      // Send order confirmation email
      if (client) {
        try {
          const language = req.headers['accept-language']?.includes('ar') ? 'ar' : 'en';
          await emailService.sendOrderConfirmation({
            order: finalOrder,
            client,
            items: validatedItems,
          }, language as 'en' | 'ar');
        } catch (emailError: any) {
          console.error('Error sending order confirmation email:', emailError);
          // Continue even if email fails - order is already created
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

      res.status(201).json(finalOrder);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق",
        });
      }
      res.status(500).json({
        message: error.message,
        messageAr: "حدث خطأ أثناء إنشاء الطلب",
      });
    }
  });

  // Notifications Routes
  app.get("/api/client/notifications", requireAuth, async (req: any, res) => {
    try {
      const notifications = await storage.getClientNotifications(req.client.id);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/client/notifications/unread-count", requireAuth, async (req: any, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.client.id);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/client/notifications/mark-all-read", requireAuth, async (req: any, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.client.id);
      res.json({
        message: "All notifications marked as read",
        messageAr: "تم وضع علامة مقروء على جميع الإشعارات",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/client/notifications/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق"
        });
      }
      res.status(500).json({
        message: error.message,
        messageAr: "حدث خطأ أثناء إنشاء الاتفاقية"
      });
    }
  });

  app.get('/api/admin/ltas', requireAdmin, async (req: any, res) => {
    try {
      const ltas = await storage.getAllLtas();
      res.json(ltas);
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
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
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق"
        });
      }
      res.status(500).json({
        message: error.message,
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
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق"
        });
      }
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        return res.status(409).json({
          message: "Product already assigned to this LTA",
          messageAr: "المنتج مُعيّن بالفعل لهذه الاتفاقية"
        });
      }
      res.status(500).json({
        message: error.message,
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
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
        messageAr: "حدث خطأ أثناء إزالة المنتج"
      });
    }
  });

  app.get('/api/admin/ltas/:ltaId/products', requireAdmin, async (req: any, res) => {
    try {
      const products = await storage.getProductsForLta(req.params.ltaId);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
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
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
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
    } catch (error: any) {
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
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Validation error",
          messageAr: error.errors[0]?.message || "خطأ في التحقق"
        });
      }
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        return res.status(409).json({
          message: "Client already assigned to this LTA",
          messageAr: "العميل مُعيّن بالفعل لهذه الاتفاقية"
        });
      }
      res.status(500).json({
        message: error.message,
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
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
        messageAr: "حدث خطأ أثناء إزالة العميل"
      });
    }
  });

  app.get('/api/admin/ltas/:ltaId/clients', requireAdmin, async (req: any, res) => {
    try {
      const ltaClients = await storage.getLtaClients(req.params.ltaId);
      const clients = [];

      for (const ltaClient of ltaClients) {
        const client = await storage.getClient(ltaClient.clientId);
        if (client) {
          clients.push({
            id: client.id,
            nameEn: client.nameEn,
            nameAr: client.nameAr,
            email: client.email,
            phone: client.phone,
          });
        }
      }

      res.json(clients);
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
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
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
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
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
        messageAr: "حدث خطأ أثناء تحميل المستند"
      });
    }
  });

  app.get('/api/admin/ltas/:ltaId/documents', requireAdmin, async (req: any, res) => {
    try {
      const documents = await storage.getLtaDocuments(req.params.ltaId);
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
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

      // Delete file from disk
      const filePath = path.join(process.cwd(), document.fileUrl);
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
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
        messageAr: "حدث خطأ أثناء حذف المستند"
      });
    }
  });

  // Generate PDF price offer for a price request
  app.post('/api/admin/price-requests/:notificationId/generate-pdf', requireAdmin, async (req: any, res) => {
    try {
      const { PDFGenerator } = await import('./pdf-generator');
      const { PDFStorage } = await import('./object-storage');


  // Download PDF from Object Storage
  app.get('/api/pdf/download/:fileName(*)', requireAuth, async (req: any, res) => {
    try {
      const { PDFStorage } = await import('./object-storage');
      const fileName = req.params.fileName;

      if (!fileName) {
        return res.status(400).json({
          message: "File name is required",
          messageAr: "اسم الملف مطلوب"
        });
      }

      const downloadResult = await PDFStorage.downloadPDF(fileName);

      if (!downloadResult.ok || !downloadResult.data) {
        return res.status(404).json({
          message: "PDF not found",
          messageAr: "لم يتم العثور على PDF",
          error: downloadResult.error
        });
      }

      // Extract just the filename for the download
      const displayFileName = fileName.split('/').pop() || 'document.pdf';

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${displayFileName}"`);
      res.send(downloadResult.data);
    } catch (error: any) {
      console.error('PDF download error:', error);
      res.status(500).json({
        message: error.message || "Failed to download PDF",
        messageAr: "فشل تنزيل PDF"
      });
    }
  });

      const { language = 'en', ltaId, validityDays = 30, notes } = req.body;

      // Get the notification
      const notification = await storage.getNotification(req.params.notificationId);
      if (!notification || notification.type !== 'price_request') {
        return res.status(404).json({
          message: "Price request not found",
          messageAr: "طلب السعر غير موجود"
        });
      }

      // Parse metadata - it's stored as jsonb but may come as string or object
      let metadata: any = {};
      try {
        metadata = typeof notification.metadata === 'string' 
          ? JSON.parse(notification.metadata) 
          : notification.metadata || {};
      } catch (e) {
        console.error('Failed to parse notification metadata:', e);
        return res.status(400).json({
          message: "Invalid notification metadata",
          messageAr: "بيانات الإشعار غير صالحة"
        });
      }
      
      // Get client details
      const client = await storage.getClient(metadata.clientId);
      if (!client) {
        return res.status(404).json({
          message: "Client not found",
          messageAr: "العميل غير موجود"
        });
      }

      // Get LTA details
      const lta = await storage.getLta(ltaId);
      if (!lta) {
        return res.status(404).json({
          message: "LTA not found",
          messageAr: "الاتفاقية غير موجودة"
        });
      }

      // Get products with prices from LTA
      const ltaProducts = await storage.getProductsForLta(ltaId);
      const requestedProductIds = metadata.productIds || [];
      
      const items = requestedProductIds
        .map((productId: string) => {
          const product = ltaProducts.find(p => p.id === productId);
          if (!product || !product.contractPrice) return null;
          return {
            sku: product.sku,
            nameEn: product.nameEn,
            nameAr: product.nameAr,
            contractPrice: product.contractPrice,
            currency: product.currency || 'USD'
          };
        })
        .filter((item: any) => item !== null);

      if (items.length === 0) {
        return res.status(400).json({
          message: "No priced products found for this request",
          messageAr: "لم يتم العثور على منتجات بأسعار لهذا الطلب"
        });
      }

      // Generate PDF
      const offerDate = new Date();
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validityDays);

      const pdfBuffer = await PDFGenerator.generatePriceOffer({
        offerId: `PO-${Date.now()}`,
        offerDate: offerDate.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US'),
        clientNameEn: client.nameEn,
        clientNameAr: client.nameAr,
        clientEmail: client.email || undefined,
        clientPhone: client.phone || undefined,
        ltaNameEn: lta.nameEn,
        ltaNameAr: lta.nameAr,
        items,
        validUntil: validUntil.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US'),
        notes: notes || undefined,
        language: language as 'en' | 'ar'
      });

      // Save PDF to Object Storage
      const fileName = `price_offer_${client.nameEn.replace(/\s/g, '_')}_${Date.now()}.pdf`;
      const uploadResult = await PDFStorage.uploadPDF(pdfBuffer, fileName);

      if (!uploadResult.ok) {
        return res.status(500).json({
          message: "Failed to save PDF",
          messageAr: "فشل حفظ ملف PDF",
          error: uploadResult.error
        });
      }

      // Create notification for client about the price offer
      await storage.createNotification({
        clientId: metadata.clientId,
        type: 'price_offer_ready',
        titleEn: 'Price Offer Document Ready',
        titleAr: 'مستند عرض السعر جاهز',
        messageEn: `Your official price offer document has been generated and is ready for review.`,
        messageAr: `تم إنشاء مستند عرض السعر الرسمي الخاص بك وهو جاهز للمراجعة.`,
        metadata: JSON.stringify({
          notificationId: notification.id,
          ltaId,
          productCount: items.length
        }),
        pdfFileName: uploadResult.fileName,
      });

      // Return success with file information
      res.json({
        message: language === 'ar' ? 'تم إنشاء وحفظ PDF بنجاح' : 'PDF generated and saved successfully',
        fileName: uploadResult.fileName,
        clientId: metadata.clientId
      });

    } catch (error: any) {
      console.error('PDF generation error:', error);
      res.status(500).json({
        message: error.message || "Failed to generate PDF",
        messageAr: "فشل إنشاء ملف PDF"
      });
    }
  });

  // Client LTA Endpoints
  app.get('/api/client/ltas', requireAuth, async (req: any, res) => {
    try {
      const ltas = await storage.getClientLtas(req.client.id);
      res.json(ltas);
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
        messageAr: "حدث خطأ أثناء جلب الاتفاقيات"
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
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
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
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
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
        } catch (error: any) {
          results.errors.push({
            row: i + 2,
            vendorNumber: values[0] || 'N/A',
            message: error.message,
            messageAr: 'حدث خطأ أثناء معالجة الصف'
          });
        }
      }

      res.json({
        ...results,
        message: `Import completed: ${results.success.length} succeeded, ${results.errors.length} failed`,
        messageAr: `اكتمل الاستيراد: ${results.success.length} نجح، ${results.errors.length} فشل`
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
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
        } catch (error: any) {
          results.errors.push({
            row: i + 2,
            sku: values[0] || 'N/A',
            message: error.message,
            messageAr: 'حدث خطأ أثناء معالجة الصف'
          });
        }
      }

      res.json({
        ...results,
        message: `Import completed: ${results.success.length} succeeded, ${results.errors.length} failed`,
        messageAr: `اكتمل الاستيراد: ${results.success.length} نجح، ${results.errors.length} فشل`
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message,
        messageAr: "حدث خطأ أثناء استيراد المنتجات"
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}