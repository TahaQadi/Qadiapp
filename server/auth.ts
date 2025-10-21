import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { Client, AuthUser } from "@shared/schema";
import { AuthenticatedRequest, AdminRequest } from "./types";

declare global {
  namespace Express {
    interface User extends AuthUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Session configuration with security best practices
  // Note: rolling: true extends session on each request, which is appropriate for
  // active business users. Sessions still expire after maxAge of inactivity.
  // For additional security, consider implementing:
  // - IP-based session validation for admin users
  // - Activity-based reauthentication for sensitive operations
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    rolling: true, // Reset expiration on each request to keep active users logged in
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // Default: 24 hours of inactivity
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true, // Prevent XSS attacks
      sameSite: 'lax', // CSRF protection
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const authUser = await storage.validateClientCredentials(username, password);
      if (!authUser) {
        return done(null, false);
      }
      return done(null, authUser);
    }),
  );

  passport.serializeUser((user, done) => {
    // Store both company ID and user ID (if exists) for proper deserialization
    const sessionData = user.userId ? `${user.id}:${user.userId}` : user.id;
    done(null, sessionData);
  });

  passport.deserializeUser(async (sessionData: string, done) => {
    try {
      // Parse session data (could be "companyId:userId" or just "companyId")
      const parts = sessionData.split(':');
      const companyId = parts[0];
      const userId = parts[1];

      if (userId) {
        // New multi-user system: load company user
        const companyUser = await storage.getCompanyUser(userId);
        const company = companyUser ? await storage.getClient(companyUser.companyId) : null;

        if (!companyUser || !company) {
          return done(null, false);
        }

        const authUser: AuthUser = {
          id: company.id,
          userId: companyUser.id,
          username: companyUser.username,
          nameEn: companyUser.nameEn,
          nameAr: companyUser.nameAr,
          email: companyUser.email ?? undefined,
          phone: companyUser.phone ?? undefined,
          isAdmin: company.isAdmin,
          companyId: company.id,
          companyNameEn: company.nameEn,
          companyNameAr: company.nameAr,
        };
        done(null, authUser);
      } else {
        // Old system: load client directly (backwards compatibility)
        const client = await storage.getClient(companyId);
        if (!client) {
          return done(null, false);
        }

        const authUser: AuthUser = {
          id: client.id,
          username: client.username,
          nameEn: client.nameEn,
          nameAr: client.nameAr,
          email: client.email ?? undefined,
          phone: client.phone ?? undefined,
          isAdmin: client.isAdmin,
        };
        done(null, authUser);
      }
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    const rememberMe = req.body.rememberMe === true;
    
    if (req.session) {
      if (rememberMe) {
        // Set cookie to expire in 30 days if remember me is checked
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      } else {
        // Keep default 24 hour session
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000;
      }
    }
    
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      
      // Destroy the session completely
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          return next(destroyErr);
        }
        
        // Clear the session cookie with matching options
        res.clearCookie('connect.sid', {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

// Middleware for protecting authenticated routes
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to attach client data from authenticated user
async function getClientFromAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // req.user is already an AuthUser from Passport Local Strategy
    // Attach it to req.client for backwards compatibility
    (req as any).client = req.user;
    next();
  } catch (error) {
    console.error("Error in getClientFromAuth:", error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// Require auth middleware
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  isAuthenticated(req, res, async () => {
    await getClientFromAuth(req, res, next);
  });
}

// Require admin middleware
export async function requireAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  await requireAuth(req, res, () => {
    if (!req.client?.isAdmin) {
      return res.status(403).json({
        message: "Unauthorized - Admin access required",
        messageAr: "غير مصرح - مطلوب صلاحيات المسؤول"
      });
    }
    next();
  });
}