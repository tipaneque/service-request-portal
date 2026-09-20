import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Box, Button, Paper, Skeleton, Typography } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchOffIcon from '@mui/icons-material/SearchOff'
import { useServiceRequest } from '@/api/queries'
import { PriorityBadge, StatusBadge } from '@/components/Badges'
import { Alert, ApiErrorAlert } from '@/components/Alert'
import { EmptyState } from '@/components/EmptyState'
import { Spinner } from '@/components/Spinner'
import { formatDateTime, formatRelative } from '@/lib/format'
import { StatusUpdatePanel } from './StatusUpdatePanel'

function DetailSkeleton() {
  return (
    <Paper className="panel panel--padded stack" elevation={0} aria-hidden="true">
      <Skeleton variant="rounded" height={28} width="60%" />
      <Skeleton variant="rounded" height={16} width="35%" />
      <Skeleton variant="rounded" height={96} />
    </Paper>
  )
}

export function RequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const location = useLocation()
  const { data: request, error, isPending, refetch, isFetching } = useServiceRequest(requestId)

  const justCreated = (location.state as { justCreated?: boolean } | null)?.justCreated ?? false
  const [statusChanged, setStatusChanged] = useState<string | null>(null)

  useEffect(() => {
    document.title = request
      ? `${request.id} ${request.title} | Service Request Portal`
      : 'Service request | Service Request Portal'
  }, [request])

  return (
    <div className="stack">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/requests">Service requests</Link>
        <span aria-hidden="true">/</span>
        <span className="mono">{requestId}</span>
      </nav>

      {isPending ? (
        <>
          <p className="visually-hidden" role="status">
            Loading service request
          </p>
          <DetailSkeleton />
        </>
      ) : error ? (
        error.isNotFound ? (
          <Paper className="panel" component="section" elevation={0}>
            <EmptyState
              title="Service request not found"
              description={
                error.detail ?? `No service request exists with id ${requestId ?? 'unknown'}.`
              }
              icon={<SearchOffIcon aria-hidden />}
              action={
                <Button component={Link} variant="contained" to="/requests">
                  Back to all requests
                </Button>
              }
            />
          </Paper>
        ) : (
          <ApiErrorAlert
            error={error}
            actions={
              <Button type="button" variant="contained" onClick={() => void refetch()}>
                Try again
              </Button>
            }
          />
        )
      ) : request ? (
        <>
          {justCreated ? (
            <Alert tone="success" title="Service request created">
              <p>
                <span className="mono">{request.id}</span> has been logged and is now open for
                triage.
              </p>
            </Alert>
          ) : null}

          {statusChanged ? (
            <Alert tone="success" title="Status updated">
              <p>{statusChanged}</p>
            </Alert>
          ) : null}

          <div className="page-header">
            <div className="page-header__text">
              <div className="inline-meta">
                <span className="mono">{request.id}</span>
                <StatusBadge status={request.status} />
                <PriorityBadge priority={request.priority} />
              </div>
              <Typography className="page-header__title" component="h1" variant="h3">
                {request.title}
              </Typography>
              <Typography className="page-header__description">
                Raised by {request.requesterName} &middot;{' '}
                <time dateTime={request.createdAt}>{formatRelative(request.createdAt)}</time>
              </Typography>
            </div>
            <Button
              type="button"
              variant="outlined"
              onClick={() => void refetch()}
              disabled={isFetching}
              startIcon={isFetching ? <Spinner label={null} /> : <RefreshIcon />}
            >
              Refresh
            </Button>
          </div>

          <div className="detail-grid">
            <Paper className="panel" component="section" elevation={0} aria-labelledby="details-heading">
              <div className="panel__header">
                <Typography className="panel__title" component="h2" id="details-heading">
                  Request details
                </Typography>
              </div>
              <Box className="panel__body stack">
                <div>
                  <h3 className="detail-label">Description</h3>
                  <p className="detail-description">{request.description}</p>
                </div>

                <dl className="definition-list">
                  <div>
                    <dt>Category</dt>
                    <dd>{request.category}</dd>
                  </div>
                  <div>
                    <dt>Requester</dt>
                    <dd>
                      {request.requesterName}
                      <br />
                      <a href={`mailto:${request.requesterEmail}`}>{request.requesterEmail}</a>
                    </dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>
                      <time dateTime={request.createdAt}>{formatDateTime(request.createdAt)}</time>
                    </dd>
                  </div>
                  <div>
                    <dt>Last updated</dt>
                    <dd>
                      <time dateTime={request.updatedAt}>{formatDateTime(request.updatedAt)}</time>
                    </dd>
                  </div>
                  <div>
                    <dt>Priority</dt>
                    <dd>
                      <PriorityBadge priority={request.priority} />
                    </dd>
                  </div>
                  <div>
                    <dt>Version</dt>
                    <dd className="mono">{request.version}</dd>
                  </div>
                </dl>
              </Box>
            </Paper>

            <Paper className="panel" component="section" elevation={0} aria-labelledby="status-heading">
              <div className="panel__header">
                <Typography className="panel__title" component="h2" id="status-heading">
                  Update status
                </Typography>
              </div>
              <div className="panel__body">
                <StatusUpdatePanel
                  key={`${request.id}-${request.version}`}
                  request={request}
                  onUpdated={(updated) =>
                    setStatusChanged(
                      `${updated.id} is now ${updated.status.toLowerCase().replace('_', ' ')}.`,
                    )
                  }
                />
              </div>
            </Paper>
          </div>
        </>
      ) : null}
    </div>
  )
}
