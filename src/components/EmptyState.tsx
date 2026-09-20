import type { ReactNode } from 'react'
import { Paper, Typography } from '@mui/material'

interface EmptyStateProps {
  title: string
  description?: string
  /** Decorative glyph; hidden from assistive technology. */
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <Paper
      className="state"
      component="section"
      elevation={0}
      sx={{ background: 'transparent', border: 'none', boxShadow: 'none', backdropFilter: 'none' }}
    >
      {icon ? (
        <span className="state__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <Typography className="state__title" component="h2" variant="h5">
        {title}
      </Typography>
      {description ? (
        <Typography className="state__description" sx={{ mb: 1 }}>
          {description}
        </Typography>
      ) : null}
      {action}
    </Paper>
  )
}
