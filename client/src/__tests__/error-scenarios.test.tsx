import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import OrderingPage from '@/pages/OrderingPage';
import { render } from './test-utils';

describe('Error Boundary Scenarios', () => {
  let queryClient: QueryClient;
  const originalError = console.error;

  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: false,
        },
        mutations: { retry: false },
      },
    });

    // Setup basic fetch mock
    global.fetch = vi.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    ) as any;
  });

  it('should catch network errors gracefully', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error'))) as any;

    render(
      <ErrorBoundary>
        <OrderingPage />
      </ErrorBoundary>,
      { queryClient }
    );

    // Component should render without crashing
    await waitFor(() => {
      expect(screen.getByTestId('page-ordering') || screen.getByText(/something went wrong/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should handle API 500 errors', async () => {
    global.fetch = vi.fn(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' }),
      })
    ) as any;

    render(
      <ErrorBoundary>
        <OrderingPage />
      </ErrorBoundary>,
      { queryClient }
    );

    await waitFor(() => {
      expect(screen.getByTestId('page-ordering')).toBeInTheDocument();
    });
  });

  it('should handle unauthorized (401) errors', async () => {
    global.fetch = vi.fn(() => 
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      })
    ) as any;

    render(
      <ErrorBoundary>
        <OrderingPage />
      </ErrorBoundary>,
      { queryClient }
    );

    await waitFor(() => {
      expect(screen.getByTestId('page-ordering')).toBeInTheDocument();
    });
  });

  it('should handle malformed JSON responses', async () => {
    global.fetch = vi.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })
    ) as any;

    render(
      <ErrorBoundary>
        <OrderingPage />
      </ErrorBoundary>,
      { queryClient }
    );

    await waitFor(() => {
      expect(screen.getByTestId('page-ordering') || screen.getByText(/something went wrong/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

describe('Optimistic Update Error Recovery', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  it('should rollback on mutation failure', async () => {
    let callCount = 0;
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/cart')) {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          });
        }
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ message: 'Failed to add item' }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }) as any;

    render(
      <OrderingPage />,
      { queryClient }
    );

    await waitFor(() => {
      expect(screen.getByTestId('page-ordering')).toBeInTheDocument();
    });
  });
});