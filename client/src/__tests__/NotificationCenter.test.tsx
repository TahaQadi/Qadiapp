import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationCenter } from '../components/NotificationCenter';
import { LanguageProvider } from '../components/LanguageProvider';
import * as queryClient from '../lib/queryClient';

// Mock dependencies
vi.mock('wouter', () => ({
  useLocation: () => ['/dashboard', vi.fn()],
}));

vi.mock('../lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: {
    invalidateQueries: vi.fn(),
  },
}));

// Mock notification data
const mockNotifications = [
  {
    id: '1',
    type: 'order_created',
    titleEn: 'Order Created',
    titleAr: 'تم إنشاء الطلب',
    messageEn: 'Your order #123 has been created',
    messageAr: 'تم إنشاء طلبك رقم 123',
    isRead: false,
    createdAt: new Date().toISOString(),
    actionUrl: '/orders/123',
    actionType: 'view_order',
  },
  {
    id: '2',
    type: 'order_status_changed',
    titleEn: 'Order Status Changed',
    titleAr: 'تغيرت حالة الطلب',
    messageEn: 'Your order status has been updated',
    messageAr: 'تم تحديث حالة طلبك',
    isRead: true,
    createdAt: new Date().toISOString(),
    actionUrl: '/orders/456',
    actionType: 'view_order',
  },
  {
    id: '3',
    type: 'system',
    titleEn: 'System Message',
    titleAr: 'رسالة النظام',
    messageEn: 'Important system update',
    messageAr: 'تحديث مهم للنظام',
    isRead: false,
    pdfFileName: 'document.pdf',
    createdAt: new Date().toISOString(),
  },
];

// Wrapper component with providers
const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={testQueryClient}>
      <LanguageProvider>{children}</LanguageProvider>
    </QueryClientProvider>
  );
};

