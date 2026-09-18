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
    <nav className="pagination" aria-label="Pagination">
      <p className="pagination__status" role="status">
        {total === 0
          ? 'No requests to display'
          : `Showing ${first}–${last} of ${total} request${total === 1 ? '' : 's'}`}
      </p>

      <div className="pagination__controls">
        <button
          type="button"
          className="button button--secondary"
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoBack || isBusy}
        >
          <span aria-hidden="true">&#8592;</span> Previous
        </button>

        <span className="pagination__status">
          Page {page} of {Math.max(totalPages, 1)}
        </span>

        <button
          type="button"
          className="button button--secondary"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoForward || isBusy}
        >
          Next <span aria-hidden="true">&#8594;</span>
        </button>
      </div>
    </nav>
  )
}
