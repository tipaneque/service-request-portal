import { useEffect, useMemo, type ReactNode } from 'react'
import { useAuth as useOidcAuth } from 'react-oidc-context'
import { setUnauthorizedHandler } from '@/api/http'
import { AuthContext } from './AuthContext'
import { setAccessToken } from './tokenStore'
import type { AuthContextValue } from './types'

/**
 * Maps `react-oidc-context` state onto the application's `AuthContextValue`
 * and publishes the access token to the HTTP layer.
 */
export function OidcAuthAdapter({ children }: { children: ReactNode }) {
  const oidc = useOidcAuth()

  // Published during render, not from an effect, so a child that fetches on
  // mount already has a token; a silently renewed token lands here too, since
  // `react-oidc-context` re-renders with the new user. See `tokenStore`.
  setAccessToken(oidc.user?.access_token ?? null)

  useEffect(() => {
    setUnauthorizedHandler(() => {
      // The API rejected the token: drop the local session so the guard sends
      // the user back to the provider.
      setAccessToken(null)
      void oidc.removeUser()
    })
  }, [oidc])

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: oidc.isAuthenticated,
      isLoading: oidc.isLoading || oidc.activeNavigator !== undefined,
      error: oidc.error ?? null,
      user: oidc.user
        ? {
            id: oidc.user.profile.sub,
            name:
              oidc.user.profile.name ??
              oidc.user.profile.preferred_username ??
              oidc.user.profile.email ??
              oidc.user.profile.sub,
            email: oidc.user.profile.email,
          }
        : null,
      signIn: async () => {
        await oidc.signinRedirect({
          state: { returnTo: window.location.pathname + window.location.search },
        })
      },
      signOut: async () => {
        setAccessToken(null)
        // End the session at the provider too, otherwise the next sign-in is
        // silently re-authenticated and "sign out" looks broken.
        await oidc.signoutRedirect()
      },
    }),
    [oidc],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
