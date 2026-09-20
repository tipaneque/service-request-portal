import { CircularProgress } from '@mui/material'

interface SpinnerProps {
  /** Announced to assistive technology; pass `null` inside an already-labelled region. */
  label?: string | null
  size?: 'small' | 'large'
}

export function Spinner({ label = 'Loading', size = 'small' }: SpinnerProps) {
  return (
    <span
      className="spinner-wrapper"
      role={label ? 'status' : undefined}
      aria-live={label ? 'polite' : undefined}
    >
      <CircularProgress
        size={size === 'large' ? 44 : 18}
        thickness={4}
        aria-hidden={label ? true : undefined}
      />
      {label ? <span className="visually-hidden">{label}</span> : null}
    </span>
  )
}
