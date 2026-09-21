/**
 * Typed, validated access to the Vite environment.
 *
 * Configuration is read once at module load and validated with zod so that a
 * missing or malformed variable fails loudly at startup instead of producing a
 * confusing runtime error deep inside the OIDC or API layer.
 */
import { z } from 'zod'

const booleanFromString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true')

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().min(1).default('/api'),
  VITE_ENABLE_API_MOCKS: booleanFromString.default('true'),

  VITE_AUTH_MODE: z.enum(['oidc', 'mock']).default('mock'),
  VITE_ALLOW_MOCK_AUTH_IN_PRODUCTION: booleanFromString.default('false'),
  VITE_OIDC_AUTHORITY: z.string().default(''),
  VITE_OIDC_CLIENT_ID: z.string().default(''),
  VITE_OIDC_REDIRECT_URI: z.string().default(''),
  VITE_OIDC_POST_LOGOUT_REDIRECT_URI: z.string().default(''),
  VITE_OIDC_SCOPE: z.string().default('openid profile email'),
  VITE_OIDC_AUDIENCE: z.string().default(''),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n')
  throw new Error(`Invalid environment configuration:\n${issues}\n\nSee .env.example.`)
}

const raw = parsed.data

if (raw.VITE_AUTH_MODE === 'oidc' && (!raw.VITE_OIDC_AUTHORITY || !raw.VITE_OIDC_CLIENT_ID)) {
  throw new Error(
    'VITE_AUTH_MODE=oidc requires VITE_OIDC_AUTHORITY and VITE_OIDC_CLIENT_ID. See .env.example.',
  )
}

export const env = {
  apiBaseUrl: raw.VITE_API_BASE_URL.replace(/\/$/, ''),
  enableApiMocks: raw.VITE_ENABLE_API_MOCKS,
  auth: {
    mode: raw.VITE_AUTH_MODE,
    authority: raw.VITE_OIDC_AUTHORITY,
    clientId: raw.VITE_OIDC_CLIENT_ID,
    redirectUri: raw.VITE_OIDC_REDIRECT_URI || `${window.location.origin}/auth/callback`,
    postLogoutRedirectUri: raw.VITE_OIDC_POST_LOGOUT_REDIRECT_URI || window.location.origin,
    scope: raw.VITE_OIDC_SCOPE,
    audience: raw.VITE_OIDC_AUDIENCE,
    mockAllowedInProduction: raw.VITE_ALLOW_MOCK_AUTH_IN_PRODUCTION,
  },
  hasUnsafeProductionAuth:
    import.meta.env.PROD &&
    raw.VITE_AUTH_MODE === 'mock' &&
    !raw.VITE_ALLOW_MOCK_AUTH_IN_PRODUCTION,
} as const