describe('NotificationCenter Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render notification bell icon', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
      );

      render(
        <Wrapper>
          <NotificationCenter />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('button')).toBeInTheDocument();
      });
    });

    it('should show unread count badge when there are unread notifications', async () => {
      global.fetch = vi.fn((url) => {
        if (url.includes('unread-count')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ count: 5 }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response);
      });

      render(
        <Wrapper>
          <NotificationCenter />
        </Wrapper>
      );

      await waitFor(() => {
        const badge = screen.queryByText('5');
        expect(badge).toBeInTheDocument();
      });
    });

    it('should not show badge when count is zero', async () => {
      global.fetch = vi.fn((url) => {
        if (url.includes('unread-count')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ count: 0 }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response);
      });

      render(
        <Wrapper>
          <NotificationCenter />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.queryByText('0')).not.toBeInTheDocument();
      });
    });

    it('should show 99+ for count over 99', async () => {
      global.fetch = vi.fn((url) => {
        if (url.includes('unread-count')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ count: 150 }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response);
      });

      render(
        <Wrapper>
          <NotificationCenter />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.queryByText('99+')).toBeInTheDocument();
      });
    });
  });

  describe('Popover Interaction', () => {
    it('should open popover when bell icon is clicked', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
      );

      render(
        <Wrapper>
          <NotificationCenter />
        </Wrapper>
      );

      const button = await screen.findByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.queryByText('Notifications')).toBeInTheDocument();
      });
    });

    it('should show loading state', async () => {
      global.fetch = vi.fn(() => new Promise(() => {})); // Never resolves

      render(
        <Wrapper>
          <NotificationCenter />
        </Wrapper>
      );

      const button = await screen.findByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).toBeInTheDocument();
      });
    });

    it('should show empty state when no notifications', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
      );

      render(
        <Wrapper>
          <NotificationCenter />
        </Wrapper>
      );

      const button = await screen.findByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.queryByText('No notifications')).toBeInTheDocument();
      });
    });
  });

  describe('Notification Display', () => {
    it('should display notifications in list', async () => {
      global.fetch = vi.fn((url) => {
        if (url.includes('unread-count')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ count: 2 }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockNotifications),
        } as Response);
      });

      render(
        <Wrapper>
          <NotificationCenter />
        </Wrapper>
      );

      const button = await screen.findByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.queryByText('Order Created')).toBeInTheDocument();
        expect(screen.queryByText('Order Status Changed')).toBeInTheDocument();
        expect(screen.queryByText('System Message')).toBeInTheDocument();
      });
    });

    it('should show unread indicator for unread notifications', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockNotifications[0]]),
        } as Response)
      );

      render(
        <Wrapper>
          <NotificationCenter />
        </Wrapper>
      );

      const button = await screen.findByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const notification = screen.getByText('Order Created').closest('div');
        expect(notification).toHaveClass('bg-muted/30'); // Unread background
      });
    });

    it('should show action button for notifications with actions', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockNotifications[0]]),
        } as Response)
      );

      render(
        <Wrapper>
          <NotificationCenter />
        </Wrapper>
      );

      const button = await screen.findByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.queryByText('View Order')).toBeInTheDocument();
      });
    });

    it('should show PDF download button when pdfFileName exists', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockNotifications[2]]),
        } as Response)
      );

      render(
        <Wrapper>
          <NotificationCenter />
        </Wrapper>
      );

      const button = await screen.findByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.queryByText('Download PDF')).toBeInTheDocument();
      });
    });
  });

  describe('Notification Actions', () => {
    it('should mark notification as read when mark as read button is clicked', async () => {
      const apiRequestMock = vi.fn().mockResolvedValue({});
      vi.mocked(queryClient.apiRequest).mockImplementation(apiRequestMock);

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockNotifications[0]]),
        } as Response)
      );

      render(
        <Wrapper>
          <NotificationCenter />
        </Wrapper>
      );

      const bellButton = await screen.findByRole('button');
      fireEvent.click(bellButton);

      await waitFor(() => {
        const markAsReadButtons = screen.getAllByRole('button');
        const markAsReadButton = markAsReadButtons.find((btn) =>
          btn.querySelector('svg')
        );
        if (markAsReadButton) {
          fireEvent.click(markAsReadButton);
        }
      });

      await waitFor(() => {
        expect(apiRequestMock).toHaveBeenCalledWith(
          'PATCH',
          expect.stringContaining('/api/client/notifications/1/read')
        );
      });
    });

    it('should delete notification when delete button is clicked', async () => {
      const apiRequestMock = vi.fn().mockResolvedValue({});
      vi.mocked(queryClient.apiRequest).mockImplementation(apiRequestMock);

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockNotifications[0]]),
        } as Response)
      );

      render(
        <Wrapper>
          <NotificationCenter />
        </Wrapper>
      );

      const bellButton = await screen.findByRole('button');
      fireEvent.click(bellButton);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        // Find delete button (Trash2 icon)
        const deleteButton = buttons.find((btn) => {
          const svg = btn.querySelector('svg');
          return svg && svg.classList.contains('lucide-trash-2');
        });
        if (deleteButton) {
          fireEvent.click(deleteButton);
        }
      });

      await waitFor(() => {
        expect(apiRequestMock).toHaveBeenCalledWith(
          'DELETE',
          expect.stringContaining('/api/client/notifications/1')
        );
      });
    });

    it('should mark all as read when button is clicked', async () => {
      const apiRequestMock = vi.fn().mockResolvedValue({});
      vi.mocked(queryClient.apiRequest).mockImplementation(apiRequestMock);

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockNotifications[0], mockNotifications[2]]),
        } as Response)
      );

      render(
        <Wrapper>
          <NotificationCenter />
        </Wrapper>
      );

      const bellButton = await screen.findByRole('button');
      fireEvent.click(bellButton);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        // Find mark all as read button (CheckCheck icon)
        const markAllButton = buttons.find((btn) => {
          const svg = btn.querySelector('svg');
          return svg && svg.classList.contains('lucide-check-check');
        });
        if (markAllButton) {
          fireEvent.click(markAllButton);
        }
      });

      await waitFor(() => {
        expect(apiRequestMock).toHaveBeenCalledWith(
          'PATCH',
          '/api/client/notifications/mark-all-read'
        );
      });
    });
  });

  describe('Bilingual Support', () => {
    it('should display English text by default', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockNotifications[0]]),
        } as Response)
      );

      render(
        <Wrapper>
          <NotificationCenter />
        </Wrapper>
      );

      const button = await screen.findByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.queryByText('Order Created')).toBeInTheDocument();
        expect(screen.queryByText('Your order #123 has been created')).toBeInTheDocument();
      });
    });
  });

  describe('Variants', () => {
    it('should render sidebar variant', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
      );

      render(
        <Wrapper>
          <NotificationCenter variant="sidebar" />
        </Wrapper>
      );

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveClass('w-full', 'justify-start');
      });
    });

    it('should render default variant', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response)
      );

      render(
        <Wrapper>
          <NotificationCenter variant="default" />
        </Wrapper>
      );

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveClass('rounded-full');
      });
    });
  });
});

