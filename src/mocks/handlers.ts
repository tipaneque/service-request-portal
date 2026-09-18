/**
 * MSW request handlers implementing `openapi/service-requests.openapi.yaml`.
 *
 * Error responses are returned as `application/problem+json` documents with the
 * same shape as the contract, so the UI's error handling is exercised for real
 * rather than against invented payloads.
 */
import { HttpResponse, http, type HttpResponseResolver } from 'msw'
import { env } from '@/config/env'
import {
  PRIORITIES,
  SORT_OPTIONS,
  STATUSES,
  type ProblemDetails,
  type ServiceRequestPriority,
  type ServiceRequestStatus,
  type SortOption,
  type ValidationProblemDetails,
} from '@/api/types'
import { applyStatusUpdate, findRequest, insertRequest, queryRequests } from './db'

const BASE = env.apiBaseUrl

const PROBLEM_HEADERS = { 'Content-Type': 'application/problem+json' }

let traceCounter = 0
function traceId(): string {
  traceCounter += 1
  return `mock-trace-${traceCounter.toString().padStart(6, '0')}`
}

function problem(status: number, title: string, detail: string, instance: string): Response {
  const body: ProblemDetails = {
    type: `https://api.example.test/problems/${title.toLowerCase().replace(/\s+/g, '-')}`,
    title,
    status,
    detail,
    instance,
    traceId: traceId(),
  }
  return HttpResponse.json(body, { status, headers: PROBLEM_HEADERS })
}

function validationProblem(
  title: string,
  detail: string,
  instance: string,
  errors: Record<string, string[]>,
): Response {
  const body: ValidationProblemDetails = {
    type: 'https://api.example.test/problems/validation-error',
    title,
    status: 422,
    detail,
    instance,
    traceId: traceId(),
    errors,
  }
  return HttpResponse.json(body, { status: 422, headers: PROBLEM_HEADERS })
}

/**
 * Rejects calls without a bearer token, mirroring the API's `401` challenge.
 * The mock does not validate the token itself - that is the identity provider's
 * and the real API's job - it only proves the client attaches one.
 */
function requireAuth(request: Request, instance: string): Response | null {
  const header = request.headers.get('Authorization')
  if (header?.startsWith('Bearer ') && header.length > 'Bearer '.length) return null

  return HttpResponse.json(
    {
      type: 'https://api.example.test/problems/unauthorized',
      title: 'Unauthorized',
      status: 401,
      detail: 'The access token is missing or has expired. Sign in again.',
      instance,
      traceId: traceId(),
    } satisfies ProblemDetails,
    {
      status: 401,
      headers: {
        ...PROBLEM_HEADERS,
        'WWW-Authenticate': 'Bearer realm="service-requests", error="invalid_token"',
      },
    },
  )
}

/** Small latency so loading states are visible while developing. */
async function latency(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, import.meta.env.MODE === 'test' ? 0 : 320))
}

const listRequests: HttpResponseResolver = async ({ request }) => {
  const url = new URL(request.url)
  const instance = url.pathname

  const unauthorized = requireAuth(request, instance)
  if (unauthorized) return unauthorized

  const rawPage = url.searchParams.get('page')
  const rawPageSize = url.searchParams.get('pageSize')
  const rawStatus = url.searchParams.get('status')
  const rawPriority = url.searchParams.get('priority')
  const rawSort = url.searchParams.get('sort')
  const rawSearch = url.searchParams.get('search')

  const page = rawPage === null ? 1 : Number(rawPage)
  const pageSize = rawPageSize === null ? 10 : Number(rawPageSize)

  if (!Number.isInteger(page) || page < 1) {
    return problem(400, 'Invalid request', "Query parameter 'page' must be 1 or greater.", instance)
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    return problem(
      400,
      'Invalid request',
      "Query parameter 'pageSize' must be between 1 and 100.",
      instance,
    )
  }
  if (rawStatus !== null && !STATUSES.includes(rawStatus as ServiceRequestStatus)) {
    return problem(400, 'Invalid request', `Unknown status '${rawStatus}'.`, instance)
  }
  if (rawPriority !== null && !PRIORITIES.includes(rawPriority as ServiceRequestPriority)) {
    return problem(400, 'Invalid request', `Unknown priority '${rawPriority}'.`, instance)
  }
  if (rawSort !== null && !SORT_OPTIONS.includes(rawSort as SortOption)) {
    return problem(400, 'Invalid request', `Unknown sort expression '${rawSort}'.`, instance)
  }
  if (rawSearch !== null && rawSearch.length > 100) {
    return problem(
      400,
      'Invalid request',
      "Query parameter 'search' must not exceed 100 characters.",
      instance,
    )
  }

  await latency()

  return HttpResponse.json(
    queryRequests({
      ...(rawSearch ? { search: rawSearch } : {}),
      ...(rawStatus ? { status: rawStatus as ServiceRequestStatus } : {}),
      ...(rawPriority ? { priority: rawPriority as ServiceRequestPriority } : {}),
      sort: (rawSort as SortOption | null) ?? '-createdAt',
      page,
      pageSize,
    }),
  )
}

