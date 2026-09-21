/**
 * Thin fetch wrapper shared by every endpoint module.
 *
 * Responsibilities kept here on purpose:
 *  - attach the bearer token supplied by the auth layer,
 *  - turn `application/problem+json` bodies into `ApiError`,
 *  - surface network failures as `ApiError` with status 0,
 *  - support request cancellation through `AbortSignal`.
 *
 * The access token is injected rather than imported so this module stays free
 * of React/OIDC dependencies and is trivially testable.
 */
import { env } from '@/config/env'
import { ApiError } from './ApiError'
import type { ProblemDetails } from './types'

type TokenProvider = () => string | null | Promise<string | null>

let getAccessToken: TokenProvider = () => null

/** Registered once by the auth layer at startup. */
export function setAccessTokenProvider(provider: TokenProvider): void {
  getAccessToken = provider
}

type UnauthorizedHandler = () => void

let onUnauthorized: UnauthorizedHandler = () => {}

/** Registered by the auth layer to react to an expired/invalid session. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler
}

type QueryValue = string | number | boolean | undefined | null

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  path: string
  query?: Record<string, QueryValue>
  body?: unknown
  signal?: AbortSignal
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = `${env.apiBaseUrl}${path}`
  if (!query) return url

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.set(key, String(value))
  }
  const queryString = params.toString()
  return queryString ? `${url}?${queryString}` : url
}

async function parseProblem(response: Response): Promise<ProblemDetails | undefined> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('json')) return undefined
  try {
    const body: unknown = await response.json()
    if (body && typeof body === 'object' && 'title' in body) {
      return body as ProblemDetails
    }
    return undefined
  } catch {
    return undefined
  }
}

const GENERIC_MESSAGES: Record<number, string> = {
  400: 'The request was rejected as invalid.',
  401: 'Your session has expired. Sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'The record was changed by someone else. Refresh and try again.',
  422: 'Some of the submitted data is invalid.',
  500: 'An unexpected server error occurred. Try again later.',
}

export async function apiFetch<T>(options: RequestOptions): Promise<T> {
  const { method = 'GET', path, query, body, signal } = options

  const headers = new Headers({ Accept: 'application/json' })
  if (body !== undefined) headers.set('Content-Type', 'application/json')

  const token = await getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      signal,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'Could not reach the service. Check your connection and try again.')
  }

  if (!response.ok) {
    const problem = await parseProblem(response)
    if (response.status === 401) onUnauthorized()
    const message =
      problem?.title ??
      GENERIC_MESSAGES[response.status] ??
      `Request failed with status ${response.status}.`
    throw new ApiError(response.status, message, problem)
  }

  if (response.status === 204) return undefined as T

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('json')) return undefined as T

  return (await response.json()) as T
}
