import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useServiceRequests } from '@/api/queries'
import { ApiErrorAlert } from '@/components/Alert'
import { EmptyState } from '@/components/EmptyState'
import { Pagination } from '@/components/Pagination'
import { Spinner } from '@/components/Spinner'
import { RequestFilters } from './RequestFilters'
import { RequestList, RequestListSkeleton } from './RequestList'
import { useRequestListParams } from './useRequestListParams'

export function RequestListPage() {
  const { filters, query, updateFilters, clearFilters, hasActiveFilters } = useRequestListParams()
  const { data, error, isPending, isFetching, isPlaceholderData, refetch } =
    useServiceRequests(query)

  useEffect(() => {
    document.title = 'Service requests | Service Request Portal'
  }, [])

  // A page that no longer exists (filters narrowed the result set) would leave
  // the user staring at an empty table, so step back to the last valid page.
  useEffect(() => {
    if (data && data.totalPages > 0 && filters.page > data.totalPages) {
      updateFilters({ page: data.totalPages }, { replace: true })
    }
  }, [data, filters.page, updateFilters])

  return (
    <div className="stack">
      <div className="page-header">
        <div className="page-header__text">
          <h1>Service requests</h1>
          <p className="page-header__description">
            Browse, search and progress the requests raised by customers.
          </p>
        </div>
        <Link className="button button--primary" to="/requests/new">
          <span aria-hidden="true">+</span> New request
        </Link>
      </div>

      <RequestFilters
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        onChange={updateFilters}
        onClear={clearFilters}
      />

      {/* Result changes are announced without moving focus away from the filters. */}
      <p className="visually-hidden" role="status" aria-live="polite">
        {isPending
          ? 'Loading service requests'
          : data
            ? `${data.total} request${data.total === 1 ? '' : 's'} found`
            : ''}
      </p>

      <section className="panel" aria-label="Service request results">
        {isPending ? (
          <RequestListSkeleton />
        ) : error ? (
          <div style={{ padding: 'var(--space-5)' }}>
            <ApiErrorAlert
              error={error}
              actions={
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => void refetch()}
                >
                  Try again
                </button>
              }
            />
          </div>
        ) : data && data.items.length === 0 ? (
          <EmptyState
            title={hasActiveFilters ? 'No requests match these filters' : 'No service requests yet'}
            description={
              hasActiveFilters
                ? 'Try a different search term, or clear the filters to see every request.'
                : 'Requests raised by customers will appear here once they are created.'
            }
            icon={<span aria-hidden="true">&#9675;</span>}
            action={
              hasActiveFilters ? (
                <button type="button" className="button button--secondary" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : (
                <Link className="button button--primary" to="/requests/new">
                  Create the first request
                </Link>
              )
            }
          />
        ) : data ? (
          <>
            {/* The previous page stays visible while the next one loads. */}
            <div style={{ opacity: isPlaceholderData ? 0.6 : 1, transition: 'opacity 120ms ease' }}>
              <RequestList requests={data.items} />
            </div>
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              totalPages={data.totalPages}
              isBusy={isFetching}
              onPageChange={(page) => updateFilters({ page })}
            />
          </>
        ) : null}
      </section>

      {isFetching && !isPending ? (
        <p className="inline-meta">
          <Spinner label={null} /> Updating results&hellip;
        </p>
      ) : null}
    </div>
  )
}
