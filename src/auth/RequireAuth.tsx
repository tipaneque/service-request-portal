import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AuthTransition } from './AuthTransition'
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
    return <AuthTransition />
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />
  }

  return <Outlet />
}
