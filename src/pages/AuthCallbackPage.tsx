import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Paper } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useAuth } from '@/auth/AuthContext'
import { Alert } from '@/components/Alert'
import { Spinner } from '@/components/Spinner'
 
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
        <Paper className="signin__card" elevation={0} sx={{ textAlign: 'left' }}>
          <Alert
            tone="error"
            title="Could not complete sign-in"
            actions={
              <Button
                type="button"
                variant="contained"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/sign-in', { replace: true })}
              >
                Back to sign-in
              </Button>
            }
          >
            <p>{error.message}</p>
          </Alert>
        </Paper>
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
