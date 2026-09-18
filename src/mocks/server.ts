import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/** Node-side MSW instance used by Vitest (wired up in `vitest.setup.ts`). */
export const server = setupServer(...handlers)
