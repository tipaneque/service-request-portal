import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spinner } from '@/components/Spinner'
import { useAuth } from './AuthContext'

/**
 * Route guard for everything under `/requests`.
 *
 * An unauthenticated visitor is sent to `/sign-in` with the attempted location
 * attached, so they land back where they were headed after signing in. This is
 * a usability measure only - the API is the security boundary and rejects any
 * unauthenticated call regardless of what the client renders.
 */
export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="route-fallback">
        <Spinner size="large" label="Checking your session" />
        <p>Checking your session&hellip;</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />
  }

  return <Outlet />
}
