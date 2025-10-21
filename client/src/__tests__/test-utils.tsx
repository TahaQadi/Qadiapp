import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@/components/LanguageProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { HelmetProvider } from 'react-helmet-async';

import { vi } from 'vitest';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(),
    },
  }),
}));

// Mock wouter
vi.mock('wouter', () => ({
  useLocation: () => ['/', vi.fn()],
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  Redirect: ({ to }: { to: string }) => <div data-testid="redirect" data-to={to} />,
  Route: ({ children, path }: { children: React.ReactNode; path: string }) => (
    <div data-testid="route" data-path={path}>{children}</div>
  ),
  Switch: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="switch">{children}</div>
  ),
}));

// Mock auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', nameEn: 'Test User', isAdmin: false },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  usePageTracking: () => {},
}));

import { vi } from 'vitest';
import { render as rtlRender } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock error monitoring
vi.mock('@/lib/errorMonitoring', () => ({
  errorMonitoring: {
    captureError: vi.fn(),
  },
}));

// Mock performance monitoring
vi.mock('@/lib/performanceMonitoring', () => ({
  performanceMonitoring: {
    getMetrics: () => ({}),
  },
}));

// Mock auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock fetch
global.fetch = vi.fn();

// Custom render function
export function render(
  ui: React.ReactElement,
  { queryClient, ...options }: { queryClient?: QueryClient; [key: string]: any } = {}
) {
  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return rtlRender(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>,
    options
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

const AllTheProviders = ({ children, queryClient }: { children: React.ReactNode; queryClient?: QueryClient }) => {
  const client = queryClient || new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <HelmetProvider>
      <QueryClientProvider client={client}>
        <ThemeProvider>
          <LanguageProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => render(ui, { wrapper: (props) => <AllTheProviders {...props} queryClient={options.queryClient} />, ...options });

export * from '@testing-library/react';
export { customRender as render };