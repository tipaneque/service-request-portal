import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { server } from '@/mocks/server'
import { ApiError } from './ApiError'
import { apiFetch, setAccessTokenProvider, setUnauthorizedHandler } from './http'
import { listServiceRequests } from './serviceRequests'

const BASE = 'http://localhost/api'

describe('apiFetch', () => {
  it('attaches the bearer token supplied by the auth layer', async () => {
    setAccessTokenProvider(() => 'token-123')
    let seen: string | null = null

    server.use(
      http.get(`${BASE}/requests`, ({ request }) => {
        seen = request.headers.get('Authorization')
        return HttpResponse.json({ items: [], page: 1, pageSize: 10, total: 0, totalPages: 0 })
      }),
    )

    await listServiceRequests({ page: 1, pageSize: 10 })

    expect(seen).toBe('Bearer token-123')
  })

  it('omits the Authorization header when there is no session', async () => {
    setAccessTokenProvider(() => null)
    let hasHeader = true

    server.use(
      http.get(`${BASE}/requests`, ({ request }) => {
        hasHeader = request.headers.has('Authorization')
        return HttpResponse.json({ items: [], page: 1, pageSize: 10, total: 0, totalPages: 0 })
      }),
    )

    await listServiceRequests({})

    expect(hasHeader).toBe(false)
  })

  it('only sends query parameters that have a value', async () => {
    setAccessTokenProvider(() => 'token-123')
    let url = ''

    server.use(
      http.get(`${BASE}/requests`, ({ request }) => {
        url = request.url
        return HttpResponse.json({ items: [], page: 1, pageSize: 10, total: 0, totalPages: 0 })
      }),
    )

    await listServiceRequests({ search: '', status: 'OPEN', page: 2, pageSize: 10 })

    expect(url).toContain('status=OPEN')
    expect(url).toContain('page=2')
    expect(url).not.toContain('search=')
  })

  it('turns a problem+json body into an ApiError carrying its fields', async () => {
    server.use(
      http.get(`${BASE}/requests`, () =>
        HttpResponse.json(
          {
            type: 'https://api.example.test/problems/forbidden',
            title: 'Forbidden',
            status: 403,
            detail: "Scope 'service-requests.write' is required.",
            traceId: 'abc123',
          },
          { status: 403, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    const error = await listServiceRequests({}).catch((cause: unknown) => cause)

    expect(error).toBeInstanceOf(ApiError)
    const apiError = error as ApiError
    expect(apiError.status).toBe(403)
    expect(apiError.isForbidden).toBe(true)
    expect(apiError.title).toBe('Forbidden')
    expect(apiError.detail).toBe("Scope 'service-requests.write' is required.")
    expect(apiError.traceId).toBe('abc123')
    expect(apiError.isRetryable).toBe(false)
  })

  it('exposes per-field messages from a 422 validation problem', async () => {
    server.use(
      http.get(`${BASE}/requests`, () =>
        HttpResponse.json(
          {
            title: 'Validation failed',
            status: 422,
            errors: { title: ['Title must be at least 3 characters long.'] },
          },
          { status: 422, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    const error = (await listServiceRequests({}).catch((cause: unknown) => cause)) as ApiError

    expect(error.isValidation).toBe(true)
    expect(error.fieldErrors).toEqual({ title: ['Title must be at least 3 characters long.'] })
  })

  it('notifies the auth layer when the API answers 401', async () => {
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)

    server.use(
      http.get(`${BASE}/requests`, () =>
        HttpResponse.json(
          { title: 'Unauthorized', status: 401 },
          { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    await listServiceRequests({}).catch(() => undefined)

    expect(onUnauthorized).toHaveBeenCalledOnce()
    setUnauthorizedHandler(() => {})
  })

  it('reports a network failure as a retryable error with status 0', async () => {
    server.use(http.get(`${BASE}/requests`, () => HttpResponse.error()))

    const error = (await listServiceRequests({}).catch((cause: unknown) => cause)) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(0)
    expect(error.isRetryable).toBe(true)
  })

  it('treats a 500 as retryable', async () => {
    server.use(
      http.get(`${BASE}/requests`, () =>
        HttpResponse.json(
          { title: 'Internal server error', status: 500 },
          { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    const error = (await listServiceRequests({}).catch((cause: unknown) => cause)) as ApiError

    expect(error.status).toBe(500)
    expect(error.isRetryable).toBe(true)
  })

  it('serialises the body and sets the JSON content type on writes', async () => {
    setAccessTokenProvider(() => 'token-123')
    let contentType: string | null = null
    let body: unknown = null

    server.use(
      http.post(`${BASE}/requests`, async ({ request }) => {
        contentType = request.headers.get('Content-Type')
        body = await request.json()
        return HttpResponse.json({ id: 'REQ-2000' }, { status: 201 })
      }),
    )

    await apiFetch({ method: 'POST', path: '/requests', body: { title: 'Hello' } })

    expect(contentType).toBe('application/json')
    expect(body).toEqual({ title: 'Hello' })
  })
})
