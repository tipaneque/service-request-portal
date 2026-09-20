import { afterEach, describe, expect, it } from 'vitest'
import { buildOidcConfig } from './oidcConfig'

describe('OIDC callback configuration', () => {
  afterEach(() => window.history.replaceState({}, '', '/'))

  it('restores the internal route carried through the OIDC state', () => {
    const callback = buildOidcConfig().onSigninCallback

    callback?.({ state: { returnTo: '/requests/REQ-1002?from=queue' } } as never)

    expect(window.location.pathname).toBe('/requests/REQ-1002')
    expect(window.location.search).toBe('?from=queue')
  })

  it('rejects external or missing return locations', () => {
    const callback = buildOidcConfig().onSigninCallback

    for (const unsafe of ['//attacker.example', '/\\attacker.example']) {
      callback?.({ state: { returnTo: unsafe } } as never)
      expect(window.location.pathname).toBe('/requests')
    }
  })
})
