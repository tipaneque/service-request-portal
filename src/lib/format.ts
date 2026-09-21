/**
 * Date formatting helpers.
 *
 * The API returns RFC 3339 UTC timestamps; they are rendered in the viewer's
 * locale and timezone, with the machine-readable value kept in `<time dateTime>`
 * so the exact instant is never lost.
 */

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : dateTimeFormatter.format(date)
}

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
]

/** "3 hours ago" style label, used next to the absolute timestamp. */
export function formatRelative(iso: string, now: number = Date.now()): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso

  const diff = date.getTime() - now
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms) {
      return relativeFormatter.format(Math.round(diff / ms), unit)
    }
  }
  return relativeFormatter.format(Math.round(diff / 1000), 'second')
}
