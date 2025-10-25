import { z } from "zod";

/**
 * Standardized API Response Wrapper
 * All API endpoints should return this format for consistency
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

/**
 * Standardized Error Response
 */
export interface ApiError {
  code: ErrorCode;
  message: string;
  messageAr?: string;
  details?: any;
  field?: string; // For validation errors
}

/**
 * API Response Metadata
 */
export interface ApiMeta {
  pagination?: PaginationMeta;
  timestamp?: string;
  requestId?: string;
}

/**
 * Pagination Metadata
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Standardized Error Codes
 * Use these codes for programmatic error handling
 */
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Business Logic
  INVALID_OPERATION = 'INVALID_OPERATION',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Server Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

/**
 * Error Messages (Bilingual)
 */
export const ErrorMessages: Record<ErrorCode, { en: string; ar: string }> = {
  // Authentication & Authorization
  [ErrorCode.UNAUTHORIZED]: {
    en: 'You must be logged in to access this resource',
    ar: 'يجب تسجيل الدخول للوصول إلى هذا المورد'
  },
  [ErrorCode.FORBIDDEN]: {
    en: 'You do not have permission to perform this action',
    ar: 'ليس لديك إذن لتنفيذ هذا الإجراء'
  },
  [ErrorCode.INVALID_CREDENTIALS]: {
    en: 'Invalid username or password',
    ar: 'اسم المستخدم أو كلمة المرور غير صحيحة'
  },
  [ErrorCode.SESSION_EXPIRED]: {
    en: 'Your session has expired. Please log in again',
    ar: 'انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى'
  },
  
  // Validation
  [ErrorCode.VALIDATION_ERROR]: {
    en: 'Validation failed. Please check your input',
    ar: 'فشل التحقق من الصحة. يرجى التحقق من المدخلات'
  },
  [ErrorCode.INVALID_INPUT]: {
    en: 'Invalid input provided',
    ar: 'مدخلات غير صالحة'
  },
  [ErrorCode.MISSING_REQUIRED_FIELD]: {
    en: 'Required field is missing',
    ar: 'حقل مطلوب مفقود'
  },
  
  // Resources
  [ErrorCode.NOT_FOUND]: {
    en: 'Resource not found',
    ar: 'المورد غير موجود'
  },
  [ErrorCode.ALREADY_EXISTS]: {
    en: 'Resource already exists',
    ar: 'المورد موجود بالفعل'
  },
  [ErrorCode.CONFLICT]: {
    en: 'Resource conflict occurred',
    ar: 'حدث تعارض في الموارد'
  },
  
  // Business Logic
  [ErrorCode.INVALID_OPERATION]: {
    en: 'This operation is not allowed',
    ar: 'هذه العملية غير مسموحة'
  },
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: {
    en: 'Insufficient permissions for this operation',
    ar: 'صلاحيات غير كافية لهذه العملية'
  },
  [ErrorCode.QUOTA_EXCEEDED]: {
    en: 'Quota exceeded',
    ar: 'تم تجاوز الحد المسموح'
  },
  
  // Server Errors
  [ErrorCode.INTERNAL_SERVER_ERROR]: {
    en: 'Internal server error occurred',
    ar: 'حدث خطأ داخلي في الخادم'
  },
  [ErrorCode.DATABASE_ERROR]: {
    en: 'Database error occurred',
    ar: 'حدث خطأ في قاعدة البيانات'
  },
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: {
    en: 'External service error occurred',
    ar: 'حدث خطأ في خدمة خارجية'
  },
  
  // Rate Limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    en: 'Rate limit exceeded. Please try again later',
    ar: 'تم تجاوز الحد المسموح. يرجى المحاولة مرة أخرى لاحقاً'
  },
};

/**
 * Helper function to create success response
 */
export function createSuccessResponse<T>(data: T, meta?: ApiMeta): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Helper function to create error response
 */
export function createErrorResponse(
  code: ErrorCode,
  customMessage?: string,
  details?: any,
  field?: string
): ApiResponse {
  const messages = ErrorMessages[code];
  return {
    success: false,
    error: {
      code,
      message: customMessage || messages.en,
      messageAr: messages.ar,
      details,
      field,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Helper function to create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  pageSize: number,
  totalCount: number
): PaginationMeta {
  const totalPages = Math.ceil(totalCount / pageSize);
  return {
    page,
    pageSize,
    totalPages,
    totalCount,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Zod schema for validating pagination params
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

export type PaginationParams = z.infer<typeof paginationSchema>;
