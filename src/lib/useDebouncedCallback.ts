import { useCallback, useEffect, useRef } from 'react'

/**
 * Returns a stable function that runs `callback` only after `delayMs` have
 * passed without another call. Used by the search box so typing does not fire
 * one request per keystroke.
 *
 * Debouncing the callback rather than the value keeps the committed value out
 * of render state: nothing has to be reconciled after the fact, and the pending
 * timer is cancelled on unmount.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs = 350,
): (...args: Args) => void {
  const timer = useRef<number | undefined>(undefined)
  const latestCallback = useRef(callback)

  // Keep the newest closure without changing the identity of the returned
  // function, which would restart the timer on every render.
  useEffect(() => {
    latestCallback.current = callback
  }, [callback])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return useCallback(
    (...args: Args) => {
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => latestCallback.current(...args), delayMs)
    },
    [delayMs],
  )
}
