import { Request, Response, NextFunction } from 'express';
import { AuthUser } from '@shared/schema';

// Extend Express Request to include our custom properties
declare global {
  namespace Express {
    interface Request {
      client?: AuthUser;
      user?: {
        claims?: {
          sub?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          profile_image_url?: string;
        };
        access_token?: string;
        refresh_token?: string;
        expires_at?: number;
      };
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