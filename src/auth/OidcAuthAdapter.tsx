import { useMemo, type ReactNode } from 'react'
import { useAuth as useOidcAuth } from 'react-oidc-context'
import { setUnauthorizedHandler } from '@/api/http'
import { AuthContext } from './AuthContext'
import { setAccessToken } from './tokenStore'
import type { AuthContextValue } from './types'
import { normaliseReturnTo } from './returnTo'

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

  // Register synchronously for the same reason as the token: a child query can
  // start before parent effects run. The first 401 must still end the session.
  setUnauthorizedHandler(() => {
    setAccessToken(null)
    void oidc.removeUser()
  })

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
      signIn: async (returnTo?: string) => {
        await oidc.signinRedirect({
          state: { returnTo: normaliseReturnTo(returnTo) },
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
