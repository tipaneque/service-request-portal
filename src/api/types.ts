/**
 * Domain aliases over the auto-generated OpenAPI types.
 *
 * `schema.ts` is generated from `openapi/frontend-challenge-api.openapi.yaml` by
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
