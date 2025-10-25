import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedData } from "./seed";
import { errorHandler, notFoundHandler } from "./error-handler";
import { performanceMonitoringMiddleware } from "./performance-monitoring";
import { securityHeaders, SecurityPresets } from "./security-headers";
import { rateLimit, RateLimitPresets } from "./rate-limiting";
import monitoringRoutes from "./monitoring-routes";

// Handle uncaught errors in production
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

const app = express();

// Phase 4: Security headers middleware
const isDev = app.get("env") === "development";
app.use(securityHeaders(isDev ? SecurityPresets.DEVELOPMENT : SecurityPresets.PRODUCTION));

// Phase 3: Performance monitoring middleware
app.use(performanceMonitoringMiddleware);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Phase 4: Rate limiting for API routes (lenient for development)
if (!isDev) {
  app.use('/api/', rateLimit(RateLimitPresets.API));
}

// Serve static files from attached_assets directory BEFORE other middlewares
app.use('/attached_assets', express.static('attached_assets'));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Validate SESSION_SECRET exists before starting the server
  if (!process.env.SESSION_SECRET) {
    throw new Error(
      "SESSION_SECRET environment variable is required for session management. " +
      "Please set SESSION_SECRET in your environment variables."
    );
  }

  // Seed data disabled - using Replit Auth with auto-admin assignment
  // await seedData();

  const server = await registerRoutes(app);

  // Phase 3 & 4: Monitoring and metrics routes (admin-only)
  app.use('/api/monitoring', monitoringRoutes);

  // API 404 handler - must come BEFORE SPA fallback
  // Catches undefined API routes and returns JSON 404 instead of HTML
  app.use('/api/*', notFoundHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Register error handler AFTER Vite/static setup
  // Catches all errors and returns standardized ApiResponse
  app.use(errorHandler);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
