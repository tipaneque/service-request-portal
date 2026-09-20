import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext } from '@/auth/AuthContext'
import type { AuthContextValue } from '@/auth/types'
import { SignInPage } from './SignInPage'

describe('SignInPage', () => {
  it('passes the originally requested route into the sign-in flow', async () => {
    const signIn = vi.fn(async () => {})
    const auth: AuthContextValue = {
      isAuthenticated: false,
      isLoading: false,
      error: null,
      user: null,
      signIn,
      signOut: vi.fn(async () => {}),
    }

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/sign-in',
            state: { from: { pathname: '/requests/REQ-1002', search: '?from=queue' } },
          },
        ]}
      >
        <AuthContext.Provider value={auth}>
          <SignInPage />
        </AuthContext.Provider>
      </MemoryRouter>,
    )

    await userEvent.setup().click(screen.getByRole('button', { name: 'Sign in' }))

    expect(signIn).toHaveBeenCalledWith('/requests/REQ-1002?from=queue')
  })
})
