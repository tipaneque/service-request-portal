import type { ProblemDetails, ValidationProblemDetails } from './types'

export type FieldErrors = Record<string, string[]>

/**
 * Normalised transport/API failure.
 *
 * Every non-2xx response is converted into an `ApiError` carrying the RFC 7807
 * problem document when the server sent one, so the UI can render a safe,
 * human-readable title plus per-field messages without re-parsing responses.
 */
export class ApiError extends Error {
  readonly status: number
  readonly problem: ProblemDetails | undefined
  readonly fieldErrors: FieldErrors | undefined
  readonly traceId: string | undefined

  constructor(status: number, message: string, problem?: ProblemDetails) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
    this.fieldErrors = extractFieldErrors(problem)
    this.traceId = typeof problem?.traceId === 'string' ? problem.traceId : undefined
  }

  /** Authentication missing/expired - the session must be renewed. */
  get isUnauthorized(): boolean {
    return this.status === 401
  }

  /** Token is valid but lacks the required scope. */
  get isForbidden(): boolean {
    return this.status === 403
  }

  get isNotFound(): boolean {
    return this.status === 404
  }

  /** Optimistic-concurrency clash: the record changed under us. */
  get isConflict(): boolean {
    return this.status === 409
  }

  get isValidation(): boolean {
    return this.status === 422 || this.status === 400
  }

  /** Network failures and 5xx are worth retrying; 4xx are not. */
  get isRetryable(): boolean {
    return this.status === 0 || this.status >= 500
  }

  /** Short summary safe to show in the UI. */
  get title(): string {
    return this.problem?.title ?? this.message
  }

  /** Longer, occurrence-specific explanation when the server provided one. */
  get detail(): string | undefined {
    return this.problem?.detail
  }
}

function extractFieldErrors(problem: ProblemDetails | undefined): FieldErrors | undefined {
  const errors = (problem as ValidationProblemDetails | undefined)?.errors
  if (!errors || typeof errors !== 'object') return undefined

  const result: FieldErrors = {}
  for (const [field, messages] of Object.entries(errors)) {
    if (Array.isArray(messages)) {
      result[field] = messages.filter((message): message is string => typeof message === 'string')
    }
  }
  return Object.keys(result).length > 0 ? result : undefined
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
