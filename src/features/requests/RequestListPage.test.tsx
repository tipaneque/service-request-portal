import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { server } from '@/mocks/server'
import {
  renderWithProviders,
  signIn,
  type RenderWithProvidersResult,
} from '@/test/renderWithProviders'
import { RequestListPage } from './RequestListPage'

const BASE = 'http://localhost/api'

/**
 * The page renders a table and a card list; CSS shows exactly one of them per
 * breakpoint, but jsdom applies no stylesheet, so assertions are scoped to the
 * table to avoid matching the same request twice.
 */
async function renderList(route = '/requests') {
  signIn()
  const result = renderWithProviders(<RequestListPage />, { route, path: '/requests' })
  const table = await screen.findByRole('table', {}, { timeout: 5000 })
  await within(table).findByText('REQ-1001', {}, { timeout: 5000 })
  return { ...result, table }
}

function rows(): HTMLElement[] {
  return within(screen.getByRole('table')).getAllByRole('row')
}

/**
 * The filter bar keeps the search field collapsed behind its icon, so a test
 * that wants to type has to summon it first.
 */
async function openSearch(user: RenderWithProvidersResult['user']): Promise<HTMLElement> {
  await user.click(screen.getByRole('button', { name: /Search requests/i }))
  return screen.findByLabelText('Search')
}

describe('RequestListPage', () => {
  it('lists the first page of requests with status and priority', async () => {
    const { table } = await renderList()

    expect(within(table).getAllByRole('row')).toHaveLength(11) // header + 10 rows

    const firstRow = within(table).getByText('REQ-1001').closest('tr') as HTMLElement
    expect(within(firstRow).getByText('Unable to access customer portal')).toBeInTheDocument()
    expect(within(firstRow).getByText('Open')).toBeInTheDocument()
    expect(within(firstRow).getByText('High')).toBeInTheDocument()
  })

  it('reports the total and the current page', async () => {
    await renderList()

    expect(screen.getByText(/Showing 1–10 of 42 requests/i)).toBeInTheDocument()
    expect(screen.getByText(/Page 1 of 5/i)).toBeInTheDocument()
  })

  it('applies the status filter and offers a chip to remove it', async () => {
    const { user } = await renderList()

    await user.selectOptions(screen.getByLabelText('Status'), 'CLOSED')

    await waitFor(() => {
      expect(screen.getByText(/of 6 requests/i)).toBeInTheDocument()
    })

    const table = screen.getByRole('table')
    expect(within(table).getAllByText('Closed').length).toBeGreaterThan(0)
    expect(within(table).queryByText('In progress')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Remove status filter/i })).toBeInTheDocument()
  })

  it('searches by title once the input settles', async () => {
    const { user } = await renderList()

    await user.type(await openSearch(user), 'invoice')

    await waitFor(
      () => {
        expect(screen.getByText(/of 2 requests/i)).toBeInTheDocument()
      },
      { timeout: 5000 },
    )

    expect(
      within(screen.getByRole('table')).getByText('Duplicate invoice on February statement'),
    ).toBeInTheDocument()
  })

  it('searches by requester name as well as title', async () => {
    const { user } = await renderList()

    await user.type(await openSearch(user), 'Ana Costa')

    await waitFor(
      () => {
        expect(screen.getByText(/of 1 request\b/i)).toBeInTheDocument()
      },
      { timeout: 5000 },
    )

    expect(
      within(screen.getByRole('table')).getByText('Mobile app crashes on the orders screen'),
    ).toBeInTheDocument()
  })

  it('moves between pages', async () => {
    const { user } = await renderList()

    await user.click(screen.getByRole('button', { name: /Next/i }))

    await waitFor(() => {
      expect(screen.getByText(/Page 2 of 5/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/Showing 11–20 of 42 requests/i)).toBeInTheDocument()
  })

  it('honours filters supplied in the query string on first load', async () => {
    signIn()
    renderWithProviders(<RequestListPage />, {
      route: '/requests?priority=CRITICAL&status=OPEN',
      path: '/requests',
    })

    await waitFor(
      () => {
        expect(screen.getByText(/of 3 requests/i)).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
    expect(screen.getByLabelText('Priority')).toHaveValue('CRITICAL')
    expect(screen.getByLabelText('Status')).toHaveValue('OPEN')
  })

  it('sorts by the chosen expression', async () => {
    const { user } = await renderList()

    await user.selectOptions(screen.getByLabelText('Sort by'), 'createdAt')

    await waitFor(
      () => {
        // Oldest first puts the 210-hours-old record at the top.
        expect(within(rows()[1] as HTMLElement).getByText('REQ-1038')).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })

  it('shows an empty state with a way back when nothing matches', async () => {
    const { user } = await renderList()

    await user.type(await openSearch(user), 'zzzzz-no-such-request')

    expect(
      await screen.findByText(/No requests match these filters/i, {}, { timeout: 5000 }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Clear filters/i }))

    expect(await screen.findByText(/of 42 requests/i, {}, { timeout: 5000 })).toBeInTheDocument()
  })

  it('shows the server problem document and retries on demand', async () => {
    server.use(
      http.get(
        `${BASE}/requests`,
        () =>
          HttpResponse.json(
            {
              title: 'Internal server error',
              status: 500,
              detail: 'An unexpected error occurred. Try again later.',
              traceId: 'trace-500',
            },
            { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
          ),
        { once: true },
      ),
    )

    signIn()
    const { user } = renderWithProviders(<RequestListPage />, {
      route: '/requests',
      path: '/requests',
    })

    const alert = await screen.findByRole('alert', {}, { timeout: 5000 })
    expect(within(alert).getByText('Internal server error')).toBeInTheDocument()
    expect(within(alert).getByText(/Trace ID: trace-500/i)).toBeInTheDocument()

    // The one-shot handler is spent, so the retry reaches the normal mock API.
    await user.click(screen.getByRole('button', { name: /Try again/i }))

    expect(await screen.findByText(/of 42 requests/i, {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('surfaces an authentication failure returned by the API', async () => {
    server.use(
      http.get(`${BASE}/requests`, () =>
        HttpResponse.json(
          {
            title: 'Unauthorized',
            status: 401,
            detail: 'The access token is missing or has expired. Sign in again.',
          },
          { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    signIn()
    renderWithProviders(<RequestListPage />, { route: '/requests', path: '/requests' })

    const alert = await screen.findByRole('alert', {}, { timeout: 5000 })
    expect(within(alert).getByText('Unauthorized')).toBeInTheDocument()
    expect(within(alert).getByText(/token is missing or has expired/i)).toBeInTheDocument()
  })
})
