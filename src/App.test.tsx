import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppAuthProvider } from '@/auth/AppAuthProvider'
import { useAuth } from '@/auth/AuthContext'
import { SessionQueryProvider } from './App'

function SessionProbe() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const [, refresh] = useState(0)
  const cached = queryClient.getQueryData<string>(['private-request'])

  return (
    <>
      <p>Session: {auth.isAuthenticated ? 'signed in' : 'signed out'}</p>
      <p>Cache: {cached ?? 'empty'}</p>
      <button
        type="button"
        onClick={() => {
          queryClient.setQueryData(['private-request'], 'customer data')
          refresh((value) => value + 1)
        }}
      >
        Seed cache
      </button>
      <button type="button" onClick={() => void auth.signIn('/requests')}>
        Sign in
      </button>
      <button type="button" onClick={() => void auth.signOut()}>
        Sign out
      </button>
    </>
  )
}

describe('session query cache', () => {
  it('discards cached API data across sign-out and the next sign-in', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AppAuthProvider>
          <SessionQueryProvider>
            <SessionProbe />
          </SessionQueryProvider>
        </AppAuthProvider>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await user.click(screen.getByRole('button', { name: 'Seed cache' }))
    expect(screen.getByText('Cache: customer data')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(screen.getByText('Cache: empty')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByText('Cache: empty')).toBeInTheDocument()
  })
})
