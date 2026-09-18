import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setUnauthorizedHandler } from '@/api/http'
import { AuthContext } from './AuthContext'
import { setAccessToken } from './tokenStore'
import type { AuthContextValue, AuthenticatedUser } from './types'

const STORAGE_KEY = 'srp.mock-session'

const MOCK_USER: AuthenticatedUser = {
  id: 'mock-user-1',
  name: 'Alex Agent',
  email: 'alex.agent@example.com',
}

/** Stand-in bearer token; the MSW handlers only check that one is present. */
const MOCK_TOKEN = 'mock-access-token'

function readStoredSession(): boolean {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === 'active'
  } catch {
    return false
  }
}

/**
 * Local sign-in used when `VITE_AUTH_MODE=mock`.
 *
 * It exercises exactly the same `AuthContextValue` contract as the OIDC
 * adapter - guard, bearer header, sign-out and 401 handling are identical - so
 * the app can be developed and tested end-to-end without provisioning an
 * identity provider. It is never a substitute for real auth in a deployed
 * environment.
 */
export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(readStoredSession)
  const [isLoading, setIsLoading] = useState(false)

  // Published during render so the token is in place before any child mounts
  // and starts fetching. See `tokenStore`.
  setAccessToken(isAuthenticated ? MOCK_TOKEN : null)

  const signOut = useCallback(async () => {
    setIsLoading(true)
    try {
      window.sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      /* storage unavailable - session state is in memory anyway */
    }
    setAccessToken(null)
    setIsAuthenticated(false)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut()
    })
  }, [signOut])

  const signIn = useCallback(async () => {
    setIsLoading(true)
    try {
      window.sessionStorage.setItem(STORAGE_KEY, 'active')
    } catch {
      /* storage unavailable - fall back to an in-memory session */
    }
    setAccessToken(MOCK_TOKEN)
    setIsAuthenticated(true)
    setIsLoading(false)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isLoading,
      error: null,
      user: isAuthenticated ? MOCK_USER : null,
      signIn,
      signOut,
    }),
    [isAuthenticated, isLoading, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
