import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthContext } from '@/auth/AuthContext'
import type { AuthContextValue } from '@/auth/types'
import { AuthCallbackPage } from './AuthCallbackPage'

function renderCallback(overrides: Partial<AuthContextValue> = {}) {
  const value: AuthContextValue = {
    isAuthenticated: false,
    isLoading: true,
    error: null,
    user: null,
    signIn: vi.fn(async () => {}),
    signOut: vi.fn(async () => {}),
    ...overrides,
  }

  return render(
    <MemoryRouter initialEntries={['/auth/callback']}>
      <AuthContext.Provider value={value}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/requests/:requestId" element={<h1>Restored request</h1>} />
          <Route path="/sign-in" element={<h1>Sign in again</h1>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('AuthCallbackPage', () => {
  afterEach(() => window.history.replaceState({}, '', '/'))

  it('adopts the route restored by the OIDC callback', async () => {
    window.history.replaceState({}, '', '/requests/REQ-1002')
    renderCallback({ isAuthenticated: true, isLoading: false })

    expect(await screen.findByRole('heading', { name: 'Restored request' })).toBeInTheDocument()
  })

  it('shows callback failures and allows another sign-in attempt', async () => {
    const user = userEvent.setup()
    renderCallback({ isLoading: false, error: new Error('State expired') })

    expect(screen.getByRole('alert')).toHaveTextContent('State expired')
    await user.click(screen.getByRole('button', { name: 'Back to sign-in' }))
    expect(await screen.findByRole('heading', { name: 'Sign in again' })).toBeInTheDocument()
  })

  it('reports progress while the token exchange is running', () => {
    renderCallback()

    expect(screen.getByText('Completing sign-in…')).toBeInTheDocument()
  })
})
