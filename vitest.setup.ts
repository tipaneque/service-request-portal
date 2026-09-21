import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll, expect, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { toHaveNoViolations } from 'jest-axe'
import { resetDb } from './src/mocks/db'
import { server } from './src/mocks/server'

// `matchMedia` is not implemented in jsdom but is used by the responsive layout.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Lets any test assert `expect(await axe(container)).toHaveNoViolations()`.
expect.extend(toHaveNoViolations)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
  cleanup()
  // Each test starts from the same data, handlers and session.
  server.resetHandlers()
  resetDb()
  window.sessionStorage.clear()
})

afterAll(() => server.close())
