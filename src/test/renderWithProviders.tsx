import type { ReactElement, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, type RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppAuthProvider } from '@/auth/AppAuthProvider'

const MOCK_SESSION_KEY = 'srp.mock-session'

/** Puts the mock auth provider into a signed-in state before rendering. */
export function signIn(): void {
  window.sessionStorage.setItem(MOCK_SESSION_KEY, 'active')
}

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // Retries would turn an asserted failure into a multi-second wait.
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

interface RenderOptions {
  /** Initial history entry, e.g. `/requests?status=OPEN`. */
  route?: string
  /** Route pattern to mount `ui` under, for screens that read path params. */
  path?: string
}

export interface RenderWithProvidersResult extends RenderResult {
  user: ReturnType<typeof userEvent.setup>
  queryClient: QueryClient
}

/**
 * Renders a screen inside the same provider stack the application uses - auth,
 * query client and router - so tests exercise real wiring rather than a
 * stubbed-out approximation. The API is served by MSW.
 */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', path }: RenderOptions = {},
): RenderWithProvidersResult {
  const queryClient = createTestQueryClient()

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <AppAuthProvider>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </AppAuthProvider>
      </MemoryRouter>
    )
  }

  const result = render(path ? <Routes><Route path={path} element={ui} /></Routes> : ui, {
    wrapper: Wrapper,
  })

  return { ...result, user: userEvent.setup(), queryClient }
}
