import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  type ListServiceRequestsQuery,
  type ServiceRequestPriority,
  type ServiceRequestStatus,
  type SortOption,
} from '@/api/types'
import { PRIORITIES, SORT_OPTIONS, STATUSES } from '@/domain/serviceRequests'

const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const
const DEFAULT_SORT: SortOption = '-createdAt'

export interface RequestListFilters {
  search: string
  status: ServiceRequestStatus | ''
  priority: ServiceRequestPriority | ''
  sort: SortOption
  page: number
  pageSize: number
}

/**
 * Filter, sort and pagination state lives in the query string rather than in
 * component state: a filtered view is then shareable, bookmarkable and
 * survives a reload, and the browser's back button behaves as users expect.
 * Unknown or malformed values fall back to the defaults instead of being sent
 * to the API, which would answer `400`.
 */
export function useRequestListParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo<RequestListFilters>(() => {
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const sort = searchParams.get('sort')
    const page = Number(searchParams.get('page'))
    const pageSize = Number(searchParams.get('pageSize'))

    return {
      search: searchParams.get('search') ?? '',
      status: STATUSES.includes(status as ServiceRequestStatus)
        ? (status as ServiceRequestStatus)
        : '',
      priority: PRIORITIES.includes(priority as ServiceRequestPriority)
        ? (priority as ServiceRequestPriority)
        : '',
      sort: SORT_OPTIONS.includes(sort as SortOption) ? (sort as SortOption) : DEFAULT_SORT,
      page: Number.isInteger(page) && page >= 1 ? page : 1,
      pageSize: (PAGE_SIZE_OPTIONS as readonly number[]).includes(pageSize)
        ? pageSize
        : DEFAULT_PAGE_SIZE,
    }
  }, [searchParams])

  const updateFilters = useCallback(
    (patch: Partial<RequestListFilters>, options?: { replace?: boolean }) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)

          for (const [key, value] of Object.entries(patch)) {
            if (value === '' || value === undefined || value === null) {
              next.delete(key)
            } else {
              next.set(key, String(value))
            }
          }

          // Any change other than an explicit page move invalidates the current
          // page number - staying on page 7 of a newly filtered set is a
          // reliable way to land on an empty screen.
          if (!('page' in patch)) next.delete('page')

          // Keep defaults out of the URL so shared links stay readable.
          if (next.get('sort') === DEFAULT_SORT) next.delete('sort')
          if (next.get('pageSize') === String(DEFAULT_PAGE_SIZE)) next.delete('pageSize')
          if (next.get('page') === '1') next.delete('page')

          return next
        },
        // Typing in the search box replaces the entry so one search does not
        // create a dozen history steps.
        { replace: options?.replace ?? false },
      )
    },
    [setSearchParams],
  )

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: false })
  }, [setSearchParams])

  /** The filters projected onto the shape `GET /requests` expects. */
  const query = useMemo<ListServiceRequestsQuery>(
    () => ({
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.priority ? { priority: filters.priority } : {}),
      sort: filters.sort,
      page: filters.page,
      pageSize: filters.pageSize,
    }),
    [filters],
  )

  const hasActiveFilters = Boolean(filters.search || filters.status || filters.priority)

  return { filters, query, updateFilters, clearFilters, hasActiveFilters }
}
