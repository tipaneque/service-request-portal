import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Alert } from '@/components/Alert'
import { Spinner } from '@/components/Spinner'
import { env } from '@/config/env'

interface LocationState {
  from?: { pathname?: string; search?: string }
}

export function SignInPage() {
  const { isAuthenticated, isLoading, error, signIn } = useAuth()
  const location = useLocation()
  const [redirectError, setRedirectError] = useState<Error | null>(null)

  const state = location.state as LocationState | null
  const returnTo = state?.from ? `${state.from.pathname ?? '/requests'}${state.from.search ?? ''}` : '/requests'

  if (isAuthenticated) {
    return <Navigate to={returnTo} replace />
  }

  const handleSignIn = async () => {
    setRedirectError(null)
    try {
      await signIn(returnTo)
    } catch (cause) {
      setRedirectError(cause instanceof Error ? cause : new Error('Sign-in failed.'))
    }
  }

  const failure = error ?? redirectError

  return (
    <main className="signin">
      <div className="signin__card">
        <span className="signin__mark" aria-hidden="true">
          SR
        </span>
        <h1 className="signin__title">Service Request Portal</h1>
        <p className="signin__description">
          Sign in with your organisation account to review and manage customer service requests.
        </p>

        {failure ? (
          <div style={{ marginBottom: 'var(--space-4)', textAlign: 'left' }}>
            <Alert tone="error" title="Sign-in failed">
              <p>{failure.message}</p>
            </Alert>
          </div>
        ) : null}

        <button
          type="button"
          className="button button--primary button--large button--block"
          onClick={() => void handleSignIn()}
          disabled={isLoading}
        >
          {isLoading ? <Spinner label={null} /> : null}
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="signin__note">
          {env.auth.mode === 'mock'
            ? 'Development mode: a local demo session is used instead of a real identity provider.'
            : 'You will be redirected to your identity provider to authenticate.'}
        </p>
      </div>
    </main>
  )
}
