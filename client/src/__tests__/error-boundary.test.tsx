
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

describe('Error Boundary', () => {
  // Suppress console errors for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('should catch and display errors', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div>No error here</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('No error here')).toBeInTheDocument();
  });
});
