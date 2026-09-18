/**
 * Domain aliases over the auto-generated OpenAPI types.
 *
 * `schema.ts` is generated from `openapi/service-requests.openapi.yaml` by
 * `npm run generate:api` and is never edited by hand. Everything the app uses
 * is re-exported from here so that a contract change surfaces as a type error
 * in one place instead of scattering `components['schemas'][...]` lookups
 * across the codebase.
 */
import type { components, operations } from './schema'

export type ServiceRequest = components['schemas']['ServiceRequest']
export type ServiceRequestPage = components['schemas']['ServiceRequestPage']
export type ServiceRequestStatus = components['schemas']['ServiceRequestStatus']
export type ServiceRequestPriority = components['schemas']['ServiceRequestPriority']
export type CreateServiceRequest = components['schemas']['CreateServiceRequest']
export type UpdateServiceRequestStatus = components['schemas']['UpdateServiceRequestStatus']
export type ProblemDetails = components['schemas']['ProblemDetails']
export type ValidationProblemDetails = components['schemas']['ValidationProblemDetails']

/** Query parameters accepted by `GET /requests`. */
export type ListServiceRequestsQuery = NonNullable<
  operations['listServiceRequests']['parameters']['query']
>

export type SortOption = NonNullable<ListServiceRequestsQuery['sort']>

export const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const satisfies readonly ServiceRequestStatus[]

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const satisfies readonly ServiceRequestPriority[]

export const SORT_OPTIONS = [
  '-createdAt',
  'createdAt',
  '-updatedAt',
  'updatedAt',
  '-priority',
  'priority',
] as const satisfies readonly SortOption[]

export const STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
}

export const PRIORITY_LABELS: Record<ServiceRequestPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
}

export const SORT_LABELS: Record<SortOption, string> = {
  '-createdAt': 'Newest first',
  createdAt: 'Oldest first',
  '-updatedAt': 'Recently updated',
  updatedAt: 'Least recently updated',
  '-priority': 'Highest priority',
  priority: 'Lowest priority',
}

/**
 * Status transitions allowed by the API (see `PATCH /requests/{id}/status`).
 * Mirrored client-side so the UI only offers moves the server will accept -
 * the server remains the authority and a rejected transition is surfaced as a
 * 422 problem document.
 */
export const ALLOWED_TRANSITIONS: Record<ServiceRequestStatus, readonly ServiceRequestStatus[]> = {
  OPEN: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'OPEN'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
}

export function isTerminal(status: ServiceRequestStatus): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0
}
