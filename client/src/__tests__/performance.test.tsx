
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import AdminProductsPage from '@/pages/AdminProductsPage';
import { render } from './test-utils';

describe('Performance Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: false,
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
        },
        mutations: { retry: false },
      },
    });

    // Mock large dataset
    const largeProductList = Array.from({ length: 100 }, (_, i) => ({
      id: `prod-${i}`,
      sku: `SKU-${i.toString().padStart(3, '0')}`,
      nameEn: `Product ${i}`,
      nameAr: `منتج ${i}`,
      contractPrice: '100.00',
    }));

    global.fetch = vi.fn((url) => {
      if (url.includes('/api/admin/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(largeProductList),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }) as any;
  });

  it('should render large lists efficiently', async () => {
    const startTime = performance.now();
    
    render(
      <AdminProductsPage />,
      { queryClient }
    );

    await waitFor(() => {
      expect(screen.getByText('Product 0')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within 2 seconds even with 100 items
    expect(renderTime).toBeLessThan(2000);
  });

  it('should cache query results', async () => {
    let fetchCount = 0;
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/admin/products')) {
        fetchCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 'prod-1', sku: 'SKU-001', nameEn: 'Test Product', nameAr: 'منتج تجريبي', contractPrice: '100.00' }
          ]),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }) as any;

    const { unmount } = render(
      <AdminProductsPage />,
      { queryClient }
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    const firstFetchCount = fetchCount;

    // Remount same component
    unmount();
    render(
      <AdminProductsPage />,
      { queryClient }
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    // Should use cached data, not fetch again
    expect(fetchCount).toBe(firstFetchCount);
  });
});
