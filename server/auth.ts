import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { Client, AuthUser } from "@shared/schema";

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
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const client = await storage.getClientByUsername(username);
      if (!client || !(await comparePasswords(password, client.password))) {
        return done(null, false);
      } else {
        const authUser: AuthUser = {
          id: client.id,
          username: client.username,
          nameEn: client.nameEn,
          nameAr: client.nameAr,
          email: client.email ?? undefined,
          phone: client.phone ?? undefined,
          isAdmin: client.isAdmin,
        };
        return done(null, authUser);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: string, done) => {
    const client = await storage.getClient(id);
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
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
