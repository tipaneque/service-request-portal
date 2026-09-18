import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { env } from '@/config/env'

function AppHeader() {
  const { user, signOut } = useAuth()

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link className="app-header__brand" to="/requests">
          <span className="app-header__mark" aria-hidden="true">
            SR
          </span>
          <span>
            <span className="app-header__title">Service Request Portal</span>
            <span className="app-header__subtitle">Customer support operations</span>
          </span>
        </Link>

        <div className="app-header__user">
          {user ? (
            <span className="app-header__identity">
              <span className="app-header__name">{user.name}</span>
              {user.email ? <span className="app-header__email">{user.email}</span> : null}
            </span>
          ) : null}
          <button type="button" className="button button--secondary" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}

/**
 * Chrome shared by every authenticated screen: skip link, header, the routed
 * content region and a footer noting when the mock API is serving data.
 */
export function AppLayout() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <AppHeader />

      <main className="app-main" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="app-footer">
        {env.enableApiMocks ? (
          <span>Running against the in-browser mock API. Data resets on reload.</span>
        ) : (
          <span>Connected to {env.apiBaseUrl}</span>
        )}
      </footer>
    </div>
  )
}
