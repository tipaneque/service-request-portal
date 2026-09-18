import { env } from '@/config/env'

/**
 * Starts the service worker when API mocking is enabled. Awaited before the
 * app renders so the first request is never missed.
 */
export async function startMockWorker(): Promise<void> {
  if (!env.enableApiMocks) return

  const { worker } = await import('./browser')
  await worker.start({
    // Only the Service Request API is mocked; everything else (OIDC discovery,
    // assets) must reach the network untouched.
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
}
