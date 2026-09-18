import type { ReactNode } from 'react'
import { AuthProvider as OidcProvider } from 'react-oidc-context'
import { setAccessTokenProvider } from '@/api/http'
import { env } from '@/config/env'
import { MockAuthProvider } from './MockAuthProvider'
import { OidcAuthAdapter } from './OidcAuthAdapter'
import { buildOidcConfig } from './oidcConfig'
import { getAccessToken } from './tokenStore'

// Wired at module load, before anything renders, so the very first API call
// already carries the bearer token.
setAccessTokenProvider(getAccessToken)

/**
 * Selects the authentication implementation from configuration. Both branches
 * publish the same `AuthContext`, so nothing downstream knows the difference.
 */
export function AppAuthProvider({ children }: { children: ReactNode }) {
  if (env.auth.mode === 'mock') {
    return <MockAuthProvider>{children}</MockAuthProvider>
  }

  return (
    <OidcProvider {...buildOidcConfig()}>
      <OidcAuthAdapter>{children}</OidcAuthAdapter>
    </OidcProvider>
  )
}
