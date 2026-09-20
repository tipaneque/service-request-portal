import { useState, type ReactNode } from 'react'
import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import ClearAllIcon from '@mui/icons-material/ClearAll'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/SearchOutlined'
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
import { useDebouncedCallback } from '@/lib/useDebouncedCallback'
import { PAGE_SIZE_OPTIONS, type RequestListFilters } from './useRequestListParams'

interface RequestFiltersProps {
  filters: RequestListFilters
  hasActiveFilters: boolean
  onChange: (patch: Partial<RequestListFilters>, options?: { replace?: boolean }) => void
  onClear: () => void
}

/**
 * An active filter is removed from the chip itself, so the delete control needs
 * a name of its own: "×" alone tells a screen-reader user nothing about which
 * filter is about to disappear.
 */
function FilterChip({ label, removeLabel, onRemove }: {
  label: ReactNode
  removeLabel: string
  onRemove: () => void
}) {
  return (
    <Chip
      size="small"
      label={label}
      onDelete={onRemove}
      deleteIcon={
        <IconButton aria-label={removeLabel} size="small" sx={{ borderRadius: '50%', p: 0.25 }}>
          <CloseIcon sx={{ fontSize: 15 }} />
        </IconButton>
      }
      sx={{ maxWidth: '100%', '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
    />
  )
}

export function RequestFilters({
  filters,
  hasActiveFilters,
  onChange,
  onClear,
}: RequestFiltersProps) {
  const [searchDraft, setSearchDraft] = useState(filters.search)
  const [pushedSearch, setPushedSearch] = useState(filters.search)
  // A term carried in the URL means the field is already in use: open on it.
  const [isSearchOpen, setIsSearchOpen] = useState(filters.search !== '')

  const commitSearch = useDebouncedCallback((value: string) => {
    setPushedSearch(value)
    onChange({ search: value }, { replace: true })
  })

  if (filters.search !== pushedSearch) {
    setPushedSearch(filters.search)
    setSearchDraft(filters.search)
  }

  const closeSearch = () => {
    setIsSearchOpen(false)
    setSearchDraft('')
    if (filters.search) {
      setPushedSearch('')
      onChange({ search: '' }, { replace: true })
    }
  }

  return (
    <Paper className="filters" role="search" aria-label="Request filters" elevation={0}>
      <Box className="filters__row">
        {/*
         * The search field is summoned by its icon rather than occupying the
         * bar permanently; opening it takes flex space from the selects, which
         * shrink to make room.
         */}
        <Collapse
          in={!isSearchOpen}
          orientation="horizontal"
          unmountOnExit
          sx={{ flex: '0 0 auto' }}
        >
          <Tooltip title="Search requests">
            <IconButton
              aria-label="Search requests"
              onClick={() => setIsSearchOpen(true)}
              sx={{
                border: '1px solid var(--hairline)',
                backgroundColor: 'var(--glass-soft)',
                height: 48,
                width: 48,
              }}
            >
              <SearchIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Collapse>

        <Collapse
          in={isSearchOpen}
          orientation="horizontal"
          unmountOnExit
          className="filters__search"
        >
          <TextField
            label="Search"
            autoFocus
            type="search"
            placeholder="e.g. portal, invoice, Ana Costa"
            value={searchDraft}
            onChange={(event) => {
              setSearchDraft(event.target.value)
              commitSearch(event.target.value)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') closeSearch()
            }}
            slotProps={{
              htmlInput: { maxLength: 100 },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 19, color: 'text.secondary' }} aria-hidden />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton aria-label="Close search" size="small" onClick={closeSearch}>
                      <CloseIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: { xs: '100%', sm: 300 } }}
          />
        </Collapse>

        <TextField
          select
          slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          label="Status"
          className="filters__select"
          value={filters.status}
          onChange={(event) => onChange({ status: event.target.value as ServiceRequestStatus | '' })}
        >
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </TextField>

        <TextField
          select
          slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          label="Priority"
          className="filters__select"
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
        </TextField>

        <TextField
          select
          slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          label="Sort by"
          className="filters__select"
          value={filters.sort}
          onChange={(event) => onChange({ sort: event.target.value as SortOption })}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {SORT_LABELS[option]}
            </option>
          ))}
        </TextField>

        <Box className="rows-control">
          <Typography component="span" variant="body2">
            Rows
          </Typography>
          <TextField
            select
            size="small"
            value={filters.pageSize}
            onChange={(event) => onChange({ pageSize: Number(event.target.value) })}
            slotProps={{ select: { native: true, 'aria-label': 'Rows per page' } }}
            sx={{ width: 76 }}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </TextField>
        </Box>
      </Box>

      {hasActiveFilters ? (
        <Box className="filters__footer">
          <Box className="filters__chips">
            {filters.search ? (
              <FilterChip
                label={`Search: ${filters.search}`}
                removeLabel="Remove search filter"
                onRemove={() => onChange({ search: '' })}
              />
            ) : null}
            {filters.status ? (
              <FilterChip
                label={STATUS_LABELS[filters.status]}
                removeLabel="Remove status filter"
                onRemove={() => onChange({ status: '' })}
              />
            ) : null}
            {filters.priority ? (
              <FilterChip
                label={PRIORITY_LABELS[filters.priority]}
                removeLabel="Remove priority filter"
                onRemove={() => onChange({ priority: '' })}
              />
            ) : null}
            <Button size="small" variant="text" startIcon={<ClearAllIcon />} onClick={onClear}>
              Clear all
            </Button>
          </Box>
        </Box>
      ) : null}
    </Paper>
  )
}
