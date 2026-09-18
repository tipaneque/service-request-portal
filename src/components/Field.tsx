import { useId, type ReactNode } from 'react'

interface FieldProps {
  label: string
  /** Validation message; its presence switches the control to the invalid state. */
  error?: string | undefined
  hint?: string | undefined
  optional?: boolean
  /**
   * Receives the ids/ARIA attributes the control must carry so that label,
   * hint and error stay programmatically associated with the input.
   */
  children: (props: {
    id: string
    'aria-invalid': boolean | undefined
    'aria-describedby': string | undefined
  }) => ReactNode
}

export function Field({ label, error, hint, optional = false, children }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {/* The space keeps the accessible name readable as "Note (optional)". */}
        {optional ? <span className="field__optional"> (optional)</span> : null}
      </label>

      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy || undefined,
      })}

      {hint ? (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}

      {error ? (
        <p className="field__error" id={errorId}>
          <span aria-hidden="true">!</span>
          {error}
        </p>
      ) : null}
    </div>
  )
}
