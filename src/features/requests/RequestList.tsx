import { Link } from 'react-router-dom'
import {
  Box,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
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
        <TableContainer className="table-wrapper" component={Paper} elevation={0}>
          <Table className="request-table">
            <caption className="visually-hidden">
              Service requests matching the current filters
            </caption>
            <TableHead>
              <TableRow>
                <TableCell component="th" scope="col">
                  ID
                </TableCell>
                <TableCell component="th" scope="col">
                  Title
                </TableCell>
                <TableCell component="th" scope="col">
                  Category
                </TableCell>
                <TableCell component="th" scope="col">
                  Priority
                </TableCell>
                <TableCell component="th" scope="col">
                  Status
                </TableCell>
                <TableCell component="th" scope="col">
                  Created
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id} hover>
                  <TableCell className="request-table__id">{request.id}</TableCell>
                  <TableCell sx={{ minWidth: 260 }}>
                    <Link className="request-table__title" to={`/requests/${request.id}`}>
                      {request.title}
                    </Link>
                    <span className="request-table__requester">{request.requesterName}</span>
                  </TableCell>
                  <TableCell>{request.category}</TableCell>
                  <TableCell>
                    <PriorityBadge priority={request.priority} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={request.status} />
                  </TableCell>
                  <TableCell className="request-table__date">
                    <time dateTime={request.createdAt} title={formatDateTime(request.createdAt)}>
                      {formatRelative(request.createdAt)}
                    </time>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <Box component="ul" className="request-list--cards">
        {requests.map((request) => (
          <li key={request.id}>
            <Paper
              className="request-card"
              component={Link}
              elevation={0}
              to={`/requests/${request.id}`}
              sx={{
                borderRadius: 'var(--radius-lg)',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 'var(--shadow-lifted)' },
              }}
            >
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
                <time dateTime={request.createdAt}>Created {formatDateTime(request.createdAt)}</time>
                <ChevronRightIcon
                  aria-hidden
                  sx={{ fontSize: 18, ml: 'auto', color: 'text.secondary' }}
                />
              </p>
            </Paper>
          </li>
        ))}
      </Box>
    </>
  )
}

/** Placeholder rows shown while the first page is loading. */
export function RequestListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }} aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} height={52} variant="rounded" sx={{ borderRadius: 3 }} />
      ))}
    </Box>
  )
}