interface CreateBody {
  title?: unknown
  description?: unknown
  category?: unknown
  priority?: unknown
  requesterName?: unknown
  requesterEmail?: unknown
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateCreate(body: CreateBody): Record<string, string[]> {
  const errors: Record<string, string[]> = {}

  const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

  if (text(body.title).length < 3) {
    errors.title = ['Title must be at least 3 characters long.']
  } else if (text(body.title).length > 120) {
    errors.title = ['Title must not exceed 120 characters.']
  }

  if (text(body.description).length < 10) {
    errors.description = ['Description must be at least 10 characters long.']
  } else if (text(body.description).length > 2000) {
    errors.description = ['Description must not exceed 2000 characters.']
  }

  if (text(body.category).length < 2) {
    errors.category = ['Category must be at least 2 characters long.']
  }

  if (!PRIORITIES.includes(body.priority as ServiceRequestPriority)) {
    errors.priority = ['Select a valid priority.']
  }

  if (text(body.requesterName).length < 2) {
    errors.requesterName = ['Requester name must be at least 2 characters long.']
  }

  if (!EMAIL_PATTERN.test(text(body.requesterEmail))) {
    errors.requesterEmail = ['Enter a valid email address.']
  }

  return errors
}

const createRequest: HttpResponseResolver = async ({ request }) => {
  const instance = new URL(request.url).pathname

  const unauthorized = requireAuth(request, instance)
  if (unauthorized) return unauthorized

  let body: CreateBody
  try {
    body = (await request.json()) as CreateBody
  } catch {
    return problem(400, 'Invalid request', 'The request body is not valid JSON.', instance)
  }

  const errors = validateCreate(body)
  if (Object.keys(errors).length > 0) {
    return validationProblem(
      'Validation failed',
      'The submitted service request contains invalid fields.',
      instance,
      errors,
    )
  }

  await latency()

  const created = insertRequest({
    title: String(body.title).trim(),
    description: String(body.description).trim(),
    category: String(body.category).trim(),
    priority: body.priority as ServiceRequestPriority,
    requesterName: String(body.requesterName).trim(),
    requesterEmail: String(body.requesterEmail).trim(),
  })

  return HttpResponse.json(created, {
    status: 201,
    headers: { Location: `${BASE}/requests/${created.id}` },
  })
}

const getRequest: HttpResponseResolver<{ requestId: string }> = async ({ request, params }) => {
  const instance = new URL(request.url).pathname

  const unauthorized = requireAuth(request, instance)
  if (unauthorized) return unauthorized

  await latency()

  const found = findRequest(params.requestId)
  if (!found) {
    return problem(
      404,
      'Service request not found',
      `No service request exists with id ${params.requestId}.`,
      instance,
    )
  }

  return HttpResponse.json(found)
}

interface StatusBody {
  status?: unknown
  version?: unknown
  note?: unknown
}

const patchStatus: HttpResponseResolver<{ requestId: string }> = async ({ request, params }) => {
  const instance = new URL(request.url).pathname

  const unauthorized = requireAuth(request, instance)
  if (unauthorized) return unauthorized

  let body: StatusBody
  try {
    body = (await request.json()) as StatusBody
  } catch {
    return problem(400, 'Invalid request', 'The request body is not valid JSON.', instance)
  }

  if (!STATUSES.includes(body.status as ServiceRequestStatus)) {
    return validationProblem('Validation failed', 'The submitted status is invalid.', instance, {
      status: ['Select a valid status.'],
    })
  }
  if (typeof body.version !== 'number' || !Number.isInteger(body.version) || body.version < 1) {
    return problem(400, 'Invalid request', "Field 'version' must be a positive integer.", instance)
  }
  if (typeof body.note === 'string' && body.note.length > 500) {
    return validationProblem('Validation failed', 'The note is too long.', instance, {
      note: ['Note must not exceed 500 characters.'],
    })
  }

  await latency()

  const result = applyStatusUpdate(
    params.requestId,
    body.status as ServiceRequestStatus,
    body.version,
  )

  if (result.ok) return HttpResponse.json(result.request)

  if (result.reason === 'not-found') {
    return problem(
      404,
      'Service request not found',
      `No service request exists with id ${params.requestId}.`,
      instance,
    )
  }

  if (result.reason === 'conflict') {
    return problem(
      409,
      'Update conflict',
      'The request was updated by someone else. Refresh and try again.',
      instance,
    )
  }

  return validationProblem(
    'Invalid status transition',
    `A ${result.from} request cannot move to ${String(body.status)}.`,
    instance,
    {
      status: [`Transition from ${result.from} to ${String(body.status)} is not allowed.`],
    },
  )
}

export const handlers = [
  http.get(`${BASE}/requests`, listRequests),
  http.post(`${BASE}/requests`, createRequest),
  http.get(`${BASE}/requests/:requestId`, getRequest),
  http.patch(`${BASE}/requests/:requestId/status`, patchStatus),
]
