/**
 * In-memory store backing the mock API.
 *
 * It implements the behaviour the contract promises - filtering, sorting,
 * pagination, optimistic concurrency and the status state machine - so the UI
 * is exercised against realistic responses instead of static fixtures.
 */
import {
  type CreateServiceRequest,
  type ListServiceRequestsQuery,
  type ServiceRequest,
  type ServiceRequestPage,
  type ServiceRequestPriority,
  type ServiceRequestStatus,
} from '@/api/types'
import { buildSeedRequests } from './seed'

const PRIORITY_ORDER: Record<ServiceRequestPriority, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
}

// Kept independent from the UI transition map on purpose: contract tests must
// be able to catch a client rule that drifts from server behaviour.
const SERVER_TRANSITIONS: Record<ServiceRequestStatus, readonly ServiceRequestStatus[]> = {
  OPEN: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'OPEN'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
}

let requests: ServiceRequest[] = buildSeedRequests()
let nextId = 1001 + requests.length

/** Restores the seed data. Called between tests to keep them independent. */
export function resetDb(): void {
  requests = buildSeedRequests()
  nextId = 1001 + requests.length
}

export function findRequest(id: string): ServiceRequest | undefined {
  return requests.find((request) => request.id === id)
}

export function queryRequests(query: ListServiceRequestsQuery): ServiceRequestPage {
  const page = query.page ?? 1
  const pageSize = query.pageSize ?? 10
  const sort = query.sort ?? '-createdAt'

  let result = [...requests]

  if (query.search) {
    const needle = query.search.trim().toLowerCase()
    result = result.filter(
      (request) =>
        request.title.toLowerCase().includes(needle) ||
        request.requesterName.toLowerCase().includes(needle),
    )
  }

  if (query.status) {
    result = result.filter((request) => request.status === query.status)
  }

  if (query.priority) {
    result = result.filter((request) => request.priority === query.priority)
  }

  const descending = sort.startsWith('-')
  const field = descending ? sort.slice(1) : sort
  result.sort((a, b) => {
    const comparison =
      field === 'priority'
        ? PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
        : Date.parse(field === 'updatedAt' ? a.updatedAt : a.createdAt) -
          Date.parse(field === 'updatedAt' ? b.updatedAt : b.createdAt)
    return descending ? -comparison : comparison
  })

  const total = result.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize

  return {
    items: result.slice(start, start + pageSize),
    page,
    pageSize,
    total,
    totalPages,
  }
}

export function insertRequest(input: CreateServiceRequest): ServiceRequest {
  const now = new Date().toISOString()
  const created: ServiceRequest = {
    id: `REQ-${nextId++}`,
    title: input.title,
    description: input.description,
    category: input.category,
    priority: input.priority,
    // The server owns these fields; a client-supplied value is ignored.
    status: 'OPEN',
    requesterName: input.requesterName,
    requesterEmail: input.requesterEmail,
    createdAt: now,
    updatedAt: now,
    version: 1,
  }
  requests = [created, ...requests]
  return created
}

type StatusUpdateResult =
  | { ok: true; request: ServiceRequest }
  | { ok: false; reason: 'not-found' }
  | { ok: false; reason: 'conflict'; currentVersion: number }
  | { ok: false; reason: 'invalid-transition'; from: ServiceRequestStatus }

export function applyStatusUpdate(
  id: string,
  status: ServiceRequestStatus,
  version: number,
): StatusUpdateResult {
  const existing = findRequest(id)
  if (!existing) return { ok: false, reason: 'not-found' }

  // Optimistic concurrency: the client must echo the version it last read.
  if (existing.version !== version) {
    return { ok: false, reason: 'conflict', currentVersion: existing.version }
  }

  if (!SERVER_TRANSITIONS[existing.status].includes(status)) {
    return { ok: false, reason: 'invalid-transition', from: existing.status }
  }

  const updated: ServiceRequest = {
    ...existing,
    status,
    updatedAt: new Date().toISOString(),
    version: existing.version + 1,
  }
  requests = requests.map((request) => (request.id === id ? updated : request))
  return { ok: true, request: updated }
}
