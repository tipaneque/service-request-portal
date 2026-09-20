import { Box, Button, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  totalPages: number
  /** True while the next page is being fetched; disables the controls. */
  isBusy?: boolean
  onPageChange: (page: number) => void
}

export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  isBusy = false,
  onPageChange,
}: PaginationProps) {
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  const canGoBack = page > 1
  const canGoForward = page < totalPages

  return (
    <Box className="pagination" component="nav" aria-label="Pagination">
      <Typography className="pagination__status" role="status" sx={{ fontSize: '0.8125rem' }}>
        {total === 0
          ? 'No requests to display'
          : `Showing ${first}–${last} of ${total} request${total === 1 ? '' : 's'}`}
      </Typography>

      <Box className="pagination__controls">
        <Button
          type="button"
          variant="outlined"
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoBack || isBusy}
        >
          Previous
        </Button>

        <Typography className="pagination__status" component="span" sx={{ fontSize: '0.8125rem' }}>
          Page {page} of {Math.max(totalPages, 1)}
        </Typography>

        <Button
          type="button"
          variant="outlined"
          size="small"
          endIcon={<ArrowForwardIcon />}
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoForward || isBusy}
        >
          Next
        </Button>
      </Box>
    </Box>
  )
}
