import { WebStorageStateStore } from 'oidc-client-ts'
import type { AuthProviderProps } from 'react-oidc-context'
import { env } from '@/config/env'

/**
 * OIDC client configuration.
 *
 * Security choices worth calling out:
 *  - Authorization Code flow with PKCE, no implicit flow, no client secret
 *    (a public browser client must never hold one).
 *  - Tokens are kept in `sessionStorage`, so they are scoped to the tab and
 *    cleared when it closes. They are never written to `localStorage` or to a
 *    cookie readable by script.
 *  - Silent renew keeps the access token fresh without a full page redirect.
 */
export function buildOidcConfig(): AuthProviderProps {
  return {
    authority: env.auth.authority,
    client_id: env.auth.clientId,
    redirect_uri: env.auth.redirectUri,
    post_logout_redirect_uri: env.auth.postLogoutRedirectUri,
    scope: env.auth.scope,
    response_type: 'code',
    automaticSilentRenew: true,
    loadUserInfo: true,
    // Some providers (e.g. Auth0) require an explicit audience to issue a JWT
    // access token for the API rather than an opaque one.
    ...(env.auth.audience ? { extraQueryParams: { audience: env.auth.audience } } : {}),
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
    // Strip `code`/`state` from the address bar once the callback is processed
    // so the authorization code never lingers in history or a shared URL.
    onSigninCallback: () => {
      window.history.replaceState({}, document.title, window.location.pathname)
    },
  }
}
