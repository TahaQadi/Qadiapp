/**
 * Security Headers Middleware
 * Adds security headers to protect against common vulnerabilities
 */

import { Request, Response, NextFunction } from 'express';

export interface SecurityHeadersOptions {
  enableCORS?: boolean;
  allowedOrigins?: readonly string[] | string[];
  enableCSP?: boolean;
  enableHSTS?: boolean;
  enableXFrameOptions?: boolean;
  enableXContentTypeOptions?: boolean;
}

/**
 * Security headers middleware
 */
export function securityHeaders(options: SecurityHeadersOptions = {}) {
  const {
    enableCORS = true,
    allowedOrigins = ['*'],
    enableCSP = true,
    enableHSTS = true,
    enableXFrameOptions = true,
    enableXContentTypeOptions = true,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // CORS headers
    if (enableCORS) {
      const origin = req.headers.origin;
      
      if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }
    }

    // Content Security Policy
    if (enableCSP) {
      const cspDirectives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Needed for Vite dev
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self'",
      ];
      res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
    }

    // HTTP Strict Transport Security
    if (enableHSTS) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // Prevent clickjacking
    if (enableXFrameOptions) {
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    }

    // Prevent MIME type sniffing
    if (enableXContentTypeOptions) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    // XSS Protection (legacy, but still useful)
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy (formerly Feature Policy)
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    next();
  };
}

/**
 * Preset security configurations
 */
export const SecurityPresets = {
  /**
   * Development configuration (lenient)
   */
  DEVELOPMENT: {
    enableCORS: true,
    allowedOrigins: ['*'],
    enableCSP: false, // Disabled for easier development
    enableHSTS: false,
    enableXFrameOptions: true,
    enableXContentTypeOptions: true,
  },

  /**
   * Production configuration (strict)
   */
  PRODUCTION: {
    enableCORS: true,
    allowedOrigins: [], // Set specific origins
    enableCSP: true,
    enableHSTS: true,
    enableXFrameOptions: true,
    enableXContentTypeOptions: true,
  },
} as const;
