export interface AuthenticatedUser {
  /** OIDC subject identifier. */
  id: string
  name: string
  email: string | undefined
}

/**
 * Provider-agnostic authentication surface used by the whole application.
 *
 * Components never import `react-oidc-context` directly: they consume this
 * context instead, which keeps the OIDC library swappable and lets tests run
 * against a lightweight fake session.
 */
export interface AuthContextValue {
  isAuthenticated: boolean
  /** True while the session is being restored or a redirect is in flight. */
  isLoading: boolean
  /** Sign-in/renewal failure, surfaced to the user as an auth error state. */
  error: Error | null
  user: AuthenticatedUser | null
  /** Starts sign-in and, where supported, returns to this internal route. */
  signIn: (returnTo?: string) => Promise<void>
  signOut: () => Promise<void>
}
