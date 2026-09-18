import { Link } from 'react-router-dom'
import type { ServiceRequest } from '@/api/types'
import { PriorityBadge, StatusBadge } from '@/components/Badges'
import { formatDateTime, formatRelative } from '@/lib/format'

interface RequestListProps {
  requests: ServiceRequest[]
}

/**
 * Two presentations of the same data: a table from 900px up, stacked cards
 * below it. A table squeezed onto a phone forces horizontal scrolling and
 * hides the columns that matter, so the narrow layout uses cards instead.
 * Exactly one is in the accessibility tree at a time (the other is
 * `display: none`), so nothing is announced twice.
 */
export function RequestList({ requests }: RequestListProps) {
  return (
    <>
      <div className="request-list--table">
        <div className="table-wrapper">
          <table className="request-table">
            <caption className="visually-hidden">
              Service requests matching the current filters
            </caption>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Title</th>
                <th scope="col">Category</th>
                <th scope="col">Priority</th>
                <th scope="col">Status</th>
                <th scope="col">Created</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="request-table__id">{request.id}</td>
                  <td>
                    <Link className="request-table__title" to={`/requests/${request.id}`}>
                      {request.title}
                    </Link>
                    <span className="request-table__requester">{request.requesterName}</span>
                  </td>
                  <td>{request.category}</td>
                  <td>
                    <PriorityBadge priority={request.priority} />
                  </td>
                  <td>
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="request-table__date">
                    <time dateTime={request.createdAt} title={formatDateTime(request.createdAt)}>
                      {formatRelative(request.createdAt)}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ul className="request-list--cards" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {requests.map((request) => (
          <li key={request.id}>
            <Link className="request-card" to={`/requests/${request.id}`}>
              <div className="request-card__top">
                <span className="request-table__id">{request.id}</span>
                <StatusBadge status={request.status} />
              </div>
              <p className="request-card__title">{request.title}</p>
              <p className="request-card__meta">
                <span>{request.requesterName}</span>
                <span>{request.category}</span>
              </p>
              <div className="request-card__badges">
                <PriorityBadge priority={request.priority} />
              </div>
              <p className="request-card__meta">
                <time dateTime={request.createdAt}>
                  Created {formatDateTime(request.createdAt)}
                </time>
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

/** Placeholder rows shown while the first page is loading. */
export function RequestListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="stack stack--tight" style={{ padding: 'var(--space-4)' }} aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="skeleton" style={{ height: '3.25rem' }} />
      ))}
    </div>
  )
}
