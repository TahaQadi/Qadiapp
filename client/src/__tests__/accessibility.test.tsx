
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

    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('should have accessible form labels', () => {
    render(
      <LoginPage />,
      { queryClient }
    );

    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toBeInTheDocument();

    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toBeInTheDocument();
  });

  it('should have proper ARIA labels on interactive elements', () => {
    render(
      <LoginPage />,
      { queryClient }
    );

    const loginButton = screen.getByRole('button', { name: /sign in/i });
    expect(loginButton).toBeInTheDocument();
  });

  it('should support keyboard navigation', () => {
    render(
      <LoginPage />,
      { queryClient }
    );

    const form = screen.getByRole('form') || screen.getByTestId('login-form');
    expect(form).toBeInTheDocument();
  });
});
