import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useServiceRequest } from '@/api/queries'
import { PriorityBadge, StatusBadge } from '@/components/Badges'
import { Alert, ApiErrorAlert } from '@/components/Alert'
import { EmptyState } from '@/components/EmptyState'
import { Spinner } from '@/components/Spinner'
import { formatDateTime, formatRelative } from '@/lib/format'
import { StatusUpdatePanel } from './StatusUpdatePanel'

function DetailSkeleton() {
  return (
    <div className="panel panel--padded stack" aria-hidden="true">
      <div className="skeleton" style={{ height: '1.75rem', width: '60%' }} />
      <div className="skeleton" style={{ height: '1rem', width: '35%' }} />
      <div className="skeleton" style={{ height: '6rem' }} />
    </div>
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
        <span aria-hidden="true"> / </span>
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
          <section className="panel">
            <EmptyState
              title="Service request not found"
              description={
                error.detail ?? `No service request exists with id ${requestId ?? 'unknown'}.`
              }
              icon={<span aria-hidden="true">?</span>}
              action={
                <Link className="button button--primary" to="/requests">
                  Back to all requests
                </Link>
              }
            />
          </section>
        ) : (
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
              <p className="inline-meta">
                <span className="mono">{request.id}</span>
                <StatusBadge status={request.status} />
                <PriorityBadge priority={request.priority} />
              </p>
              <h1>{request.title}</h1>
              <p className="page-header__description">
                Raised by {request.requesterName} &middot;{' '}
                <time dateTime={request.createdAt}>{formatRelative(request.createdAt)}</time>
              </p>
            </div>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              {isFetching ? <Spinner label={null} /> : null}
              Refresh
            </button>
          </div>

          <div className="detail-grid">
            <section className="panel" aria-labelledby="details-heading">
              <div className="panel__header">
                <h2 className="panel__title" id="details-heading">
                  Request details
                </h2>
              </div>
              <div className="panel__body stack">
                <div>
                  <h3 className="field__label">Description</h3>
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
              </div>
            </section>

            <section className="panel" aria-labelledby="status-heading">
              <div className="panel__header">
                <h2 className="panel__title" id="status-heading">
                  Update status
                </h2>
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
            </section>
          </div>
        </>
      ) : null}
    </div>
  )
}
