# Customer Service Request Portal

A web portal for viewing, creating, and managing customer service requests. It
is a React single-page application that authenticates through OpenID Connect
and follows the API contract in
[`openapi/frontend-challenge-api.openapi.yaml`](openapi/frontend-challenge-api.openapi.yaml).

The repository also includes a complete mock API for local development and a
Keycloak login theme built with Keycloakify.

## Solution overview

- Sign-in and sign-out through OIDC using Authorization Code + PKCE.
- Paginated request list with search, filtering, and sorting.
- Request creation and status updates.
- Clear loading, empty, validation, and API error states.
- Responsive layout and keyboard-friendly navigation.
- Local mock environment that does not require a backend.

Filters and pagination live in the URL, so a search can be bookmarked, shared,
or restored after navigating away. API types are generated from the OpenAPI
document to keep the frontend aligned with the contract.

## Technology and library choices

- **React 19 and TypeScript:** the application foundation, with strict static
  checks.
- **Vite:** development server and production build.
- **Material UI:** accessible components and the application's light theme.
- **React Router:** routing and URL-based filter state.
- **TanStack Query:** caching, pagination, retries, and invalidation.
- **React Hook Form and Zod:** forms and runtime validation.
- **oidc-client-ts and react-oidc-context:** provider-independent OIDC support.
- **MSW:** the same mock API in the browser and in tests.
- **Vitest, Testing Library, and jest-axe:** behaviour and accessibility tests.
- **Keycloakify:** the custom Keycloak login theme.

## Architecture summary

Most of the application lives under `src`. Code is grouped by responsibility:
shared API and authentication logic is kept separate from the request screens,
reusable components, styles, mocks, and test helpers. The OpenAPI contract has
its own top-level directory, and the Keycloak theme is an independent package
under `keycloak-theme`.

Components do not call `fetch` directly. They use the query hooks from the API
layer, while authentication is exposed through a provider-independent context.
This keeps the UI independent from the transport and makes it possible to swap
the mock login for Keycloak without changing the screens.

## Local setup

Requirements: Node.js **22.22.2 or newer** and npm.

```bash
git clone <repository-url>
cd service-request-portal
npm ci
npm run dev
```

The application is available at <http://localhost:5173>. With no additional
configuration, it uses mock authentication and the in-browser mock API.

Install the separate theme package when working on the Keycloak UI:

```bash
npm ci --prefix keycloak-theme
npm run theme:dev
```

## OIDC provider configuration

Register the frontend as a public SPA client. Do not use a client secret:
anything stored in a `VITE_` variable is visible in the browser bundle.

The provider should allow:

- the `authorization_code` flow with PKCE `S256`;
- redirect URI `http://localhost:5173/auth/callback`;
- post-logout redirect URI `http://localhost:5173`;
- web origin `http://localhost:5173`;
- at least the `openid profile email` scopes.

For Keycloak, create an OpenID Connect client, turn **Client authentication**
off, enable **Standard flow**, and add the addresses above. The authority must
point to the realm, for example:

```dotenv
VITE_AUTH_MODE=oidc
VITE_OIDC_AUTHORITY=http://localhost:8080/realms/<realm>
VITE_OIDC_CLIENT_ID=service-request-portal
VITE_ENABLE_API_MOCKS=false
```

The custom login theme lives in [`keycloak-theme/`](keycloak-theme). Build the
JARs that must be copied to the Keycloak container's `providers` directory with:

```bash
npm run theme:build
```

See the [theme README](keycloak-theme/README.md) for installation and activation
details.

## Environment variables

Copy [`.env.example`](.env.example) to `.env.local` and change only what your
environment requires.

The API is configured with `VITE_API_BASE_URL` and
`VITE_ENABLE_API_MOCKS`. Authentication uses `VITE_AUTH_MODE`,
`VITE_OIDC_AUTHORITY`, `VITE_OIDC_CLIENT_ID`, `VITE_OIDC_REDIRECT_URI`,
`VITE_OIDC_POST_LOGOUT_REDIRECT_URI`, and `VITE_OIDC_SCOPE`. Providers such as
Auth0 may also need `VITE_OIDC_AUDIENCE`.

`VITE_ALLOW_MOCK_AUTH_IN_PRODUCTION` exists only for a deliberately published
demo. It should remain disabled in a real environment.

The example file contains no real credentials. Local `.env` files are ignored
by Git and must not be committed.

## API mocking approach

MSW intercepts HTTP calls and responds with data held in memory. The browser and
the test suite use the same handlers, so the real HTTP client, cache, and error
handling remain part of every request.

The mock supports search, filters, pagination, creation, status transitions,
version-based concurrency, and `application/problem+json` responses. Its data
resets when the page is reloaded.

Set `VITE_ENABLE_API_MOCKS=false` to use a real API.

## Development, lint, test, and build commands

For everyday development, these are the main commands:

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
```

`npm run test:watch` keeps the test runner open, while `npm run preview` serves
the production build locally. If the OpenAPI document changes, run
`npm run generate:api` to regenerate the TypeScript definitions.

The theme has its own `theme:lint`, `theme:typecheck`, `theme:storybook`, and
`theme:build` commands. The last one produces the JARs that can be installed in
Keycloak.

## Testing strategy

Tests focus on behaviour visible to users: navigation, forms, filters,
authentication, error states, and complete flows against MSW. Testing Library
queries use roles, labels, and text instead of CSS classes or component
internals.

Focused tests also cover the HTTP client, mock business rules, cache isolation
between sessions, OIDC configuration, route protection, the error boundary, and
common accessibility violations through `jest-axe`.

The full redirect and token exchange against a live Keycloak instance is not
automated. That flow still requires integration testing in the environment
where the identity provider is available.

## GitHub Actions workflow

The [CI workflow](.github/workflows/ci.yml) runs on pushes and pull requests to
`main` and can also be started manually.

It checks Node `22.22.2` and `24.x`, installs both packages with `npm ci`, verifies
that generated API types match the OpenAPI document, and runs lint, typecheck,
tests with coverage, and a production build. The Node 24 job also installs Java
21, builds the Keycloakify JARs, and uploads the portal and theme artifacts.

The workflow has read-only repository access and cancels an older run when a
new commit is pushed to the same branch.

## Security and accessibility considerations

The portal uses PKCE and stores its OIDC session in `sessionStorage`. There is no
client secret in the frontend. API cache data is discarded when the user signs
out or changes, and a `401` clears the local session. Mock authentication is
blocked in production unless the demo-only override is explicitly enabled.

Forms have labels and associated error messages, alerts use live regions, and
status is never communicated through colour alone. The interface supports
keyboard navigation, visible focus, semantic landmarks, and
`prefers-reduced-motion`.

These measures do not replace backend authorization, a security review, or
manual testing with assistive technologies.

## Known limitations

- The repository does not include a real API; mock data resets on reload.
- There is no end-to-end test of the redirect and token exchange with Keycloak.
- Status-note history cannot be displayed because the API has no history
  endpoint.
- Status changes wait for the server because they use version-based concurrency.
- Filtering and sorting depend on the server.
- The portal interface is available only in English.
- CI produces artifacts but does not deploy them.
