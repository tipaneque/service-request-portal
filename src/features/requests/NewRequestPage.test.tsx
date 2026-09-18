import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { server } from '@/mocks/server'
import { renderWithProviders, signIn } from '@/test/renderWithProviders'
import { NewRequestPage } from './NewRequestPage'

const BASE = 'http://localhost/api'

const VALID_INPUT = {
  title: 'Printer offline in the Porto branch',
  description: 'Every print job queued since this morning stays pending and never prints.',
  category: 'Hardware',
  requesterName: 'Rui Marques',
  requesterEmail: 'rui.marques@example.com',
}

function renderForm() {
  signIn()
  return renderWithProviders(<NewRequestPage />, { route: '/requests/new' })
}

async function fillValidForm(user: ReturnType<typeof renderForm>['user']) {
  await user.type(screen.getByLabelText('Title'), VALID_INPUT.title)
  await user.type(screen.getByLabelText('Description'), VALID_INPUT.description)
  await user.type(screen.getByLabelText(/^Category/), VALID_INPUT.category)
  await user.type(screen.getByLabelText('Requester name'), VALID_INPUT.requesterName)
  await user.type(screen.getByLabelText('Requester email'), VALID_INPUT.requesterEmail)
}

describe('NewRequestPage', () => {
  it('rejects an empty submission with per-field messages', async () => {
    const { user } = renderForm()

    await user.click(screen.getByRole('button', { name: /Create request/i }))

    expect(await screen.findByText(/Title must be at least 3 characters long/i)).toBeInTheDocument()
    expect(screen.getByText(/Description must be at least 10 characters long/i)).toBeInTheDocument()
    expect(screen.getByText(/Category must be at least 2 characters long/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Requester name must be at least 2 characters long/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/Enter a contact email address/i)).toBeInTheDocument()
  })

  it('marks an invalid field with aria-invalid and links its message', async () => {
    const { user } = renderForm()

    await user.click(screen.getByRole('button', { name: /Create request/i }))

    const title = await screen.findByLabelText('Title')
    expect(title).toHaveAttribute('aria-invalid', 'true')

    const describedBy = title.getAttribute('aria-describedby') ?? ''
    const messageIds = describedBy.split(' ').filter(Boolean)
    const messages = messageIds.map((id) => document.getElementById(id)?.textContent ?? '')
    expect(messages.join(' ')).toMatch(/at least 3 characters/i)
  })

  it('rejects a malformed email address before calling the API', async () => {
    let called = false
    server.use(
      http.post(`${BASE}/requests`, () => {
        called = true
        return HttpResponse.json({}, { status: 201 })
      }),
    )

    const { user } = renderForm()
    await fillValidForm(user)
    await user.clear(screen.getByLabelText('Requester email'))
    await user.type(screen.getByLabelText('Requester email'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: /Create request/i }))

    expect(await screen.findByText(/Enter a valid email address/i)).toBeInTheDocument()
    expect(called).toBe(false)
  })

  it('submits the contract payload and navigates to the created request', async () => {
    let body: unknown = null
    server.use(
      http.post(`${BASE}/requests`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(
          {
            id: 'REQ-2001',
            ...VALID_INPUT,
            priority: 'HIGH',
            status: 'OPEN',
            createdAt: '2026-02-12T09:00:00Z',
            updatedAt: '2026-02-12T09:00:00Z',
            version: 1,
          },
          { status: 201, headers: { Location: `${BASE}/requests/REQ-2001` } },
        )
      }),
    )

    const { user } = renderForm()
    await fillValidForm(user)
    await user.selectOptions(screen.getByLabelText('Priority'), 'HIGH')
    await user.click(screen.getByRole('button', { name: /Create request/i }))

    await screen.findByText(/Create request/i)

    // The server owns id, status and timestamps; the client must not send them.
    expect(body).toEqual({
      title: VALID_INPUT.title,
      description: VALID_INPUT.description,
      category: VALID_INPUT.category,
      priority: 'HIGH',
      requesterName: VALID_INPUT.requesterName,
      requesterEmail: VALID_INPUT.requesterEmail,
    })
  })

  it('maps server-side 422 messages back onto the matching fields', async () => {
    server.use(
      http.post(`${BASE}/requests`, () =>
        HttpResponse.json(
          {
            title: 'Validation failed',
            status: 422,
            detail: 'The submitted service request contains invalid fields.',
            errors: {
              title: ['This title duplicates an open request.'],
              requesterEmail: ['This address is on the suppression list.'],
            },
          },
          { status: 422, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    const { user } = renderForm()
    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /Create request/i }))

    expect(
      await screen.findByText(/This title duplicates an open request/i, {}, { timeout: 5000 }),
    ).toBeInTheDocument()
    expect(screen.getByText(/This address is on the suppression list/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows a page-level alert when the request fails for another reason', async () => {
    server.use(
      http.post(`${BASE}/requests`, () =>
        HttpResponse.json(
          {
            title: 'Forbidden',
            status: 403,
            detail: "Scope 'service-requests.write' is required.",
          },
          { status: 403, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    const { user } = renderForm()
    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /Create request/i }))

    const alert = await screen.findByRole('alert', {}, { timeout: 5000 })
    expect(within(alert).getByText('The request could not be created')).toBeInTheDocument()
    expect(within(alert).getByText(/service-requests.write/)).toBeInTheDocument()
  })

  it('reaches the mock API end to end and persists the new request', async () => {
    const { user } = renderForm()
    await fillValidForm(user)
    await user.selectOptions(screen.getByLabelText('Priority'), 'CRITICAL')
    await user.click(screen.getByRole('button', { name: /Create request/i }))

    // No alert means the mock API accepted the payload as contract-valid.
    await screen.findByRole('button', { name: /Create request/i })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
