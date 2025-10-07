import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import { loginSchema, priceImportRowSchema } from "@shared/schema";
import { z } from "zod";

const upload = multer({ storage: multer.memoryStorage() });

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Client Profile Routes
  app.get("/api/client/profile", requireAuth, async (req, res) => {
    try {
      const client = await storage.getClient(req.user!.id);
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
  app.post("/api/client/departments", requireAuth, async (req, res) => {
    try {
      const department = await storage.createClientDepartment({
        clientId: req.user!.id,
        ...req.body,
      });
      res.status(201).json(department);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/client/departments/:id", requireAuth, async (req, res) => {
    try {
      const department = await storage.updateClientDepartment(req.params.id, req.body);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      res.json(department);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/client/departments/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteClientDepartment(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Location Routes
  app.post("/api/client/locations", requireAuth, async (req, res) => {
    try {
      const location = await storage.createClientLocation({
        clientId: req.user!.id,
        ...req.body,
      });
      res.status(201).json(location);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/client/locations/:id", requireAuth, async (req, res) => {
    try {
      const location = await storage.updateClientLocation(req.params.id, req.body);
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      res.json(location);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/client/locations/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteClientLocation(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Products Routes
  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const products = await storage.getProducts();
      const pricing = await storage.getClientPricing(req.user!.id);

      const productsWithPricing = products.map(product => {
        const price = pricing.find(p => p.productId === product.id);
        return {
          ...product,
          price: price?.price || null,
          currency: price?.currency || 'USD',
        };
      });

      res.json(productsWithPricing);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Price Import Route
  app.post("/api/client/import-prices", requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileContent = req.file.buffer.toString('utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      // Skip header line
      const dataLines = lines.slice(1);
      const pricingData = [];

      for (const line of dataLines) {
        const [sku, price, currency] = line.split(',').map(s => s.trim());
        if (sku && price) {
          try {
            priceImportRowSchema.parse({ sku, price, currency });
            pricingData.push({ sku, price, currency: currency || 'USD' });
          } catch (parseError) {
            console.error(`Invalid row: ${line}`, parseError);
          }
        }
      }

      const importedCount = await storage.bulkImportPricing(req.user!.id, pricingData);
      
      res.json({ 
        message: `Successfully imported ${importedCount} prices`,
        imported: importedCount,
        total: dataLines.length,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Order Templates Routes
  app.get("/api/client/templates", requireAuth, async (req, res) => {
    try {
      const templates = await storage.getOrderTemplates(req.user!.id);
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/client/templates", requireAuth, async (req, res) => {
    try {
      const template = await storage.createOrderTemplate({
        clientId: req.user!.id,
        ...req.body,
      });
      res.status(201).json(template);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/client/templates/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteOrderTemplate(req.params.id);
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Orders Routes
  app.get("/api/client/orders", requireAuth, async (req, res) => {
    try {
      const orders = await storage.getOrders(req.user!.id);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/client/orders", requireAuth, async (req, res) => {
    try {
      const order = await storage.createOrder({
        clientId: req.user!.id,
        ...req.body,
      });

      // TODO: Send to Pipefy webhook
      // const pipefyResponse = await fetch(process.env.PIPEFY_WEBHOOK_URL!, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     order_id: order.id,
      //     client_id: order.clientId,
      //     items: order.items,
      //     total_amount: order.totalAmount,
      //     created_at: order.createdAt,
      //   })
      // });

      res.status(201).json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
