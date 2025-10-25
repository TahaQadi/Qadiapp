import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { createErrorResponse, ErrorCode } from '@shared/api-types';

/**
 * Validation Middleware Factory
 * Creates Express middleware that validates request body, query, or params using Zod schemas
 */

export interface ValidationTarget {
  body?: z.ZodType<any>;
  query?: z.ZodType<any>;
  params?: z.ZodType<any>;
}

/**
 * Creates validation middleware for request data
 * 
 * @example
 * router.post('/products', 
 *   validate({ body: createProductSchema }), 
 *   async (req, res) => { ... }
 * );
 */
export function validate(schemas: ValidationTarget) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate body
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }

      // Validate query parameters
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }

      // Validate URL parameters
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.errors[0];
        return res.status(400).json(
          createErrorResponse(
            ErrorCode.VALIDATION_ERROR,
            firstError.message,
            error.errors,
            firstError.path.join('.')
          )
        );
      }
      next(error);
    }
  };
}

/**
 * Validates request body only (convenience wrapper)
 * 
 * @example
 * router.post('/products', validateBody(createProductSchema), handler);
 */
export function validateBody<T extends z.ZodType<any>>(schema: T) {
  return validate({ body: schema });
}

/**
 * Validates query parameters only (convenience wrapper)
 * 
 * @example
 * router.get('/products', validateQuery(paginatedRequestSchema), handler);
 */
export function validateQuery<T extends z.ZodType<any>>(schema: T) {
  return validate({ query: schema });
}

/**
 * Validates URL parameters only (convenience wrapper)
 * 
 * @example
 * router.get('/products/:id', validateParams(z.object({ id: z.string().uuid() })), handler);
 */
export function validateParams<T extends z.ZodType<any>>(schema: T) {
  return validate({ params: schema });
}

/**
 * Validates file uploads
 */
export function validateFile(options: {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  required?: boolean;
}) {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
    required = true,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const file = (req as any).file;

    if (!file) {
      if (required) {
        return res.status(400).json(
          createErrorResponse(
            ErrorCode.VALIDATION_ERROR,
            'File is required',
            undefined,
            'file'
          )
        );
      }
      return next();
    }

    // Check file size
    if (file.size > maxSize) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          `File size must be less than ${maxSize / 1024 / 1024}MB`,
          { actualSize: file.size, maxSize },
          'file'
        )
      );
    }

    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
          { actualType: file.mimetype, allowedTypes },
          'file'
        )
      );
    }

    next();
  };
}

/**
 * Helper to validate ID parameter
 */
export const validateId = validateParams(
  z.object({
    id: z.string().uuid('Invalid ID format'),
  })
);

/**
 * Helper to validate pagination query
 */
export const validatePagination = validateQuery(
  z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
  })
);
