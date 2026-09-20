import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Box, Button, Paper, Typography } from '@mui/material'
import LoginIcon from '@mui/icons-material/Login'
import { useAuth } from '@/auth/AuthContext'
import { Alert } from '@/components/Alert'
import { Spinner } from '@/components/Spinner'
import { env } from '@/config/env'
import { IMAGES } from '@/lib/assets'

interface LocationState {
  from?: { pathname?: string; search?: string }
}

export function SignInPage() {
  const { isAuthenticated, isLoading, error, signIn } = useAuth()
  const location = useLocation()
  const [redirectError, setRedirectError] = useState<Error | null>(null)

  const state = location.state as LocationState | null
  const returnTo = state?.from
    ? `${state.from.pathname ?? '/requests'}${state.from.search ?? ''}`
    : '/requests'

  if (isAuthenticated) return <Navigate to={returnTo} replace />

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
      <Paper
        className="signin__card"
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: '26rem',
          p: { xs: 3, sm: 5 },
          textAlign: 'center',
          boxShadow: 'var(--shadow-lifted)',
        }}
      >
        <Box
          className="signin__mark"
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 76,
            height: 76,
            p: 1,
            mx: 'auto',
            mb: 3,
            borderRadius: 'var(--radius-lg)',
            backgroundColor: '#ffffff',
            border: '1px solid var(--hairline)',
          }}
        >
          <Box
            component="img"
            src={IMAGES.logo}
            alt=""
            sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </Box>
        <Typography
          className="signin__title"
          component="h1"
          variant="h4"
          sx={{ letterSpacing: '-0.03em', mb: 1 }}
        >
          Service Request Portal
        </Typography>
        <Typography className="signin__description" sx={{ color: 'text.secondary', mb: 3 }}>
          Sign in with your organisation account to review and manage customer service requests.
        </Typography>

        {failure ? (
          <Box sx={{ mb: 3, textAlign: 'left' }}>
            <Alert tone="error" title="Sign-in failed">
              <p>{failure.message}</p>
            </Alert>
          </Box>
        ) : null}

        <Button
          type="button"
          variant="contained"
          size="large"
          fullWidth
          startIcon={isLoading ? <Spinner label={null} /> : <LoginIcon />}
          onClick={() => void handleSignIn()}
          disabled={isLoading}
        >
          {isLoading ? 'Signing in…' : 'Sign in'}
        </Button>

        <Typography
          className="signin__note"
          sx={{ mt: 2, fontSize: '0.75rem', color: 'text.secondary' }}
        >
          {env.auth.mode === 'mock'
            ? 'Development mode: a local demo session is used instead of a real identity provider.'
            : 'You will be redirected to your identity provider to authenticate.'}
        </Typography>
      </Paper>
    </main>
  )
}
