import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'

export function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you asked for does not exist or has moved."
      icon={<span style={{ fontWeight: 700 }}>404</span>}
      action={
        <Link className="button button--primary" to="/requests">
          Go to service requests
        </Link>
      }
    />
  )
}
