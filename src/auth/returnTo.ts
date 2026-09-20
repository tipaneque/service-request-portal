const DEFAULT_RETURN_TO = '/requests'

/**
 * Accepts only paths on the current origin. Backslashes are rejected because
 * URL parsers may treat them as slashes and turn `/\\host` into a network URL.
 */
export function normaliseReturnTo(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return DEFAULT_RETURN_TO
  }
  if (value.includes('\\')) return DEFAULT_RETURN_TO

  const url = new URL(value, window.location.origin)
  if (url.origin !== window.location.origin) return DEFAULT_RETURN_TO
  return `${url.pathname}${url.search}${url.hash}`
}
