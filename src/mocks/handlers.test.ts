import { describe, expect, it } from 'vitest'

const BASE = 'http://localhost/api'
const AUTH_HEADERS = { Authorization: 'Bearer test-token' }
const VALID_CREATE = {
  title: 'A valid service request',
  description: 'A sufficiently detailed description.',
  category: 'Access',
  priority: 'MEDIUM',
  requesterName: 'Test Customer',
  requesterEmail: 'customer@example.com',
}

async function post(path: string, body: unknown): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    method: path.endsWith('/status') ? 'PATCH' : 'POST',
    headers: { ...AUTH_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('mock API contract validation', () => {
  it('rejects unknown list query parameters', async () => {
    const response = await fetch(`${BASE}/requests?unexpected=true`, { headers: AUTH_HEADERS })

    expect(response.status).toBe(400)
  })

  it('rejects properties excluded by additionalProperties: false', async () => {
    const response = await post('/requests', { ...VALID_CREATE, status: 'OPEN' })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ detail: "Unknown field 'status'." })
  })

  it.each([
    ['category', 'x'.repeat(51)],
    ['requesterName', 'x'.repeat(101)],
    ['requesterEmail', `${'x'.repeat(243)}@example.com`],
  ])('enforces the maximum length of %s', async (field, value) => {
    const response = await post('/requests', { ...VALID_CREATE, [field]: value })
    const problem = (await response.json()) as { errors: Record<string, string[]> }

    expect(response.status).toBe(422)
    expect(problem.errors[field]).toBeDefined()
  })

  it('rejects a non-string status note', async () => {
    const response = await post('/requests/REQ-1001/status', {
      status: 'IN_PROGRESS',
      version: 1,
      note: 42,
    })

    expect(response.status).toBe(422)
  })
})
