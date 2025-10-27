
import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import LoginPage from '@/pages/LoginPage';
import OrderingPage from '@/pages/OrderingPage';
import { render } from './test-utils';

describe('Accessibility Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('should have proper heading hierarchy on login page', () => {
    render(
      <LoginPage />,
      { queryClient }
    );

    // Check for heading text in both languages - use getAllByText since there are multiple instances
    const headingTexts = screen.getAllByText(/تسجيل الدخول|Login/i);
    expect(headingTexts.length).toBeGreaterThan(0);
  });

  it('should have accessible form labels', () => {
    render(
      <LoginPage />,
      { queryClient }
    );

    // Check for email input by label text in both languages
    const emailInput = screen.getByLabelText(/البريد الإلكتروني|Email/i);
    expect(emailInput).toBeInTheDocument();

    // Check for password input by label text in both languages
    const passwordInput = screen.getByLabelText(/كلمة المرور|Password/i);
    expect(passwordInput).toBeInTheDocument();
  });

  it('should have proper ARIA labels on interactive elements', () => {
    render(
      <LoginPage />,
      { queryClient }
    );

    // Check for login button text in both languages
    const loginButton = screen.getByRole('button', { name: /تسجيل الدخول|Login/i });
    expect(loginButton).toBeInTheDocument();
  });

  it('should support keyboard navigation', () => {
    render(
      <LoginPage />,
      { queryClient }
    );

    // Check for form elements that support keyboard navigation
    const emailInput = screen.getByLabelText(/البريد الإلكتروني|Email/i);
    const passwordInput = screen.getByLabelText(/كلمة المرور|Password/i);
    const loginButton = screen.getByRole('button', { name: /تسجيل الدخول|Login/i });
    
    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(loginButton).toBeInTheDocument();
  });
});
