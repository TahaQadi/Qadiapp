import { Request, Response, NextFunction } from 'express';
import { AuthUser } from '@shared/schema';

// Extend Express Request to include our custom properties
declare global {
  namespace Express {
    interface Request {
      client?: AuthUser;
    }
  }
}

export type AuthenticatedRequest = Request & {
  client: AuthUser;
};

export type AdminRequest = Request & {
  client: AuthUser;
};

export type ApiHandler = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;
export type AuthenticatedHandler = (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void> | void;
export type AdminHandler = (req: AdminRequest, res: Response, next: NextFunction) => Promise<void> | void;