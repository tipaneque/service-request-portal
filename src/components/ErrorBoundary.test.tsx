import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from './ErrorBoundary'

function Boom(): never {
  throw new Error('render exploded')
}

describe('ErrorBoundary', () => {
  // React re-throws to the console on every caught error, and the boundary
  // logs to the telemetry sink itself. Both are expected here, so the spy
  // keeps the suite output readable and lets the log be asserted.
  let consoleError: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  it('renders its children while nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>Business as usual</p>
      </ErrorBoundary>,
    )

    expect(screen.getByText('Business as usual')).toBeInTheDocument()
  })

  it('replaces a crashed tree with a recoverable message instead of a blank page', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )

    const alert = screen.getByRole('alert')
    expect(
      within(alert).getByText('The application ran into an unexpected problem'),
    ).toBeInTheDocument()
    expect(within(alert).getByText(/Reloading usually helps/i)).toBeInTheDocument()
  })

  it('reports the failure so it can reach a telemetry sink', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )

    expect(consoleError).toHaveBeenCalledWith(
      'Unhandled UI error',
      expect.objectContaining({ message: 'render exploded' }),
      expect.anything(),
    )
  })

  it('offers a way out that returns to the root of the application', async () => {
    const assign = vi.fn()
    const realLocation = window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...realLocation, assign },
    })

    try {
      render(
        <ErrorBoundary>
          <Boom />
        </ErrorBoundary>,
      )

      await userEvent.setup().click(screen.getByRole('button', { name: /Reload the portal/i }))

      expect(assign).toHaveBeenCalledWith('/')
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: realLocation,
      })
    }
  })
})
