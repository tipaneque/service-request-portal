import type { ServiceRequestPriority, ServiceRequestStatus } from '@/api/types'
import { PRIORITY_LABELS, STATUS_LABELS } from '@/domain/serviceRequests'

/**
 * Status and priority are encoded with colour *and* text, never colour alone,
 * so the meaning survives greyscale and colour-vision deficiency.
 */

export function StatusBadge({ status }: { status: ServiceRequestStatus }) {
  return (
    <span className={`badge badge--${status}`}>
      <span className="visually-hidden">Status: </span>
      {STATUS_LABELS[status]}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: ServiceRequestPriority }) {
  return (
    <span className={`badge badge--${priority}`}>
      <span className="visually-hidden">Priority: </span>
      {PRIORITY_LABELS[priority]}
    </span>
  )
}
