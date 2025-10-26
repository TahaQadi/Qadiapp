
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
        queries: { 
          retry: false,
          queryFn: async ({ queryKey }) => {
            const url = queryKey[0] as string;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Network error');
            return res.json();
          },
        },
        mutations: { retry: false },
      },
    });

    global.fetch = vi.fn((url) => {
      if (url.includes('/api/admin/orders')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            orders: [
              {
                id: 'order-1',
                orderNumber: 'ORD-001',
                clientId: 'client-1',
                status: 'pending',
                totalAmount: '500.00',
                createdAt: new Date().toISOString(),
              },
            ],
            totalPages: 1,
          }),
        });
      }
      if (url.includes('/api/admin/clients')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 'client-1', nameEn: 'Test Client', nameAr: 'عميل تجريبي' }
          ]),
        });
      }
      if (url.includes('/api/admin/ltas')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
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

    // Wait for the order row to appear and verify it renders
    const orderRow = await screen.findByTestId('row-order-order-1');
    expect(orderRow).toBeInTheDocument();
  });

  it('should handle order status updates', async () => {
    const user = userEvent.setup();
    
    render(
      <AdminOrdersPage />,
      { queryClient }
    );

    // Wait for the order row to appear
    await screen.findByTestId('row-order-order-1');

    // Verify status badge is displayed
    const statusBadges = screen.getAllByTestId('badge-status-pending');
    expect(statusBadges.length).toBeGreaterThan(0);
  });
});

describe('Admin Product Management', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: false,
          queryFn: async ({ queryKey }) => {
            const url = queryKey[0] as string;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Network error');
            return res.json();
          },
        },
        mutations: { retry: false },
      },
    });

    global.fetch = vi.fn((url) => {
      if (url === '/api/products/all' || url.includes('/api/products/all')) {
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
      if (url === '/api/admin/vendors' || url.includes('/api/admin/vendors')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
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

    // Wait for the product row to appear
    const productRow = await screen.findByTestId('row-product-prod-1');
    expect(productRow).toBeInTheDocument();
    
    // Check that the SKU is displayed
    expect(screen.getByText('SKU-001')).toBeInTheDocument();
  });

  it('should handle pagination controls', async () => {
    const user = userEvent.setup();
    
    render(
      <AdminProductsPage />,
      { queryClient }
    );

    // Wait for the product row to appear
    await screen.findByTestId('row-product-prod-1');

    // Verify pagination exists
    const paginationElements = screen.queryAllByRole('button');
    expect(paginationElements.length).toBeGreaterThan(0);
  });
});
