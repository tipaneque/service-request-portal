import { describe, expect, it } from 'vitest'
import { formatDateTime, formatRelative } from './format'

describe('date formatting', () => {
  const iso = '2026-02-12T09:00:00Z'

  it('renders an absolute timestamp', () => {
    expect(formatDateTime(iso)).toMatch(/2026/)
  })

  // Wording comes from `Intl.RelativeTimeFormat` in the viewer's locale, which
  // is not what this function is responsible for. What is tested here is the
  // unit it selects and the quantity it rounds to, so the expectations are
  // built with the same API and stay valid in any locale.
  it('picks the largest fitting unit against a fixed reference point', () => {
    const now = Date.parse('2026-02-12T12:00:00Z')
    const expected = (value: number, unit: Intl.RelativeTimeFormatUnit) =>
      new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(value, unit)

    expect(formatRelative(iso, now)).toBe(expected(-3, 'hour'))
    expect(formatRelative('2026-02-10T09:00:00Z', now)).toBe(expected(-2, 'day'))
    expect(formatRelative('2026-01-12T09:00:00Z', now)).toBe(expected(-1, 'month'))
    expect(formatRelative('2026-02-12T11:59:10Z', now)).toBe(expected(-50, 'second'))
    expect(formatRelative('2026-02-12T12:30:00Z', now)).toBe(expected(30, 'minute'))
  })

  it('passes a malformed value through untouched rather than showing "Invalid Date"', () => {
    expect(formatDateTime('not-a-date')).toBe('not-a-date')
    expect(formatRelative('not-a-date')).toBe('not-a-date')
  })
})
