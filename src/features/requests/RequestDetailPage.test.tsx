import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { server } from '@/mocks/server'
import { renderWithProviders, signIn } from '@/test/renderWithProviders'
import { RequestDetailPage } from './RequestDetailPage'

const BASE = 'http://localhost/api'

async function renderDetail(requestId: string) {
  signIn()
  const result = renderWithProviders(<RequestDetailPage />, {
    route: `/requests/${requestId}`,
    path: '/requests/:requestId',
  })
  await screen.findByRole('heading', { level: 1 }, { timeout: 5000 })
  return result
}

describe('RequestDetailPage', () => {
  it('renders the details of the selected request', async () => {
    await renderDetail('REQ-1002')

    expect(
      screen.getByRole('heading', { level: 1, name: 'Duplicate invoice on February statement' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Billing')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'second.customer@example.com' })).toHaveAttribute(
      'href',
      'mailto:second.customer@example.com',
    )
    expect(screen.getByText('In progress')).toBeInTheDocument()
  })

  it('only offers the transitions the contract allows', async () => {
    await renderDetail('REQ-1002') // IN_PROGRESS -> RESOLVED | OPEN

    const select = screen.getByLabelText(/Move to/i)
    const options = within(select).getAllByRole('option').map((option) => option.textContent)

    expect(options).toEqual(['Select a new status…', 'Resolved', 'Open'])
  })

  it('updates the status and reflects the new state', async () => {
    const { user } = await renderDetail('REQ-1001') // OPEN, version 1

    await user.selectOptions(screen.getByLabelText(/Move to/i), 'IN_PROGRESS')
    await user.type(screen.getByLabelText(/Note/i), 'Picked up by the access team.')
    await user.click(screen.getByRole('button', { name: /Update status/i }))

    expect(await screen.findByText('Status updated', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByText(/REQ-1001 is now in progress/i)).toBeInTheDocument()

    // The version returned by the API replaces the one we held.
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  it('echoes the version it last read so the server can detect a conflict', async () => {
    let sentBody: unknown = null
    server.use(
      http.patch(`${BASE}/requests/:requestId/status`, async ({ request }) => {
        sentBody = await request.json()
        return HttpResponse.json(
          {
            title: 'Update conflict',
            status: 409,
            detail: 'The request was updated by someone else. Refresh and try again.',
          },
          { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
        )
      }),
    )

    const { user } = await renderDetail('REQ-1002') // version 4

    await user.selectOptions(screen.getByLabelText(/Move to/i), 'RESOLVED')
    await user.click(screen.getByRole('button', { name: /Update status/i }))

    const alert = await screen.findByRole('alert', {}, { timeout: 5000 })
    expect(within(alert).getByText('Someone else updated this request')).toBeInTheDocument()
    expect(sentBody).toMatchObject({ status: 'RESOLVED', version: 4 })
  })

  it('reports a transition the server refuses with 422', async () => {
    server.use(
      http.patch(`${BASE}/requests/:requestId/status`, () =>
        HttpResponse.json(
          {
            title: 'Invalid status transition',
            status: 422,
            detail: 'A CLOSED request cannot be reopened.',
            errors: { status: ['Transition from CLOSED to IN_PROGRESS is not allowed.'] },
          },
          { status: 422, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    const { user } = await renderDetail('REQ-1001')

    await user.selectOptions(screen.getByLabelText(/Move to/i), 'IN_PROGRESS')
    await user.click(screen.getByRole('button', { name: /Update status/i }))

    const alert = await screen.findByRole('alert', {}, { timeout: 5000 })
    expect(within(alert).getByText('Invalid status transition')).toBeInTheDocument()
    expect(
      within(alert).getByText(/Transition from CLOSED to IN_PROGRESS is not allowed/i),
    ).toBeInTheDocument()
  })

  it('offers no transition for a closed request', async () => {
    await renderDetail('REQ-1007') // CLOSED

    expect(screen.getByText('This request is closed')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Move to/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Update status/i })).not.toBeInTheDocument()
  })

  it('shows a not-found state for an unknown id', async () => {
    signIn()
    renderWithProviders(<RequestDetailPage />, {
      route: '/requests/REQ-9999',
      path: '/requests/:requestId',
    })

    expect(
      await screen.findByText('Service request not found', {}, { timeout: 5000 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to all requests/i })).toBeInTheDocument()
  })

  it('offers a retry when the detail call fails', async () => {
    server.use(
      http.get(
        `${BASE}/requests/:requestId`,
        () =>
          HttpResponse.json(
            { title: 'Internal server error', status: 500 },
            { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
          ),
        { once: true },
      ),
    )

    signIn()
    const { user } = renderWithProviders(<RequestDetailPage />, {
      route: '/requests/REQ-1001',
      path: '/requests/:requestId',
    })

    const alert = await screen.findByRole('alert', {}, { timeout: 5000 })
    expect(within(alert).getByText('Internal server error')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Try again/i }))

    expect(
      await screen.findByRole(
        'heading',
        { level: 1, name: 'Unable to access customer portal' },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument()
  })
})
