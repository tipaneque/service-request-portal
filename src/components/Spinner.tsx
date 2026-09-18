interface SpinnerProps {
  /** Announced to assistive technology; pass `null` inside an already-labelled region. */
  label?: string | null
  size?: 'small' | 'large'
}

export function Spinner({ label = 'Loading', size = 'small' }: SpinnerProps) {
  return (
    <span
      className={size === 'large' ? 'spinner spinner--large' : 'spinner'}
      role={label ? 'status' : undefined}
      aria-live={label ? 'polite' : undefined}
    >
      {label ? <span className="visually-hidden">{label}</span> : null}
    </span>
  )
}
