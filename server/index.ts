import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import path from 'path'; // Import path module
import compression from 'compression';
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

// Performance: Compression middleware (gzip/brotli)
// Apply compression early, but skip for already compressed content and static assets
app.use(compression({
  filter: (req: Request, res: Response) => {
    // Don't compress if client doesn't accept compression
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression for all other requests
    return compression.filter(req, res);
  },
  level: 6, // Good balance between compression and CPU usage
  threshold: 1024, // Only compress responses larger than 1KB
}));

// Phase 3: Performance monitoring middleware
app.use(performanceMonitoringMiddleware);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Set UTF-8 encoding for all responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Phase 4: Rate limiting for API routes (lenient for development)
if (!isDev) {
  // Exempt high-frequency endpoints from strict rate limiting
  app.use('/api/', (req, res, next) => {
    // Skip rate limiting for analytics and notifications (they batch requests)
    if (req.path.startsWith('/analytics') || req.path.startsWith('/client/notifications')) {
      return next();
    }
    return rateLimit(RateLimitPresets.API)(req, res, next);
  });
}

// Serve static files from attached_assets directory BEFORE other middlewares
app.use('/attached_assets', express.static('attached_assets'));

// Performance monitoring for slow requests
const SLOW_REQUEST_THRESHOLD = 1000; // ms

app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > SLOW_REQUEST_THRESHOLD) {
      console.log(`[SLOW REQUEST] ${req.method} ${req.path} took ${duration}ms`, {
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent')?.substring(0, 50),
      });
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
  // Database initialization happens lazily on first query

  const server = await registerRoutes(app);

  // Phase 3 & 4: Monitoring and metrics routes (admin-only)
  app.use('/api/monitoring', monitoringRoutes);

  // API 404 handler - must come BEFORE SPA fallback
  // Catches undefined API routes and returns JSON 404 instead of HTML
  app.use('/api/*', notFoundHandler);

  // Serve static files with aggressive caching
  app.use(express.static(path.join(process.cwd(), "public"), {
    maxAge: '1y',
    etag: true,
    lastModified: true,
    setHeaders: (res, filepath) => {
      if (filepath.endsWith('.png') || filepath.endsWith('.jpg') || filepath.endsWith('.jpeg')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));

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
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use. Please stop other processes using this port.`);
      console.error('Hint: Check the Workflows panel and stop any running workflows.');
      process.exit(1);
    } else {
      console.error('❌ Server error:', err);
      process.exit(1);
    }
  });
})();