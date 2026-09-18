import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from '@/auth/RequireAuth'
import { AppLayout } from '@/components/layout/AppLayout'
import { Spinner } from '@/components/Spinner'
import { AuthCallbackPage } from '@/pages/AuthCallbackPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { SignInPage } from '@/pages/SignInPage'

// The list is the entry screen and stays in the main bundle; the detail and
// create screens are split out so the first paint stays small.
import { RequestListPage } from '@/features/requests/RequestListPage'

const RequestDetailPage = lazy(() =>
  import('@/features/requests/RequestDetailPage').then((module) => ({
    default: module.RequestDetailPage,
  })),
)

const NewRequestPage = lazy(() =>
  import('@/features/requests/NewRequestPage').then((module) => ({
    default: module.NewRequestPage,
  })),
)

function RouteFallback() {
  return (
    <div className="route-fallback">
      <Spinner size="large" label="Loading page" />
    </div>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/requests" replace />} />
          <Route path="/requests" element={<RequestListPage />} />
          <Route
            path="/requests/new"
            element={
              <Suspense fallback={<RouteFallback />}>
                <NewRequestPage />
              </Suspense>
            }
          />
          <Route
            path="/requests/:requestId"
            element={
              <Suspense fallback={<RouteFallback />}>
                <RequestDetailPage />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
