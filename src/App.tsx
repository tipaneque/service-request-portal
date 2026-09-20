import { useState, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AppAuthProvider } from '@/auth/AppAuthProvider'
import { useAuth } from '@/auth/AuthContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Alert } from '@/components/Alert'
import { createQueryClient } from '@/app/queryClient'
import { AppRoutes } from '@/app/router'
import { env } from '@/config/env'

/**
 * Composition root. Provider order matters: routing wraps auth because the
 * OIDC adapter and the guard both navigate, and the query client sits inside
 * so cached data is discarded together with the session on sign-out.
 */
function QuerySession({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

/**
 * A query client belongs to one authenticated session. Keying this boundary by
 * the subject id destroys the old cache synchronously on sign-out or account
 * change, so data from one user can never be rendered to the next user.
 */
export function SessionQueryProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const sessionKey = isAuthenticated ? `user:${user?.id ?? 'unknown'}` : 'anonymous'

  return <QuerySession key={sessionKey}>{children}</QuerySession>
}

export function App() {
  if (env.hasUnsafeProductionAuth) {
    return (
      <main className="app-main">
        <Alert tone="error" title="Production authentication is not configured">
          <p>
            This build was created with mock authentication. Configure the OIDC environment
            variables and rebuild the portal before deployment.
          </p>
        </Alert>
      </main>
    )
  }
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppAuthProvider>
          <SessionQueryProvider>
            <AppRoutes />
          </SessionQueryProvider>
        </AppAuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
