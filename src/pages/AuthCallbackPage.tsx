import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { Alert } from '@/components/Alert'
import { Spinner } from '@/components/Spinner'

/**
 * Landing page for the OIDC redirect URI.
 *
 * `react-oidc-context` exchanges the authorization code for tokens as soon as
 * it sees `code`/`state` in the URL; this screen only reports progress and then
 * forwards the user into the application.
 */
export function AuthCallbackPage() {
  const { isAuthenticated, isLoading, error } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      // `onSigninCallback` has already restored the safe path carried in the
      // OIDC state. Ask the router to adopt that URL without losing it.
      navigate(window.location.pathname + window.location.search, { replace: true })
    }
  }, [isAuthenticated, navigate])

  if (error) {
    return (
      <main className="signin">
        <div className="signin__card" style={{ textAlign: 'left' }}>
          <Alert
            tone="error"
            title="Could not complete sign-in"
            actions={
              <button
                type="button"
                className="button button--primary"
                onClick={() => navigate('/sign-in', { replace: true })}
              >
                Back to sign-in
              </button>
            }
          >
            <p>{error.message}</p>
          </Alert>
        </div>
      </main>
    )
  }

  return (
    <div className="route-fallback">
      <Spinner size="large" label="Completing sign-in" />
      <p>{isLoading ? 'Completing sign-in…' : 'Redirecting…'}</p>
    </div>
  )
}
