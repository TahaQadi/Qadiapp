
/**
 * Centralized API endpoint constants
 * Use these constants instead of hardcoded strings throughout the app
 */

// Auth endpoints
export const AUTH_ENDPOINTS = {
  USER: '/api/auth/user',
  LOGIN: '/api/login',
  LOGOUT: '/api/logout',
} as const;

// Client endpoints
export const CLIENT_ENDPOINTS = {
  PROFILE: '/api/client/profile',
  DEPARTMENTS: '/api/client/departments',
  LOCATIONS: '/api/client/locations',
  NOTIFICATIONS: '/api/client/notifications',
} as const;

// Admin endpoints
export const ADMIN_ENDPOINTS = {
  CLIENTS: '/api/admin/clients',
  PRODUCTS: '/api/admin/products',
  VENDORS: '/api/admin/vendors',
  LTAS: '/api/admin/ltas',
  ORDERS: '/api/admin/orders',
  TEMPLATES: '/api/admin/templates',
  PRICE_REQUESTS: '/api/admin/price-requests',
  PRICE_OFFERS: '/api/admin/price-offers',
  ORDER_MODIFICATIONS: '/api/admin/order-modifications',
} as const;

// Product endpoints
export const PRODUCT_ENDPOINTS = {
  ALL: '/api/products/all',
  LIST: '/api/products',
  DETAIL: (id: string) => `/api/products/${id}`,
} as const;

// Order endpoints
export const ORDER_ENDPOINTS = {
  LIST: '/api/client/orders',
  CREATE: '/api/client/orders',
  DETAIL: (id: string) => `/api/orders/${id}/history`,
  CANCEL: (id: string) => `/api/orders/${id}/cancel`,
  MODIFY: (id: string) => `/api/orders/${id}/modify`,
} as const;

// Document endpoints
export const DOCUMENT_ENDPOINTS = {
  LIST: '/api/documents',
  DETAIL: (id: string) => `/api/documents/${id}`,
  TOKEN: (id: string) => `/api/documents/${id}/token`,
  DOWNLOAD: (id: string) => `/api/documents/${id}/download`,
  LOGS: (id: string) => `/api/documents/${id}/logs`,
} as const;

// Push notification endpoints
export const PUSH_ENDPOINTS = {
  VAPID_KEY: '/api/push/vapid-public-key',
  SUBSCRIBE: '/api/push/subscribe',
  UNSUBSCRIBE: '/api/push/unsubscribe',
} as const;

// Password endpoints
export const PASSWORD_ENDPOINTS = {
  CHANGE: '/api/password/change',
  ADMIN_RESET: '/api/password/admin-reset',
  FORGOT: '/api/password/forgot',
  RESET: '/api/password/reset',
} as const;

// Onboarding endpoints
export const ONBOARDING_ENDPOINTS = {
  COMPLETE: '/api/onboarding/complete',
} as const;
