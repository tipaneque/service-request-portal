import { beforeEach, describe, expect, it } from 'vitest'
import { applyStatusUpdate, findRequest, insertRequest, queryRequests, resetDb } from './db'

/**
 * The mock API stands in for the real service in development and in every
 * component test, so its filtering, sorting, pagination and state machine are
 * worth asserting directly.
 */
describe('mock service-request store', () => {
  beforeEach(resetDb)

  it('paginates with the contract defaults', () => {
    const page = queryRequests({})

    expect(page.items).toHaveLength(10)
    expect(page.page).toBe(1)
    expect(page.total).toBe(42)
    expect(page.totalPages).toBe(5)
  })

  it('returns an empty page rather than an error past the last page', () => {
    const page = queryRequests({ page: 99, pageSize: 10 })

    expect(page.items).toEqual([])
    expect(page.total).toBe(42)
  })

  it('matches the search term against title and requester name, case-insensitively', () => {
    expect(queryRequests({ search: 'INVOICE' }).total).toBe(2)
    expect(queryRequests({ search: 'ana costa' }).total).toBe(1)
  })

  it('combines status and priority filters', () => {
    const page = queryRequests({ status: 'OPEN', priority: 'CRITICAL' })

    expect(page.total).toBe(3)
    expect(page.items.every((item) => item.status === 'OPEN')).toBe(true)
    expect(page.items.every((item) => item.priority === 'CRITICAL')).toBe(true)
  })

  it('sorts by creation date in both directions', () => {
    const newest = queryRequests({ sort: '-createdAt' }).items
    const oldest = queryRequests({ sort: 'createdAt' }).items

    expect(Date.parse(newest[0]!.createdAt)).toBeGreaterThan(Date.parse(newest[1]!.createdAt))
    expect(Date.parse(oldest[0]!.createdAt)).toBeLessThan(Date.parse(oldest[1]!.createdAt))
  })

  it('sorts by priority rank, not alphabetically', () => {
    const items = queryRequests({ sort: '-priority' }).items

    expect(items[0]!.priority).toBe('CRITICAL')
    expect(queryRequests({ sort: 'priority' }).items[0]!.priority).toBe('LOW')
  })

  it('assigns server-owned fields on creation', () => {
    const created = insertRequest({
      title: 'New issue',
      description: 'Something went wrong in a reproducible way.',
      category: 'Other',
      priority: 'HIGH',
      requesterName: 'Test Requester',
      requesterEmail: 'test@example.com',
    })

    expect(created.id).toMatch(/^REQ-\d{4,}$/)
    expect(created.status).toBe('OPEN')
    expect(created.version).toBe(1)
    expect(created.createdAt).toBe(created.updatedAt)
    expect(queryRequests({}).total).toBe(43)
  })

  it('increments the version on a successful transition', () => {
    const before = findRequest('REQ-1001')!
    const result = applyStatusUpdate('REQ-1001', 'IN_PROGRESS', before.version)

    expect(result.ok).toBe(true)
    expect(result.ok && result.request.version).toBe(before.version + 1)
    expect(result.ok && result.request.status).toBe('IN_PROGRESS')
  })

  it('rejects a stale version with a conflict', () => {
    const result = applyStatusUpdate('REQ-1002', 'RESOLVED', 1) // actual version is 4

    expect(result).toEqual({ ok: false, reason: 'conflict', currentVersion: 4 })
  })

  it('rejects a transition the state machine does not allow', () => {
    const closed = findRequest('REQ-1007')! // CLOSED is terminal
    const result = applyStatusUpdate(closed.id, 'IN_PROGRESS', closed.version)

    expect(result).toEqual({ ok: false, reason: 'invalid-transition', from: 'CLOSED' })
  })

  it('reports an unknown id as not found', () => {
    expect(applyStatusUpdate('REQ-9999', 'CLOSED', 1)).toEqual({ ok: false, reason: 'not-found' })
  })

  it('restores the seed data on reset', () => {
    insertRequest({
      title: 'Temporary',
      description: 'Created inside a test run.',
      category: 'Other',
      priority: 'LOW',
      requesterName: 'Test Requester',
      requesterEmail: 'test@example.com',
    })
    expect(queryRequests({}).total).toBe(43)

    resetDb()

    expect(queryRequests({}).total).toBe(42)
  })
})
