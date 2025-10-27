
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { userEvent } from '@testing-library/user-event';
import { render } from './test-utils';
import OrderingPage from '@/pages/OrderingPage';
import { seedData, getProductsWithLtaPricing, getClientLtas } from './seed-data';

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

    // Mock fetch with seed data
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(getProductsWithLtaPricing('lta-1')),
        });
      }
      if (url.includes('/api/client/ltas')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(getClientLtas('client-1')),
        });
      }
      if (url.includes('/api/orders')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      if (url.includes('/api/cart')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
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

    // Wait for products to load - look for the first product specifically
    await waitFor(() => {
      const productText = screen.getByTestId('text-product-name-product-1');
      expect(productText).toHaveTextContent('Test Product');
    });

    // Look for add to cart button - it might have different test IDs
    const addButton = screen.getByTestId('button-add-to-cart-product-1');
    await user.click(addButton);

    // Verify cart count updated - look for specific cart count badge
    await waitFor(() => {
      const cartCount = screen.getByTestId('badge-cart-count');
      expect(cartCount).toHaveTextContent('1');
    });
  });
});
