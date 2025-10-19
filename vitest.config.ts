import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './client/src/__tests__/setup.ts',
    include: ['client/src/__tests__/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'client/src/components/**/*.{ts,tsx}',
        'client/src/pages/**/*.{ts,tsx}',
        'client/src/hooks/**/*.{ts,tsx}',
        'client/src/lib/**/*.{ts,tsx}',
      ],
      exclude: [
        'client/src/**/*.test.{ts,tsx}',
        'client/src/**/*.spec.{ts,tsx}',
        'client/src/__tests__/**',
        'client/src/components/ui/**',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
    reporters: ['verbose', 'html'],
    outputFile: {
      html: './test-results/index.html',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});