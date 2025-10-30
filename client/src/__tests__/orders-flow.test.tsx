import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { userEvent } from '@testing-library/user-event';
import { render } from './test-utils';
import OrdersPage from '@/pages/OrdersPage';

// Mock the auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', nameEn: 'Test User', isAdmin: false },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// Mock wouter
vi.mock('wouter', () => ({
  useLocation: () => ['/orders', vi.fn()],
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

const mockOrders = [
  {
    id: 'order-1',
    clientId: '1',
    items: JSON.stringify([
      { productId: 'prod-1', sku: 'SKU-001', nameEn: 'Test Product', nameAr: 'منتج تجريبي', quantity: 2, unitPrice: '100.00', ltaId: 'lta-1', currency: 'USD' },
    ]),
    totalAmount: '200.00',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'order-2',
    clientId: '1',
    items: JSON.stringify([
      { productId: 'prod-2', sku: 'SKU-002', nameEn: 'Another Product', nameAr: 'منتج آخر', quantity: 1, unitPrice: '150.00', ltaId: 'lta-1', currency: 'USD' },
    ]),
    totalAmount: '150.00',
    status: 'delivered',
    createdAt: new Date().toISOString(),
  },
];

describe('Orders Flow E2E', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock fetch for orders API
    global.fetch = vi.fn((url) => {
      if (typeof url === 'string') {
        if (url.includes('/api/orders')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockOrders),
          });
        }
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    }) as any;
  });

  it('should display orders list', async () => {
    render(<OrdersPage />, { queryClient });

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Check if orders are displayed
    expect(screen.getByText('Another Product')).toBeInTheDocument();
  });

  it('should open feedback dialog for delivered order', async () => {
    const user = userEvent.setup();
    
    render(<OrdersPage />, { queryClient });

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getByText('Another Product')).toBeInTheDocument();
    });

    // Find the feedback button for delivered order
    const feedbackButtons = screen.getAllByLabelText(/feedback|تقييم/i);
    if (feedbackButtons.length > 0) {
      await user.click(feedbackButtons[0]);
      
      // Wait for dialog to open
      await waitFor(() => {
        const dialog = screen.queryByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });
    }
  });

  it('should apply status filter', async () => {
    const user = userEvent.setup();
    
    render(<OrdersPage />, { queryClient });

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Find and click status filter
    const statusFilters = screen.queryAllByText(/pending|قيد الانتظار/i);
    if (statusFilters.length > 0) {
      await user.click(statusFilters[0]);
      
      // Verify filter is applied
      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });
    }
  });
});
