import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppAuthProvider } from './AppAuthProvider'
import { RequireAuth } from './RequireAuth'
import { getAccessToken } from './tokenStore'
import { SignInPage } from '@/pages/SignInPage'

function renderGuardedApp(route: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return {
    user: userEvent.setup(),
    ...render(
      <MemoryRouter initialEntries={[route]}>
        <AppAuthProvider>
          <QueryClientProvider client={queryClient}>
            <Routes>
              <Route path="/sign-in" element={<SignInPage />} />
              <Route element={<RequireAuth />}>
                <Route path="/requests" element={<h1>Protected requests</h1>} />
              </Route>
            </Routes>
          </QueryClientProvider>
        </AppAuthProvider>
      </MemoryRouter>,
    ),
  }
}

describe('authentication flow', () => {
  it('sends an unauthenticated visitor to the sign-in screen', () => {
    renderGuardedApp('/requests')

    expect(screen.getByRole('heading', { name: 'Service Request Portal' })).toBeInTheDocument()
    expect(screen.queryByText('Protected requests')).not.toBeInTheDocument()
  })

  it('renders the protected screen once a session exists', async () => {
    const { user } = renderGuardedApp('/requests')

    await user.click(screen.getByRole('button', { name: /^Sign in$/i }))

    expect(await screen.findByText('Protected requests')).toBeInTheDocument()
  })

  it('returns the visitor to the page they originally asked for', async () => {
    const { user } = renderGuardedApp('/requests?status=OPEN')

    await user.click(screen.getByRole('button', { name: /^Sign in$/i }))

    expect(await screen.findByText('Protected requests')).toBeInTheDocument()
  })

  it('publishes an access token for the API layer only while signed in', async () => {
    const { user } = renderGuardedApp('/requests')

    expect(getAccessToken()).toBeNull()

    await user.click(screen.getByRole('button', { name: /^Sign in$/i }))
    await screen.findByText('Protected requests')

    expect(getAccessToken()).toBe('mock-access-token')
  })

  it('does not leak a session across browser tabs or reloads once signed out', async () => {
    const { user, unmount } = renderGuardedApp('/requests')
    await user.click(screen.getByRole('button', { name: /^Sign in$/i }))
    await screen.findByText('Protected requests')

    unmount()
    window.sessionStorage.clear() // a fresh tab starts with empty session storage

    renderGuardedApp('/requests')
    expect(screen.queryByText('Protected requests')).not.toBeInTheDocument()
  })
})
