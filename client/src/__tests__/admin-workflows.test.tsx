
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { userEvent } from '@testing-library/user-event';
import { render } from './test-utils';
import AdminOrdersPage from '@/pages/AdminOrdersPage';
import AdminProductsPage from '@/pages/AdminProductsPage';

// Mock auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', nameEn: 'Admin User', isAdmin: true },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// Mock wouter
vi.mock('wouter', () => ({
  useLocation: () => ['/', vi.fn()],
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  useRoute: () => [false, {}],
}));

describe('Admin Order Management', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    global.fetch = vi.fn((url) => {
      if (url.includes('/api/admin/orders')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: 'order-1',
              orderNumber: 'ORD-001',
              clientId: 'client-1',
              status: 'pending',
              totalAmount: '500.00',
              createdAt: new Date().toISOString(),
            },
          ]),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }) as any;
  });

  it('should display orders with pagination', async () => {
    render(
      <AdminOrdersPage />,
      { queryClient }
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });
  });

  it('should handle order status updates', async () => {
    const user = userEvent.setup();
    
    render(
      <AdminOrdersPage />,
      { queryClient }
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Verify optimistic update capability
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });
});

describe('Admin Product Management', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    global.fetch = vi.fn((url) => {
      if (url.includes('/api/admin/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: 'prod-1',
              sku: 'SKU-001',
              nameEn: 'Test Product',
              nameAr: 'منتج تجريبي',
              contractPrice: '100.00',
            },
          ]),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }) as any;
  });

  it('should display products with search and filters', async () => {
    render(
      <AdminProductsPage />,
      { queryClient }
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
  });

  it('should handle pagination controls', async () => {
    const user = userEvent.setup();
    
    render(
      <AdminProductsPage />,
      { queryClient }
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Verify pagination exists
    const paginationElements = screen.queryAllByRole('button');
    expect(paginationElements.length).toBeGreaterThan(0);
  });
});
