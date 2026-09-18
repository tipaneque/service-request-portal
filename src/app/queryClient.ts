import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/ApiError'

/**
 * Shared query-client factory.
 *
 * Retry policy is deliberate: transient failures (network, 5xx) are retried,
 * while 4xx responses are final and retrying them only delays the error the
 * user needs to see. Tests create their own client with retries disabled.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && !error.isRetryable) return false
          return failureCount < 2
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
      mutations: {
        // A write is never retried automatically: a repeated POST could create
        // a duplicate request, and a repeated PATCH would race the version check.
        retry: false,
      },
    },
  })
}
