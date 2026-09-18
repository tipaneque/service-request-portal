/**
 * TanStack Query bindings: cache keys, fetchers and mutations.
 *
 * Server state lives here exclusively; component state stays in components and
 * filter state lives in the URL. Keys are derived from the full query object so
 * every filter/pagination combination is cached independently.
 */
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import type { ApiError } from './ApiError'
import {
  createServiceRequest,
  getServiceRequest,
  listServiceRequests,
  updateServiceRequestStatus,
} from './serviceRequests'
import type {
  CreateServiceRequest,
  ListServiceRequestsQuery,
  ServiceRequest,
  ServiceRequestPage,
  UpdateServiceRequestStatus,
} from './types'

export const serviceRequestKeys = {
  all: ['service-requests'] as const,
  lists: () => [...serviceRequestKeys.all, 'list'] as const,
  list: (query: ListServiceRequestsQuery) => [...serviceRequestKeys.lists(), query] as const,
  details: () => [...serviceRequestKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceRequestKeys.details(), id] as const,
}

export function useServiceRequests(
  query: ListServiceRequestsQuery,
): UseQueryResult<ServiceRequestPage, ApiError> {
  return useQuery({
    queryKey: serviceRequestKeys.list(query),
    queryFn: ({ signal }) => listServiceRequests(query, signal),
    // Keeps the previous page visible while the next one loads, which avoids a
    // full-table spinner on every keystroke or page change.
    placeholderData: keepPreviousData,
  })
}

export function useServiceRequest(
  requestId: string | undefined,
): UseQueryResult<ServiceRequest, ApiError> {
  return useQuery({
    queryKey: serviceRequestKeys.detail(requestId ?? ''),
    queryFn: ({ signal }) => getServiceRequest(requestId as string, signal),
    enabled: Boolean(requestId),
  })
}

export function useCreateServiceRequest(): UseMutationResult<
  ServiceRequest,
  ApiError,
  CreateServiceRequest
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createServiceRequest,
    onSuccess: (created) => {
      queryClient.setQueryData(serviceRequestKeys.detail(created.id), created)
      void queryClient.invalidateQueries({ queryKey: serviceRequestKeys.lists() })
    },
  })
}

export interface UpdateStatusVariables extends UpdateServiceRequestStatus {
  requestId: string
}

export function useUpdateServiceRequestStatus(): UseMutationResult<
  ServiceRequest,
  ApiError,
  UpdateStatusVariables
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, ...body }: UpdateStatusVariables) =>
      updateServiceRequestStatus(requestId, body),
    onSuccess: (updated) => {
      // The response carries the incremented version, so seed the cache with it
      // to keep optimistic-concurrency checks working without an extra refetch.
      queryClient.setQueryData(serviceRequestKeys.detail(updated.id), updated)
      void queryClient.invalidateQueries({ queryKey: serviceRequestKeys.lists() })
    },
    onError: (error, variables) => {
      // A 409 means our cached copy is stale - refetch so the user sees the
      // current record before retrying.
      if (error.isConflict) {
        void queryClient.invalidateQueries({
          queryKey: serviceRequestKeys.detail(variables.requestId),
        })
      }
    },
  })
}
