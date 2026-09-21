/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // Worker threads start noticeably faster than forked processes here, and
    // nothing in the suite needs process isolation.
    pool: 'threads',
    setupFiles: ['./vitest.setup.ts'],
    css: false,
    restoreMocks: true,
    // jsdom plus a service-worker-less MSW round trip makes the first render of
    // a suite noticeably slower than the rest; the default 5s is tight for it.
    testTimeout: 15_000,
    env: {
      // Node's fetch rejects relative URLs, so tests address the mock API with
      // an absolute origin. MSW handlers are built from the same variable.
      VITE_API_BASE_URL: 'http://localhost/api',
      // MSW runs through `setupServer` in tests, not through the worker.
      VITE_ENABLE_API_MOCKS: 'false',
      VITE_AUTH_MODE: 'mock',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/main.tsx',
        'src/mocks/browser.ts',
        'src/api/schema.ts',
        'src/test/**',
      ],
      // A ratchet, not a target: set just under what the suite covers today so
      // the build fails when coverage slips, without demanding a round number.
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 82,
      },
    },
  },
})
