import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Alert } from './Alert'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Last line of defence for render-time crashes. Query and mutation failures are
 * handled locally by each screen; this only catches bugs that would otherwise
 * leave the user with a blank page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Replace with the real telemetry sink when one is available.
    console.error('Unhandled UI error', error, info.componentStack)
  }

  private handleReload = (): void => {
    window.location.assign('/')
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <main className="app-main">
        <Alert
          tone="error"
          title="The application ran into an unexpected problem"
          actions={
            <button type="button" className="button button--primary" onClick={this.handleReload}>
              Reload the portal
            </button>
          }
        >
          <p>
            The page could not be displayed. Reloading usually helps; if the problem persists,
            contact support with the time this happened.
          </p>
        </Alert>
      </main>
    )
  }
}
