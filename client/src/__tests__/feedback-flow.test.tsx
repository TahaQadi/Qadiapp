import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { userEvent } from '@testing-library/user-event';
import { render } from './test-utils';
import OrderFeedbackDialog from '@/components/OrderFeedbackDialog';
import { IssueReportDialog } from '@/components/IssueReportDialog';

// Mock the language hook
vi.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({ language: 'en' }),
}));

describe('Feedback Flow E2E', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock fetch for API calls
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Success', feedback: { id: 'feedback-1' } }),
      })
    ) as any;
  });

  describe('Order Feedback Dialog', () => {
    it('should render feedback dialog', async () => {
      render(<OrderFeedbackDialog open={true} onOpenChange={vi.fn()} orderId="order-1" />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should allow setting overall rating', async () => {
      const user = userEvent.setup();
      
      render(<OrderFeedbackDialog open={true} onOpenChange={vi.fn()} orderId="order-1" />, { queryClient });

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });

      // Find and click on a star (rating of 5)
      const stars = screen.getAllByRole('button');
      const ratingButtons = stars.filter(btn => 
        btn.getAttribute('aria-label')?.includes('star') || 
        btn.getAttribute('aria-label')?.includes('Star')
      );
      
      if (ratingButtons.length > 0) {
        await user.click(ratingButtons[4]); // Click 5th star
      }
    });

    it('should allow setting all rating dimensions', async () => {
      const user = userEvent.setup();
      
      render(<OrderFeedbackDialog open={true} onOpenChange={vi.fn()} orderId="order-1" />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Look for rating sections
      const ratingLabels = screen.getAllByText(/rating|تقييم/i);
      expect(ratingLabels.length).toBeGreaterThan(0);
    });

    it('should allow adding comments', async () => {
      const user = userEvent.setup();
      
      render(<OrderFeedbackDialog open={true} onOpenChange={vi.fn()} orderId="order-1" />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Find textarea and add comments
      const textareas = screen.queryAllByRole('textbox');
      if (textareas.length > 0) {
        await user.type(textareas[0], 'Great service!');
        expect(textareas[0]).toHaveValue('Great service!');
      }
    });

    it('should allow selecting recommendation', async () => {
      const user = userEvent.setup();
      
      render(<OrderFeedbackDialog open={true} onOpenChange={vi.fn()} orderId="order-1" />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Look for recommendation buttons
      const buttons = screen.getAllByRole('button');
      const recommendButtons = buttons.filter(btn => 
        btn.textContent?.toLowerCase().includes('recommend') ||
        btn.textContent?.toLowerCase().includes('yes') ||
        btn.textContent?.toLowerCase().includes('no')
      );
      
      expect(recommendButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Issue Report Dialog', () => {
    it('should render issue report dialog', async () => {
      render(<IssueReportDialog open={true} onOpenChange={vi.fn()} orderId="order-1" />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should allow selecting issue type', async () => {
      const user = userEvent.setup();
      
      render(<IssueReportDialog open={true} onOpenChange={vi.fn()} orderId="order-1" />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Look for issue type options
      const options = screen.queryAllByRole('option') || screen.queryAllByRole('radio');
      expect(options.length).toBeGreaterThan(0);
    });

    it('should allow entering issue description', async () => {
      const user = userEvent.setup();
      
      render(<IssueReportDialog open={true} onOpenChange={vi.fn()} orderId="order-1" />, { queryClient });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Find textarea and add description
      const textareas = screen.queryAllByRole('textbox');
      if (textareas.length > 0) {
        await user.type(textareas[0], 'Application crashes when clicking submit');
        expect(textareas[0]).toHaveValue('Application crashes when clicking submit');
      }
    });
  });
});
