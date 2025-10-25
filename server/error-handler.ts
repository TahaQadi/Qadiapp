import { Request, Response, NextFunction } from 'express';
import { createErrorResponse, ErrorCode } from '@shared/api-types';
import { ZodError } from 'zod';

/**
 * Custom Application Error Class
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public statusCode: number,
    message: string,
    public details?: any,
    public field?: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 * Converts all errors to standardized API response format
 */
export function errorHandler(
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error details
  console.error(`Error ${req.method} ${req.path}:`, {
    message: err.message,
    stack: err.stack,
    body: req.body,
    query: req.query,
    params: req.params,
    user: (req as any).user?.id || 'anonymous',
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const firstError = err.errors[0];
    return res.status(400).json(
      createErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        firstError.message,
        err.errors,
        firstError.path.join('.')
      )
    );
  }

  // Handle custom application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(
      createErrorResponse(err.code, err.message, err.details, err.field)
    );
  }

  // Handle generic errors
  const isDevelopment = process.env.NODE_ENV === 'development';
  const statusCode = 500;
  
  return res.status(statusCode).json(
    createErrorResponse(
      ErrorCode.INTERNAL_SERVER_ERROR,
      isDevelopment ? err.message : undefined,
      isDevelopment ? { stack: err.stack } : undefined
    )
  );
}

/**
 * Not found handler
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json(
    createErrorResponse(
      ErrorCode.NOT_FOUND,
      `Resource not found: ${req.path}`
    )
  );
}

/**
 * Helper functions to throw common errors
 */
export const errors = {
  unauthorized: (message = 'Unauthorized') => 
    new AppError(ErrorCode.UNAUTHORIZED, 401, message),
  
  forbidden: (message = 'Forbidden') => 
    new AppError(ErrorCode.FORBIDDEN, 403, message),
  
  notFound: (resource = 'Resource', id?: string) => 
    new AppError(
      ErrorCode.NOT_FOUND, 
      404, 
      id ? `${resource} with id ${id} not found` : `${resource} not found`
    ),
  
  conflict: (message: string) => 
    new AppError(ErrorCode.CONFLICT, 409, message),
  
  validation: (message: string, field?: string) => 
    new AppError(ErrorCode.VALIDATION_ERROR, 400, message, undefined, field),
  
  invalidInput: (message: string, field?: string) => 
    new AppError(ErrorCode.INVALID_INPUT, 400, message, undefined, field),
  
  invalidOperation: (message: string) => 
    new AppError(ErrorCode.INVALID_OPERATION, 400, message),
  
  database: (message: string, details?: any) => 
    new AppError(ErrorCode.DATABASE_ERROR, 500, message, details),
  
  internal: (message: string, details?: any) => 
    new AppError(ErrorCode.INTERNAL_SERVER_ERROR, 500, message, details),
};
