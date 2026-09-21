import type { ReactNode } from 'react'
import { Alert as MuiAlert, AlertTitle, Box } from '@mui/material'
import { ApiError } from '@/api/ApiError'

type AlertTone = 'error' | 'success' | 'warning' | 'info'

interface AlertProps {
  tone?: AlertTone
  title: string
  children?: ReactNode
  /** Extra controls (retry, refresh, sign in) rendered under the message. */
  actions?: ReactNode
}

export function Alert({ tone = 'info', title, children, actions }: AlertProps) {
  return (
    <MuiAlert
      severity={tone}
      variant="outlined"
      className={`alert alert--${tone}`}
      // Errors interrupt; confirmations wait for a pause in speech.
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Box className="alert__body">
        <AlertTitle className="alert__title">{title}</AlertTitle>
        {children ? <div className="alert__detail">{children}</div> : null}
        {actions ? <div className="alert__actions">{actions}</div> : null}
      </Box>
    </MuiAlert>
  )
}

interface ApiErrorAlertProps {
  error: ApiError | Error
  /** Overrides the problem document's title when a page-specific wording reads better. */
  title?: string
  actions?: ReactNode
  /** Extra guidance shown above the server's own detail. */
  children?: ReactNode
}

/**
 * Renders an `ApiError` using the RFC 7807 fields the server sent: title,
 * detail, per-field messages and the trace id to quote in a support ticket.
 */
export function ApiErrorAlert({ error, title, actions, children }: ApiErrorAlertProps) {
  const isApi = error instanceof ApiError
  const heading = title ?? (isApi ? error.title : 'Something went wrong')
  const detail = isApi ? error.detail : error.message
  const fieldErrors = isApi ? error.fieldErrors : undefined

  return (
    <Alert tone="error" title={heading} actions={actions}>
      {children}
      {detail ? <p>{detail}</p> : null}
      {fieldErrors ? (
        <ul className="alert__list">
          {Object.entries(fieldErrors).flatMap(([field, messages]) =>
            messages.map((message) => <li key={`${field}-${message}`}>{message}</li>),
          )}
        </ul>
      ) : null}
      {isApi && error.traceId ? <p className="alert__trace">Trace ID: {error.traceId}</p> : null}
    </Alert>
  )
}
