import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

}

export async function setupVite(app: Express, server: Server) {
  const port = parseInt(process.env.PORT || '5000', 10);
  const serverOptions = {
    middlewareMode: true,
    hmr: { 
      server,
      port: port,
      host: 'localhost'
    },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist");
  const publicPath = path.resolve(distPath, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find build directory at ${distPath}. Make sure to run 'npm run build' first.`
    );
  }

  if (!fs.existsSync(publicPath)) {
    throw new Error(
      `Could not find public build directory at ${publicPath}. Make sure to run 'npm run build' first.`
    );
  }

  // Serve static files from dist/public with optimized cache headers
  app.use(express.static(publicPath, {
    maxAge: '1y',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      const fileExt = path.extname(filePath).toLowerCase();
      
      // Set content type
      if (filePath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      } else if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      }
      
      // Set cache headers based on file type
      // Hashed static assets (JS/CSS with hash in filename) - immutable, 1 year
      if ((fileExt === '.js' || fileExt === '.css') && /[a-f0-9]{8,}/.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      // Images and fonts - 30 days
      else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.eot'].includes(fileExt)) {
        res.setHeader('Cache-Control', 'public, max-age=2592000');
      }
      // HTML - always revalidate
      else if (fileExt === '.html') {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      }
      // Other static assets - 1 year
      else {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      }
      
      // Add Vary header for compressed content
      if (['.js', '.css', '.html'].includes(fileExt)) {
        res.setHeader('Vary', 'Accept-Encoding');
      }
    }
  }));

  // fall through to index.html if the file doesn't exist
  // This catch-all route should only match non-API routes
  app.use("*", (req, res) => {
    // Don't serve index.html for API routes (they should have been handled by API 404 handler)
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.sendFile(path.resolve(publicPath, "index.html"));
  });
}