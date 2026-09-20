import { useState } from 'react'
import {
  type ServiceRequestPriority,
  type ServiceRequestStatus,
  type SortOption,
} from '@/api/types'
import {
  PRIORITIES,
  PRIORITY_LABELS,
  SORT_LABELS,
  SORT_OPTIONS,
  STATUSES,
  STATUS_LABELS,
} from '@/domain/serviceRequests'
import { Field } from '@/components/Field'
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import { PAGE_SIZE_OPTIONS, type RequestListFilters } from './useRequestListParams'

interface RequestFiltersProps {
  filters: RequestListFilters
  hasActiveFilters: boolean
  onChange: (patch: Partial<RequestListFilters>, options?: { replace?: boolean }) => void
  onClear: () => void
}

export function RequestFilters({
  filters,
  hasActiveFilters,
  onChange,
  onClear,
}: RequestFiltersProps) {
  // The input updates on every keystroke; the URL (and therefore the request)
  // is only updated once typing settles.
  const [searchDraft, setSearchDraft] = useState(filters.search)
  // The last value this component pushed into the URL. It tells an echo of our
  // own update apart from a change made somewhere else.
  const [pushedSearch, setPushedSearch] = useState(filters.search)

  const commitSearch = useDebouncedCallback((value: string) => {
    setPushedSearch(value)
    onChange({ search: value }, { replace: true })
  })

  // A change made elsewhere (chip removal, "clear all", browser back) is
  // adopted during render rather than in an effect, which would paint the stale
  // text first and then correct it.
  if (filters.search !== pushedSearch) {
    setPushedSearch(filters.search)
    setSearchDraft(filters.search)
  }

  return (
    <div className="filters" role="search" aria-label="Request filters">
      <div className="filters__row">
        <Field label="Search" hint="Matches the title or the requester name.">
          {(props) => (
            <input
              {...props}
              className="control"
              type="search"
              placeholder="e.g. portal, invoice, Ana Costa"
              value={searchDraft}
              onChange={(event) => {
                setSearchDraft(event.target.value)
                commitSearch(event.target.value)
              }}
              maxLength={100}
            />
          )}
        </Field>

        <Field label="Status">
          {(props) => (
            <select
              {...props}
              className="control"
              value={filters.status}
              onChange={(event) =>
                onChange({ status: event.target.value as ServiceRequestStatus | '' })
              }
            >
              <option value="">All statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Priority">
          {(props) => (
            <select
              {...props}
              className="control"
              value={filters.priority}
              onChange={(event) =>
                onChange({ priority: event.target.value as ServiceRequestPriority | '' })
              }
            >
              <option value="">All priorities</option>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Sort by">
          {(props) => (
            <select
              {...props}
              className="control"
              value={filters.sort}
              onChange={(event) => onChange({ sort: event.target.value as SortOption })}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {SORT_LABELS[option]}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <div className="filters__footer">
        <div className="filters__chips">
          {filters.search ? (
            <button
              type="button"
              className="chip"
              onClick={() => onChange({ search: '' })}
            >
              Search: {filters.search}
              <span aria-hidden="true">&times;</span>
              <span className="visually-hidden">Remove search filter</span>
            </button>
          ) : null}

          {filters.status ? (
            <button type="button" className="chip" onClick={() => onChange({ status: '' })}>
              {STATUS_LABELS[filters.status]}
              <span aria-hidden="true">&times;</span>
              <span className="visually-hidden">Remove status filter</span>
            </button>
          ) : null}

          {filters.priority ? (
            <button type="button" className="chip" onClick={() => onChange({ priority: '' })}>
              {PRIORITY_LABELS[filters.priority]}
              <span aria-hidden="true">&times;</span>
              <span className="visually-hidden">Remove priority filter</span>
            </button>
          ) : null}

          {hasActiveFilters ? (
            <button type="button" className="button button--ghost" onClick={onClear}>
              Clear all
            </button>
          ) : null}
        </div>

        <label className="inline-meta">
          Rows per page
          <select
            className="control"
            style={{ width: 'auto', minHeight: '2rem', padding: '0.15rem 1.9rem 0.15rem 0.5rem' }}
            value={filters.pageSize}
            onChange={(event) => onChange({ pageSize: Number(event.target.value) })}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
