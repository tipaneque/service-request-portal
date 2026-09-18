import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AppAuthProvider } from '@/auth/AppAuthProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { createQueryClient } from '@/app/queryClient'
import { AppRoutes } from '@/app/router'

/**
 * Composition root. Provider order matters: routing wraps auth because the
 * OIDC adapter and the guard both navigate, and the query client sits inside
 * so cached data is discarded together with the session on sign-out.
 */
export function App() {
  // Created once per mount rather than at module scope, so each test renders
  // against an isolated cache.
  const [queryClient] = useState(createQueryClient)

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppAuthProvider>
          <QueryClientProvider client={queryClient}>
            <AppRoutes />
          </QueryClientProvider>
        </AppAuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
