import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { getAccessToken } from '@/auth/tokenStore'
import { renderWithProviders, signIn } from '@/test/renderWithProviders'
import { AppLayout } from './AppLayout'

describe('AppLayout', () => {
  it('shows who is signed in', () => {
    signIn()
    renderWithProviders(<AppLayout />, { route: '/requests' })

    expect(screen.getByText('Alex Agent')).toBeInTheDocument()
    expect(screen.getByText('alex.agent@example.com')).toBeInTheDocument()
  })

  it('offers a skip link to the main content region', () => {
    signIn()
    renderWithProviders(<AppLayout />, { route: '/requests' })

    const skipLink = screen.getByRole('link', { name: /Skip to main content/i })
    expect(skipLink).toHaveAttribute('href', '#main-content')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
  })

  it('ends the session and drops the access token on sign out', async () => {
    signIn()
    const { user } = renderWithProviders(<AppLayout />, { route: '/requests' })

    expect(getAccessToken()).toBe('mock-access-token')

    await user.click(screen.getByRole('button', { name: /Sign out/i }))

    expect(getAccessToken()).toBeNull()
    expect(window.sessionStorage.getItem('srp.mock-session')).toBeNull()
    expect(screen.queryByText('Alex Agent')).not.toBeInTheDocument()
  })
})
