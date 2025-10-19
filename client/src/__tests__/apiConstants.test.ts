
import { describe, it, expect } from 'vitest';
import {
  AUTH_ENDPOINTS,
  CLIENT_ENDPOINTS,
  ADMIN_ENDPOINTS,
  PRODUCT_ENDPOINTS,
  ORDER_ENDPOINTS,
  DOCUMENT_ENDPOINTS,
} from '@/lib/apiConstants';

describe('API Constants', () => {
  it('should have correct auth endpoints', () => {
    expect(AUTH_ENDPOINTS.USER).toBe('/api/auth/user');
    expect(AUTH_ENDPOINTS.LOGIN).toBe('/api/login');
    expect(AUTH_ENDPOINTS.LOGOUT).toBe('/api/logout');
  });

  it('should generate dynamic product endpoints', () => {
    const productId = 'test-123';
    expect(PRODUCT_ENDPOINTS.DETAIL(productId)).toBe('/api/products/test-123');
  });

  it('should generate dynamic order endpoints', () => {
    const orderId = 'order-456';
    expect(ORDER_ENDPOINTS.DETAIL(orderId)).toBe('/api/orders/order-456');
    expect(ORDER_ENDPOINTS.CANCEL(orderId)).toBe('/api/orders/order-456/cancel');
    expect(ORDER_ENDPOINTS.MODIFY(orderId)).toBe('/api/orders/order-456/modify');
  });

  it('should generate dynamic document endpoints', () => {
    const docId = 'doc-789';
    expect(DOCUMENT_ENDPOINTS.DETAIL(docId)).toBe('/api/documents/doc-789');
    expect(DOCUMENT_ENDPOINTS.TOKEN(docId)).toBe('/api/documents/doc-789/token');
    expect(DOCUMENT_ENDPOINTS.DOWNLOAD(docId)).toBe('/api/documents/doc-789/download');
  });
});
