import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { userEvent } from '@testing-library/user-event';
import { render } from './test-utils';
import ClientPriceOffersPage from '@/pages/ClientPriceOffersPage';

// Mock the auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', nameEn: 'Test User', isAdmin: false },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// Mock the language hook
vi.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({ language: 'en' }),
}));

// Mock wouter
vi.mock('wouter', () => ({
  useLocation: () => ['/price-offers', vi.fn()],
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

const mockOffers = [
  {
    id: 'offer-1',
    offerNumber: 'OFFER-001',
    clientId: '1',
    items: JSON.stringify([
      { productId: 'prod-1', sku: 'SKU-001', nameEn: 'Test Product', nameAr: 'منتج تجريبي', quantity: 10, unitPrice: '100.00' },
    ]),
    subtotal: '1000.00',
    tax: '0.00',
    total: '1000.00',
    status: 'sent',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'offer-2',
    offerNumber: 'OFFER-002',
    clientId: '1',
    items: JSON.stringify([
      { productId: 'prod-2', sku: 'SKU-002', nameEn: 'Another Product', nameAr: 'منتج آخر', quantity: 5, unitPrice: '150.00' },
    ]),
    subtotal: '750.00',
    tax: '0.00',
    total: '750.00',
    status: 'pending',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
];

describe('Price Offers Flow E2E', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock fetch for API calls
    global.fetch = vi.fn((url) => {
      if (typeof url === 'string') {
        if (url.includes('/api/price-offers')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockOffers),
          });
        }
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' }),
      });
    }) as any;
  });

  it('should display price offers list', async () => {
    render(<ClientPriceOffersPage />, { queryClient });

    // Wait for offers to load
    await waitFor(() => {
      expect(screen.getByText('OFFER-001')).toBeInTheDocument();
    });

    // Check if offers are displayed
    expect(screen.getByText('OFFER-002')).toBeInTheDocument();
  });

  it('should view a price offer', async () => {
    const user = userEvent.setup();
    
    render(<ClientPriceOffersPage />, { queryClient });

    // Wait for offers to load
    await waitFor(() => {
      expect(screen.getByText('OFFER-001')).toBeInTheDocument();
    });

    // Find and click view button
    const viewButtons = screen.getAllByLabelText(/view|عرض/i);
    if (viewButtons.length > 0) {
      await user.click(viewButtons[0]);
      
      // Wait for dialog to open
      await waitFor(() => {
        const dialog = screen.queryByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });
    }
  });

  it('should open accept dialog for a price offer', async () => {
    const user = userEvent.setup();
    
    render(<ClientPriceOffersPage />, { queryClient });

    // Wait for offers to load
    await waitFor(() => {
      expect(screen.getByText('OFFER-001')).toBeInTheDocument();
    });

    // Find and click accept button
    const acceptButtons = screen.getAllByLabelText(/accept|قبول/i);
    if (acceptButtons.length > 0) {
      await user.click(acceptButtons[0]);
      
      // Wait for response dialog to open
      await waitFor(() => {
        const dialog = screen.queryByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });
    }
  });

  it('should open reject dialog for a price offer', async () => {
    const user = userEvent.setup();
    
    render(<ClientPriceOffersPage />, { queryClient });

    // Wait for offers to load
    await waitFor(() => {
      expect(screen.getByText('OFFER-001')).toBeInTheDocument();
    });

    // Find and click reject button
    const rejectButtons = screen.getAllByLabelText(/reject|رفض/i);
    if (rejectButtons.length > 0) {
      await user.click(rejectButtons[0]);
      
      // Wait for response dialog to open
      await waitFor(() => {
        const dialog = screen.queryByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });
    }
  });
});
