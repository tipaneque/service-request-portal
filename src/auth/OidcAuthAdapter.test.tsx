import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { apiFetch } from '@/api/http'
import { server } from '@/mocks/server'
import { useAuth } from './AuthContext'
import { OidcAuthAdapter } from './OidcAuthAdapter'
import { getAccessToken } from './tokenStore'

const oidc = vi.hoisted(() => ({
  user: {
    access_token: 'oidc-access-token',
    profile: { sub: 'user-7', name: 'OIDC User', email: 'oidc@example.com' },
  },
  isAuthenticated: true,
  isLoading: false,
  activeNavigator: undefined,
  error: null,
  signinRedirect: vi.fn(async () => {}),
  signoutRedirect: vi.fn(async () => {}),
  removeUser: vi.fn(async () => {}),
}))

vi.mock('react-oidc-context', () => ({ useAuth: () => oidc }))

function Consumer() {
  const auth = useAuth()
  return (
    <>
      <p>{auth.user?.name}</p>
      <button type="button" onClick={() => void auth.signIn('/requests/REQ-1002')}>
        Sign in
      </button>
      <button type="button" onClick={() => void auth.signOut()}>
        Sign out
      </button>
    </>
  )
}

describe('OidcAuthAdapter', () => {
  it('maps the OIDC user, publishes the token and preserves a safe return route', async () => {
    const user = userEvent.setup()
    render(
      <OidcAuthAdapter>
        <Consumer />
      </OidcAuthAdapter>,
    )

    expect(screen.getByText('OIDC User')).toBeInTheDocument()
    expect(getAccessToken()).toBe('oidc-access-token')

    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(oidc.signinRedirect).toHaveBeenCalledWith({
      state: { returnTo: '/requests/REQ-1002' },
    })
  })

  it('clears the token before redirecting sign-out to the provider', async () => {
    const user = userEvent.setup()
    render(
      <OidcAuthAdapter>
        <Consumer />
      </OidcAuthAdapter>,
    )

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(getAccessToken()).toBeNull()
    expect(oidc.signoutRedirect).toHaveBeenCalled()
  })

  it('removes the OIDC session when the first API request returns 401', async () => {
    render(
      <OidcAuthAdapter>
        <Consumer />
      </OidcAuthAdapter>,
    )
    server.use(
      http.get('http://localhost/api/requests', () =>
        HttpResponse.json({ title: 'Unauthorized', status: 401 }, { status: 401 }),
      ),
    )

    await expect(apiFetch({ path: '/requests' })).rejects.toMatchObject({ status: 401 })

    expect(getAccessToken()).toBeNull()
    expect(oidc.removeUser).toHaveBeenCalled()
  })
})
