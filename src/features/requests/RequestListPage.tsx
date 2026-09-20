import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Box, Button, Fade, Paper, Typography } from '@mui/material'
import InboxIcon from '@mui/icons-material/InboxOutlined'
import { useServiceRequests } from '@/api/queries'
import { ApiErrorAlert } from '@/components/Alert'
import { EmptyState } from '@/components/EmptyState'
import { Pagination } from '@/components/Pagination'
import { Spinner } from '@/components/Spinner'
import { IMAGES } from '@/lib/assets'
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
          <Typography className="page-header__title" component="h1" variant="h3">
            Service requests
          </Typography>
          <Typography className="page-header__description">
            Browse, search and progress the requests raised by customers.
          </Typography>
        </div>
        <Button
          component={Link}
          variant="contained"
          size="large"
          startIcon={
            <Box
              component="img"
              src={IMAGES.add}
              alt=""
              // The mark is drawn in near-black; flattening it to white keeps
              // the shape while making it legible on the accent fill.
              sx={{ width: 20, height: 20, filter: 'brightness(0) invert(1)' }}
            />
          }
          to="/requests/new"
          sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
        >
          New request
        </Button>
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

      <Paper
        className="panel"
        component="section"
        elevation={0}
        aria-label="Service request results"
      >
        {isPending ? (
          <RequestListSkeleton />
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <ApiErrorAlert
              error={error}
              actions={
                <Button type="button" variant="contained" onClick={() => void refetch()}>
                  Try again
                </Button>
              }
            />
          </Box>
        ) : data && data.items.length === 0 ? (
          <EmptyState
            title={hasActiveFilters ? 'No requests match these filters' : 'No service requests yet'}
            description={
              hasActiveFilters
                ? 'Try a different search term, or clear the filters to see every request.'
                : 'Requests raised by customers will appear here once they are created.'
            }
            icon={<InboxIcon aria-hidden />}
            action={
              hasActiveFilters ? (
                <Button type="button" variant="outlined" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button component={Link} variant="contained" to="/requests/new">
                  Create the first request
                </Button>
              )
            }
          />
        ) : data ? (
          <>
            {/* The previous page stays visible while the next one loads. */}
            <Box
              aria-busy={isPlaceholderData}
              sx={{
                opacity: isPlaceholderData ? 0.55 : 1,
                transition: 'opacity 220ms',
              }}
            >
              <RequestList requests={data.items} />
            </Box>
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
      </Paper>

      <Fade in={isFetching && !isPending} unmountOnExit>
        <Paper
          elevation={0}
          sx={{
            position: 'fixed',
            left: '50%',
            bottom: 24,
            transform: 'translateX(-50%)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 2.5,
            py: 1,
            borderRadius: 999,
            fontSize: '0.8125rem',
            boxShadow: 'var(--shadow-lifted)',
          }}
        >
          <Spinner label={null} />
          <span>Updating results…</span>
        </Paper>
      </Fade>
    </div>
  )
}
