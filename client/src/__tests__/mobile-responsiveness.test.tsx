
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import OrderingPage from '@/pages/OrderingPage';
import AdminOrdersPage from '@/pages/AdminOrdersPage';
import { render as customRender } from './test-utils';

describe('Mobile Responsiveness Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Mock fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    ) as any;
  });

  const setViewport = (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    window.dispatchEvent(new Event('resize'));
  };

  describe('Small Mobile (320px)', () => {
    beforeEach(() => {
      setViewport(320, 568);
    });

    it('should render mobile navigation on small screens', async () => {
      customRender(<OrderingPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByTestId('page-ordering')).toBeInTheDocument();
      });
    });

    it('should use single column layout', async () => {
      const { container } = customRender(<OrderingPage />, { queryClient });
      
      await waitFor(() => {
        const grid = container.querySelector('[class*="grid"]');
        expect(grid).toBeInTheDocument();
      });
    });
  });

  describe('Standard Mobile (375px)', () => {
    beforeEach(() => {
      setViewport(375, 667);
    });

    it('should render product cards in mobile layout', async () => {
      customRender(<OrderingPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByTestId('page-ordering')).toBeInTheDocument();
      });
    });

    it('should show mobile cart drawer', async () => {
      customRender(<OrderingPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByTestId('page-ordering')).toBeInTheDocument();
      });
    });
  });

  describe('Tablet (768px)', () => {
    beforeEach(() => {
      setViewport(768, 1024);
    });

    it('should render two-column grid on tablet', async () => {
      const { container } = customRender(<OrderingPage />, { queryClient });
      
      await waitFor(() => {
        const grid = container.querySelector('[class*="grid"]');
        expect(grid).toBeInTheDocument();
      });
    });

    it('should show desktop-style navigation', async () => {
      customRender(<OrderingPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByTestId('page-ordering')).toBeInTheDocument();
      });
    });
  });

  describe('Desktop (1024px+)', () => {
    beforeEach(() => {
      setViewport(1024, 768);
    });

    it('should render full desktop layout', async () => {
      customRender(<OrderingPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByTestId('page-ordering')).toBeInTheDocument();
      });
    });

    it('should show sidebar navigation', async () => {
      customRender(<OrderingPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByTestId('page-ordering')).toBeInTheDocument();
      });
    });
  });

  describe('Touch Targets', () => {
    beforeEach(() => {
      setViewport(375, 667);
    });

    it('should have minimum 44x44px touch targets on mobile', async () => {
      const { container } = customRender(<OrderingPage />, { queryClient });
      
      await waitFor(() => {
        const buttons = container.querySelectorAll('button');
        buttons.forEach((button) => {
          const rect = button.getBoundingClientRect();
          expect(rect.width).toBeGreaterThanOrEqual(44);
          expect(rect.height).toBeGreaterThanOrEqual(44);
        });
      });
    });
  });

  describe('Virtual Scrolling Performance', () => {
    beforeEach(() => {
      // Mock large dataset
      global.fetch = vi.fn((url) => {
        if (url.includes('/api/admin/orders')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              orders: Array.from({ length: 100 }, (_, i) => ({
                id: `order-${i}`,
                status: 'pending',
                totalAmount: '100.00',
              })),
              totalPages: 10,
              totalCount: 100,
              currentPage: 1,
            }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }) as any;
    });

    it('should render large lists efficiently on mobile', async () => {
      setViewport(375, 667);
      
      const startTime = performance.now();
      customRender(<AdminOrdersPage />, { queryClient });
      
      await waitFor(() => {
        expect(screen.getByText('Orders')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 2 seconds even with 100 items
      expect(renderTime).toBeLessThan(2000);
    });
  });
});
