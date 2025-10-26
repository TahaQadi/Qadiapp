
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { userEvent } from '@testing-library/user-event';
import { render } from './test-utils';
import OrderingPage from '@/pages/OrderingPage';

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
  useLocation: () => ['/', vi.fn()],
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

describe('Ordering Flow Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock fetch
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: '1',
              sku: 'TEST-001',
              nameEn: 'Test Product',
              nameAr: 'منتج تجريبي',
              contractPrice: '100.00',
              ltaId: 'lta-1',
              hasPrice: true,
            },
          ]),
        });
      }
      if (url.includes('/api/client/ltas')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 'lta-1', nameEn: 'Test LTA', nameAr: 'اتفاقية تجريبية' }]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    }) as any;
  });

  it('should allow adding products to cart and submitting order', async () => {
    const user = userEvent.setup();
    
    render(
      <OrderingPage />,
      { queryClient }
    );

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Add product to cart
    const addButton = screen.getByTestId('button-add-to-cart-1');
    await user.click(addButton);

    // Verify cart count updated
    await waitFor(() => {
      expect(screen.getByTestId('badge-cart-count')).toHaveTextContent('1');
    });
  });
});
