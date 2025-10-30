
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { userEvent } from '@testing-library/user-event';
import { render } from './test-utils';
import OnboardingPage from '@/pages/OnboardingPage';

// Mock wouter
vi.mock('wouter', () => ({
  useLocation: () => ['/', vi.fn()],
}));

describe('Onboarding E2E Flow', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  beforeEach(() => {
    // Mock fetch for API calls
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          clientId: 'test-client-id', 
          isFirstUser: false,
          message: 'Onboarding completed successfully' 
        }),
      })
    ) as any;
  });

  it('should complete full onboarding process', async () => {
    const user = userEvent.setup();
    
    render(
      <OnboardingPage />,
      { queryClient }
    );

    // Step 1: User Account
    const emailInput = screen.getByTestId('input-user-email');
    await user.type(emailInput, 'test@example.com');

    const passwordInput = screen.getByTestId('input-user-password');
    await user.type(passwordInput, 'password123');

    const confirmPasswordInput = screen.getByTestId('input-user-confirm-password');
    await user.type(confirmPasswordInput, 'password123');

    const nextButton = screen.getByTestId('button-next');
    await user.click(nextButton);

    // Step 2: Company Info
    await waitFor(() => {
      expect(screen.getByTestId('input-company-name-ar')).toBeInTheDocument();
    });

    const companyNameAr = screen.getByTestId('input-company-name-ar');
    await user.type(companyNameAr, 'شركة تجريبية');

    await user.click(nextButton);

    // Verify we moved to step 3
    await waitFor(() => {
      expect(screen.getByTestId('input-location-name-ar')).toBeInTheDocument();
    });
  });

  it('should navigate through all onboarding steps', async () => {
    const user = userEvent.setup();
    
    render(<OnboardingPage />, { queryClient });

    // Verify starting at step 1
    await waitFor(() => {
      expect(screen.getByTestId('input-user-email')).toBeInTheDocument();
    });

    // Complete step 1
    await user.type(screen.getByTestId('input-user-email'), 'complete@example.com');
    await user.type(screen.getByTestId('input-user-password'), 'password123');
    await user.type(screen.getByTestId('input-user-confirm-password'), 'password123');
    
    const nextButton = screen.getByTestId('button-next');
    await user.click(nextButton);

    // Complete step 2 - Company
    await waitFor(() => {
      expect(screen.getByTestId('input-company-name-ar')).toBeInTheDocument();
    });
    await user.type(screen.getByTestId('input-company-name-ar'), 'شركة كاملة');
    await user.click(nextButton);

    // Complete step 3 - Location
    await waitFor(() => {
      expect(screen.getByTestId('input-location-name-ar')).toBeInTheDocument();
    });
    await user.type(screen.getByTestId('input-location-name-ar'), 'مقر رئيسي');
    await user.type(screen.getByTestId('input-location-address-ar'), '123 شارع الملك');
    
    // Simulate map click (setting latitude/longitude)
    const mapContainer = screen.queryByTestId('location-map');
    if (mapContainer) {
      await user.click(mapContainer);
    }
    
    await user.click(nextButton);

    // Complete step 4 - Departments
    await waitFor(() => {
      const deptInputs = screen.queryAllByTestId(/input-department-contact/i);
      expect(deptInputs.length).toBeGreaterThan(0);
    });
    await user.click(nextButton);

    // Should reach review step
    await waitFor(() => {
      const reviewButtons = screen.queryAllByText(/review|مراجعة/i);
      expect(reviewButtons.length).toBeGreaterThan(0);
    });
  });

  it('should handle validation errors', async () => {
    const user = userEvent.setup();
    
    render(<OnboardingPage />, { queryClient });

    // Try to proceed without filling required fields
    const nextButton = screen.getByTestId('button-next');
    await user.click(nextButton);

    // Should show validation errors
    await waitFor(() => {
      const errorMessages = screen.queryAllByText(/required|مطلوب/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });

  it('should validate password match', async () => {
    const user = userEvent.setup();
    
    render(<OnboardingPage />, { queryClient });

    // Enter mismatched passwords
    await user.type(screen.getByTestId('input-user-email'), 'mismatch@example.com');
    await user.type(screen.getByTestId('input-user-password'), 'password123');
    await user.type(screen.getByTestId('input-user-confirm-password'), 'differentpassword');

    const nextButton = screen.getByTestId('button-next');
    await user.click(nextButton);

    // Should show password mismatch error
    await waitFor(() => {
      const errorMessages = screen.queryAllByText(/match|مطابقة/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });
});
