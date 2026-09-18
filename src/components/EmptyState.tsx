import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  /** Decorative glyph; hidden from assistive technology. */
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="state">
      {icon ? (
        <span className="state__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <p className="state__title">{title}</p>
      {description ? <p className="state__description">{description}</p> : null}
      {action}
    </div>
  )
}
