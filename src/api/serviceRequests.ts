/**
 * One function per OpenAPI operation. Signatures follow the contract exactly
 * (`operationId` -> function name) so the mapping stays obvious.
 */
import { apiFetch } from './http'
import type {
  CreateServiceRequest,
  ListServiceRequestsQuery,
  ServiceRequest,
  ServiceRequestPage,
  UpdateServiceRequestStatus,
} from './types'

export function listServiceRequests(
  query: ListServiceRequestsQuery,
  signal?: AbortSignal,
): Promise<ServiceRequestPage> {
  return apiFetch<ServiceRequestPage>({
    path: '/requests',
    query: {
      search: query.search,
      status: query.status,
      priority: query.priority,
      sort: query.sort,
      page: query.page,
      pageSize: query.pageSize,
    },
    signal,
  })
}

export function getServiceRequest(
  requestId: string,
  signal?: AbortSignal,
): Promise<ServiceRequest> {
  return apiFetch<ServiceRequest>({
    path: `/requests/${encodeURIComponent(requestId)}`,
    signal,
  })
}

export function createServiceRequest(body: CreateServiceRequest): Promise<ServiceRequest> {
  return apiFetch<ServiceRequest>({
    method: 'POST',
    path: '/requests',
    body,
  })
}

export function updateServiceRequestStatus(
  requestId: string,
  body: UpdateServiceRequestStatus,
): Promise<ServiceRequest> {
  return apiFetch<ServiceRequest>({
    method: 'PATCH',
    path: `/requests/${encodeURIComponent(requestId)}/status`,
    body,
  })
}
