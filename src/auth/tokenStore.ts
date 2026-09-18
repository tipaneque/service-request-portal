/**
 * Holds the current access token outside the React tree.
 *
 * Registering it from an effect is not good enough: effects run child-first, so
 * a screen that fetches on mount would issue its first request before the auth
 * provider's effect had run, and the API would answer `401`. The auth providers
 * therefore publish the token synchronously while rendering, and `apiFetch`
 * reads it here at request time - always the freshest value, including after a
 * silent renew.
 */
let currentToken: string | null = null

export function setAccessToken(token: string | null): void {
  currentToken = token
}

export function getAccessToken(): string | null {
  return currentToken
}
