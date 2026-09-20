import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { startMockWorker } from './mocks/startWorker'
import './styles/index.css'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root container #root was not found in index.html')
}
const rootContainer = container

// The mock worker must be listening before the first request is issued,
// otherwise the initial list call escapes to the network.
function renderApp(): void {
  createRoot(rootContainer).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void startMockWorker().then(renderApp, (error: unknown) => {
  console.error('Could not start the mock API', error)
  const message = error instanceof Error ? error.message : 'Unknown startup error'
  createRoot(rootContainer).render(
    <main className="app-main">
      <div className="alert alert--error" role="alert">
        <div className="alert__body">
          <h1 className="alert__title">The local API could not be started</h1>
          <p className="alert__detail">
            Reload the page. If the problem continues, verify that the service worker is available
            at the configured base path.
          </p>
          <p className="alert__trace">{message}</p>
          <div className="alert__actions">
            <button className="button button--primary" type="button" onClick={() => window.location.reload()}>
              Reload the portal
            </button>
          </div>
        </div>
      </div>
    </main>,
  )
})
