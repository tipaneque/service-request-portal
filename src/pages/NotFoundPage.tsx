import { Link } from 'react-router-dom'
import { Button, Paper } from '@mui/material'
import { EmptyState } from '@/components/EmptyState'

export function NotFoundPage() {
  return (
    <Paper className="panel" component="section" elevation={0}>
      <EmptyState
        title="Page not found"
        description="The page you asked for does not exist or has moved."
        icon={<span style={{ fontWeight: 700, fontSize: '1.1rem' }}>404</span>}
        action={
          <Button component={Link} variant="contained" to="/requests">
            Go to service requests
          </Button>
        }
      />
    </Paper>
  )
}
