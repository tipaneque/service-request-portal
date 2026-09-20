import type {
  ServiceRequestPriority,
  ServiceRequestStatus,
  SortOption,
} from '@/api/types'

/** Runtime vocabulary and business rules built on top of the generated contract types. */
export const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const satisfies readonly ServiceRequestStatus[]

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const satisfies readonly ServiceRequestPriority[]

export const SORT_OPTIONS = [
  '-createdAt',
  'createdAt',
  '-updatedAt',
  'updatedAt',
  '-priority',
  'priority',
] as const satisfies readonly SortOption[]

export const STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
}

export const PRIORITY_LABELS: Record<ServiceRequestPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
}

export const SORT_LABELS: Record<SortOption, string> = {
  '-createdAt': 'Newest first',
  createdAt: 'Oldest first',
  '-updatedAt': 'Recently updated',
  updatedAt: 'Least recently updated',
  '-priority': 'Highest priority',
  priority: 'Lowest priority',
}

/** Status transitions allowed by the OpenAPI contract. */
export const ALLOWED_TRANSITIONS: Record<ServiceRequestStatus, readonly ServiceRequestStatus[]> = {
  OPEN: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'OPEN'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
}

export function isTerminal(status: ServiceRequestStatus): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0
}
