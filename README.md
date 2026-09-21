# Customer Service Request Portal

A responsive single-page application for managing customer service requests, built with **React 19** and **TypeScript**. It consumes the Service Request API described in [`openapi/service-requests.openapi.yaml`](openapi/service-requests.openapi.yaml) and authenticates users against an external **OpenID Connect** provider.

---

## Table of contents

- [Solution overview](#solution-overview)
- [Technology and library choices](#technology-and-library-choices)
- [Architecture summary](#architecture-summary)
- [Local setup](#local-setup)
- [OIDC provider configuration](#oidc-provider-configuration)
- [Environment variables](#environment-variables)
- [API mocking](#api-mocking)
- [Commands](#commands)
- [Testing strategy](#testing-strategy)
- [GitHub Actions workflow](#github-actions-workflow)
- [Security considerations](#security-considerations)
- [Accessibility considerations](#accessibility-considerations)
- [Known limitations](#known-limitations)

---

## Solution overview

The portal lets an authenticated support agent work through the queue of customer service requests.

| Requirement                                           | Where it lives                                                                                      |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Sign in and sign out through an OIDC provider         | [`src/auth/`](src/auth)                                                                             |
| Paginated list of service requests                    | [`RequestListPage.tsx`](src/features/requests/RequestListPage.tsx)                                  |
| Search by title or requester                          | [`RequestFilters.tsx`](src/features/requests/RequestFilters.tsx) (debounced)                        |
| Filter by status and priority                         | [`RequestFilters.tsx`](src/features/requests/RequestFilters.tsx)                                    |
| Sort by creation date                                 | [`RequestFilters.tsx`](src/features/requests/RequestFilters.tsx) (also by update date and priority) |
| View the details of a request                         | [`RequestDetailPage.tsx`](src/features/requests/RequestDetailPage.tsx)                              |
| Create a new request                                  | [`NewRequestPage.tsx`](src/features/requests/NewRequestPage.tsx)                                    |
| Update the status of a request                        | [`StatusUpdatePanel.tsx`](src/features/requests/StatusUpdatePanel.tsx)                              |
| Loading, empty, validation, auth and API error states | See [State handling](#state-handling)                                                               |
| Responsive on desktop and mobile                      | [`src/styles/index.css`](src/styles/index.css)                                                      |

A few decisions worth highlighting:

- **The query string is the state.** Search, filters, sort, page and page size live in the URL, so a filtered view is shareable and bookmarkable, survives a reload, and works with the browser's back button.
- **The contract drives the types.** `src/api/schema.ts` is generated from the OpenAPI document; nothing is hand-typed from the spec, and CI fails if the two drift apart.
- **The status state machine is respected.** Only the transitions the contract permits are offered, and the `version` last read is echoed back so concurrent edits are caught as `409` rather than silently overwriting someone's work.
- **The app runs with no backend.** Mock Service Worker serves a stateful implementation of the whole contract, so the UI can be run and reviewed immediately.
- **Caches are session-scoped.** Signing out or changing OIDC subject synchronously replaces the query client, so cached customer data cannot cross an authentication boundary.

### State handling

Every screen distinguishes the states the brief calls for:

| State              | Treatment                                                                                                                                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Loading**        | Shimmer skeletons for the first load; the previous page stays on screen (dimmed) while the next one is fetched, so the table never flashes empty on a keystroke.                                                           |
| **Empty**          | Distinguishes "no requests exist yet" (offers to create one) from "no requests match these filters" (offers to clear them).                                                                                                |
| **Validation**     | Client-side checks mirror the OpenAPI constraints; a server `422` maps each field message back onto the matching input. Messages are linked to inputs with `aria-describedby`.                                             |
| **Authentication** | An unauthenticated visitor is redirected to `/sign-in` and returned to the page they asked for. A `401` from the API clears the session and drops the token.                                                               |
| **API errors**     | `application/problem+json` bodies are rendered with the server's own title, detail, per-field messages and `traceId`, plus a retry control. Network failures and `5xx` are retried automatically; `4xx` responses are not. |
| **Crash**          | An error boundary catches render-time bugs instead of leaving a blank page.                                                                                                                                                |

---

## Technology and library choices

| Area         | Choice                                              | Why                                                                                                                                                                                                              |
| ------------ | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework    | **React 19**                                        | Required by the brief.                                                                                                                                                                                           |
| Language     | **TypeScript** (strict, `noUncheckedIndexedAccess`) | Required by the brief; strict settings catch contract mismatches at build time.                                                                                                                                  |
| Build tool   | **Vite 8**                                          | Fast dev server, first-class TypeScript, and the same tool powers the test run.                                                                                                                                  |
| Routing      | **React Router 7**                                  | The de-facto standard for client-side routing; its `useSearchParams` is what makes URL-driven filter state natural.                                                                                              |
| Server state | **TanStack Query 5**                                | Caching, deduplication, retries and request cancellation for free. Pagination stays smooth via `keepPreviousData`, and the cache is the single source of truth for the `version` used in optimistic concurrency. |
| Client state | React state + the URL                               | There is no cross-screen client state worth a store. Adding Redux/Zustand here would be ceremony without a payoff; filters belong in the URL and everything else is server state.                                |
| Forms        | **React Hook Form**                                 | Uncontrolled inputs mean typing does not re-render the form, and it has first-class support for setting server-returned field errors.                                                                            |
| Validation   | **Zod** + `@hookform/resolvers`                     | One schema gives both runtime validation and the inferred TypeScript type, and it is reused to validate environment configuration at startup.                                                                    |
| API types    | **openapi-typescript**                              | Types are generated from the OAS3 document rather than transcribed, so the client cannot drift from the contract unnoticed.                                                                                      |
| API access   | `fetch` in a small typed wrapper                    | The only cross-cutting needs are the bearer token, problem-document parsing and cancellation - roughly 100 lines. A client library would be more surface area than substance here.                               |
| OIDC         | **oidc-client-ts** + **react-oidc-context**         | Certified, provider-agnostic implementation of Authorization Code + PKCE with silent renew. Works with Keycloak, Auth0, Entra ID or any compliant provider.                                                      |
| Styling      | Material UI + CSS custom properties                 | MUI provides accessible components and a single light theme; CSS is limited to layout primitives and shared tokens.                                                                                              |
| API mocking  | **MSW 2**                                           | Intercepts at the network layer, so the application code under test is the real thing - the same handlers serve the browser during development and Node during tests.                                            |
| Testing      | **Vitest** + **Testing Library**                    | Shares Vite's transform pipeline, so there is no second build config. Testing Library pushes tests towards user-visible behaviour and accessible queries.                                                        |
| CI           | **GitHub Actions**                                  | Required by the brief.                                                                                                                                                                                           |

---

## Architecture summary

```
src/
├── api/            Contract layer: generated types, fetch wrapper, endpoints, query hooks
│   ├── schema.ts       generated from the OpenAPI document - never edited by hand
│   ├── types.ts        domain type aliases over the generated contract
│   ├── ApiError.ts     normalised error carrying the RFC 7807 problem document
│   ├── http.ts         fetch wrapper: bearer token, problem parsing, cancellation
│   ├── serviceRequests.ts  one function per operationId
│   └── queries.ts      TanStack Query keys, hooks and cache invalidation
├── app/            Composition: query client configuration and the route table
├── auth/           Provider-agnostic auth context, OIDC adapter, mock provider, route guard
├── components/     Presentational building blocks (alerts, badges, fields, pagination…)
├── config/         Environment parsing and validation
├── domain/         Runtime vocabulary, labels and service-request workflow rules
├── features/
│   └── requests/   The service-request feature: list, detail, create, filters, status panel
├── lib/            Small utilities (date formatting, debounced callback)
├── mocks/          MSW handlers and the in-memory store behind them
├── pages/          Sign-in, OIDC callback, 404
├── styles/         Design tokens and component styles
└── test/           Test helpers (provider-aware render)
```

**Layering.** Components never talk to `fetch` and never import the OIDC library: they use hooks from `api/queries.ts` and the `AuthContext`. That keeps two decisions swappable - the HTTP client and the identity library - and it is what lets the test suite run the real component tree against a mock transport.

**Dependency direction.** `features` → `domain`/`api`, `domain` → `api`, and `features` → `auth` → `api`. Nothing in `api/` imports from a feature or from the domain layer.

**Authentication seam.** `AuthContext` exposes `{ isAuthenticated, isLoading, error, user, signIn, signOut }`. Two implementations satisfy it: `OidcAuthAdapter` (real provider) and `MockAuthProvider` (local development and tests). The requested internal route is carried through the OIDC state and restored after the callback.

**Session isolation.** The query-client boundary is keyed by the authenticated OIDC subject. Logout and account changes create an empty cache synchronously, before a protected route can render for the next user.

**Token plumbing.** The access token is published to a module-level store _during render_, not from an effect. Effects run child-first, so registering the token in an effect would let a screen fire its first request before the token was available - and get a `401`. `apiFetch` reads the store at request time, which also means a silently renewed token is picked up without a re-render.

---

## Local setup

**Prerequisites:** Node.js **20.19+** (or 22+) and npm.

```bash
git clone <repository-url>
cd service-request-portal
npm install
npm run dev
```

Open <http://localhost:5173>. No `.env` file and no backend are required for this: the defaults run the app with the in-browser mock API and a local demo sign-in.

To point the app at a real API and a real identity provider:

```bash
cp .env.example .env.local
# edit .env.local: set VITE_AUTH_MODE=oidc, the OIDC values, and VITE_ENABLE_API_MOCKS=false
npm run dev
```

---

## OIDC provider configuration

The client uses **Authorization Code flow with PKCE** as a **public client** - no client secret is involved, and none must ever be placed in the frontend configuration.

Register the application with your provider using:

| Setting                    | Value                                                               |
| -------------------------- | ------------------------------------------------------------------- |
| Client type                | Public / SPA (PKCE required, no secret)                             |
| Redirect URI               | `http://localhost:5173/auth/callback` (and the deployed equivalent) |
| Post-logout redirect URI   | `http://localhost:5173` (and the deployed equivalent)               |
| Allowed web origins / CORS | `http://localhost:5173` (and the deployed equivalent)               |
| Grant type                 | `authorization_code`                                                |
| Scopes                     | `openid profile email` plus whatever scope your API requires        |

### Keycloak

1. In your realm, go to **Clients → Create client**, set _Client type_ to `OpenID Connect` and the _Client ID_ to `service-request-portal`.
2. On **Capability config**: _Client authentication_ **off** (public client), _Standard flow_ **on**, _Direct access grants_ **off**.
3. On **Login settings**, set the redirect URI to `http://localhost:5173/auth/callback`, the post-logout redirect URI to `http://localhost:5173`, and Web origins to `http://localhost:5173`.
4. PKCE: on the client's **Advanced** tab set _Proof Key for Code Exchange Code Challenge Method_ to `S256`.

```dotenv
VITE_AUTH_MODE=oidc
VITE_OIDC_AUTHORITY=https://keycloak.example.com/realms/service-desk
VITE_OIDC_CLIENT_ID=service-request-portal
VITE_OIDC_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_OIDC_POST_LOGOUT_REDIRECT_URI=http://localhost:5173
VITE_OIDC_SCOPE=openid profile email
```

#### Tema de login Keycloakify

O tema do login vive num pacote independente em [`keycloak-theme/`](keycloak-theme). Ele usa o nome `customer-requests` e espelha os tokens visuais de `src/styles/index.css` em `keycloak-theme/src/login/theme.css`.

```bash
npm install --prefix keycloak-theme
npm run theme:dev        # pré-visualização rápida
npm run theme:storybook  # estados da interface
npm run theme:build      # JARs em keycloak-theme/dist_keycloak/
```

Para activar o resultado, copie o JAR compatível para a pasta `providers` do Keycloak, reinicie-o e escolha `customer-requests` em **Realm settings → Themes → Login theme**. Instruções detalhadas estão em [`keycloak-theme/README.md`](keycloak-theme/README.md).

### Auth0

Create a **Single Page Application**, then add the callback URL, logout URL and allowed web origin as above. Auth0 issues an opaque access token unless an audience is requested, so set `VITE_OIDC_AUDIENCE` to your API identifier to receive a JWT the API can validate:

```dotenv
VITE_AUTH_MODE=oidc
VITE_OIDC_AUTHORITY=https://your-tenant.eu.auth0.com
VITE_OIDC_CLIENT_ID=<client id>
VITE_OIDC_AUDIENCE=https://api.example.com/service-requests
VITE_OIDC_SCOPE=openid profile email service-requests.read service-requests.write
```

Any other standards-compliant provider works the same way: the client only needs the issuer URL, from which it discovers the endpoints via `/.well-known/openid-configuration`.

---

## Environment variables

All variables are documented in [`.env.example`](.env.example) and validated at startup by [`src/config/env.ts`](src/config/env.ts) - a missing or malformed value fails immediately with a clear message instead of surfacing later as a confusing runtime error.

| Variable                             | Default                  | Purpose                                                                                                   |
| ------------------------------------ | ------------------------ | --------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`                  | `/api`                   | Base URL of the Service Request API, without a trailing slash.                                            |
| `VITE_ENABLE_API_MOCKS`              | `true`                   | Serve the API from Mock Service Worker in the browser.                                                    |
| `VITE_AUTH_MODE`                     | `mock`                   | `oidc` for a real provider, `mock` for the local demo session.                                            |
| `VITE_ALLOW_MOCK_AUTH_IN_PRODUCTION` | `false`                  | Explicit escape hatch for a published demo. Production otherwise displays a blocking configuration error. |
| `VITE_OIDC_AUTHORITY`                | –                        | Issuer URL. **Required** when `VITE_AUTH_MODE=oidc`.                                                      |
| `VITE_OIDC_CLIENT_ID`                | –                        | Public client id. **Required** when `VITE_AUTH_MODE=oidc`.                                                |
| `VITE_OIDC_REDIRECT_URI`             | `<origin>/auth/callback` | Must match the provider registration exactly.                                                             |
| `VITE_OIDC_POST_LOGOUT_REDIRECT_URI` | `<origin>`               | Where the provider returns after sign-out.                                                                |
| `VITE_OIDC_SCOPE`                    | `openid profile email`   | Scopes requested at sign-in.                                                                              |
| `VITE_OIDC_AUDIENCE`                 | –                        | Optional; needed by providers such as Auth0 to issue a JWT access token.                                  |

> Everything prefixed with `VITE_` is embedded in the JavaScript bundle and is therefore public. No secret belongs in any of these values - which is exactly why the client uses PKCE rather than a client secret. `.env.example` contains no credentials, and `.env*.local` is git-ignored.

---

## API mocking

The OpenAPI document describes no server, so the repository ships a complete mock of it. [`src/mocks/`](src/mocks) contains:

- **`seed.ts`** – 42 deterministic service requests, spanning every status and priority, so filters and pagination have something meaningful to act on and results are reproducible.
- **`db.ts`** – an in-memory store implementing the behaviour the contract promises: search across title and requester name, status/priority filtering, all six sort expressions, pagination, version-based optimistic concurrency and the status state machine.
- **`handlers.ts`** – the four operations, strict request/query validation (including `additionalProperties: false` and every length bound), and real `application/problem+json` documents for `400`, `401`, `404`, `409`, `422` and `500`. Requests without a bearer token are rejected, so the token plumbing is genuinely exercised.
- **`browser.ts` / `server.ts`** – the same handlers wired to a Service Worker in the browser and to `setupServer` in Vitest.

Why MSW rather than a stubbed API module: the interception happens at the network boundary, so the code under test is the real `fetch` wrapper, the real error mapping and the real query hooks. The mock is a stand-in for the _server_, not for the application's own layers.

The worker starts before the first render (`src/main.tsx`), so no request escapes it. A registration failure produces an actionable startup screen instead of a blank page. Turn it off with `VITE_ENABLE_API_MOCKS=false` to talk to a real API. Mock data lives in memory and resets on reload.

---

## Commands

| Command                   | What it does                                                     |
| ------------------------- | ---------------------------------------------------------------- |
| `npm run dev`             | Start the dev server on <http://localhost:5173>.                 |
| `npm run build`           | Typecheck the project and produce an optimised build in `dist/`. |
| `npm run preview`         | Serve the production build locally.                              |
| `npm run lint`            | Run ESLint over the whole repository.                            |
| `npm run lint:fix`        | Apply the fixes ESLint can make automatically.                   |
| `npm run typecheck`       | Run the TypeScript compiler with no emit.                        |
| `npm run test`            | Run the test suite once.                                         |
| `npm run test:watch`      | Run the tests in watch mode.                                     |
| `npm run test:coverage`   | Run the tests and produce a coverage report.                     |
| `npm run generate:api`    | Regenerate `src/api/schema.ts` from the OpenAPI document.        |
| `npm run msw:init`        | Reinstall the MSW service worker into `public/`.                 |
| `npm run theme:dev`       | Preview the Keycloak login theme with Vite.                      |
| `npm run theme:storybook` | Preview the theme's login states in Storybook.                   |
| `npm run theme:lint`      | Lint the independent Keycloak theme package.                     |
| `npm run theme:typecheck` | Typecheck the independent Keycloak theme package.                |
| `npm run theme:build`     | Build installable Keycloak theme JARs.                           |

---

## Testing strategy

**74 tests across 14 files.** The suite is written against user-visible behaviour: queries go through accessible roles, labels and text, never through CSS classes or component internals, so a refactor that preserves behaviour does not break the tests.

| File                                                      | What it protects                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/api/http.test.ts`                                    | The transport contract: the bearer token is attached (and omitted when signed out), empty query parameters are dropped, problem documents become `ApiError` with their detail/field errors/trace id, a `401` notifies the auth layer, and network failures and `5xx` are classified as retryable while `4xx` are not.                                               |
| `src/mocks/db.test.ts`                                    | The mock server's own logic - pagination defaults, case-insensitive search across both fields, combined filters, all sort directions, server-assigned fields on creation, version increments, stale-version conflicts and refused transitions.                                                                                                                      |
| `src/mocks/handlers.test.ts`                              | Strict OAS3 boundary validation: unknown query/body properties, maximum field lengths and the status-note type.                                                                                                                                                                                                                                                     |
| `src/features/requests/RequestListPage.test.tsx`          | Listing, totals and page indicators, status filtering, debounced search by title and by requester, paging, filters restored from the query string, sorting, the empty state and its escape hatch, a `500` rendered as a problem document with a working retry, and a `401` surfaced to the user.                                                                    |
| `src/features/requests/RequestDetailPage.test.tsx`        | Detail rendering, that only contract-allowed transitions are offered, a successful update and the resulting version bump, that the last-read `version` is echoed (and a `409` is explained), a refused `422` transition, the terminal `CLOSED` state, the not-found state, and retry after a failure.                                                               |
| `src/features/requests/NewRequestPage.test.tsx`           | Client-side validation per field, `aria-invalid`/`aria-describedby` wiring, that an invalid form never reaches the API, that the payload contains exactly the contract's fields (no client-assigned `id`/`status`/timestamps), server `422` messages mapped back onto inputs, a page-level alert for other failures, and an end-to-end create against the mock API. |
| `src/auth/RequireAuth.test.tsx`                           | The guard redirects unauthenticated visitors, admits them after sign-in, and the access token is published only while a session exists and does not survive a fresh tab.                                                                                                                                                                                            |
| `src/auth/OidcAuthAdapter.test.tsx`, `oidcConfig.test.ts` | OIDC identity/token mapping, provider logout, safe return-route state and rejection of external redirects.                                                                                                                                                                                                                                                          |
| `src/pages/SignInPage.test.tsx`                           | The originally requested route is passed into the authentication flow.                                                                                                                                                                                                                                                                                              |
| `src/pages/AuthCallbackPage.test.tsx`                     | Callback progress/error states and restoration of the route carried through OIDC.                                                                                                                                                                                                                                                                                   |
| `src/App.test.tsx`                                        | API cache data is destroyed across logout and the next login.                                                                                                                                                                                                                                                                                                       |
| `src/components/layout/AppLayout.test.tsx`                | The signed-in identity is shown, the skip link targets the main region, and sign-out clears both the session and the token.                                                                                                                                                                                                                                         |
| `src/lib/format.test.ts`                                  | Unit selection and rounding in relative dates, and that a malformed timestamp is passed through instead of rendering "Invalid Date".                                                                                                                                                                                                                                |

Most component tests use the real router, query client, auth boundary and component tree; only the network is replaced. Focused OIDC tests mock the external library at its adapter boundary. The remaining gap is the browser-to-provider redirect and token exchange, which requires a live identity provider.

Coverage is **85.64% of statements** and **87.33% of lines**, concentrated where mistakes are expensive: the OIDC adapter/configuration has full statement coverage, the API layer is above 91%, and the mock store is above 97%. The browser bootstrap and live provider handshake remain outside the component-test boundary.

---

## GitHub Actions workflow

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and pull request to `main`, and can be triggered by hand. A new push to the same branch cancels the run already in flight, and the token is restricted to `contents: read`.

The job runs on Node **20.x** and **22.x** in parallel (`fail-fast: false`, so one version's failure does not hide the other's result) and performs, in order:

1. **`npm ci`** – a reproducible install from `package-lock.json`, with the npm cache restored by `actions/setup-node`.
2. **Contract check** – regenerates `src/api/schema.ts` from the OpenAPI document and fails on any diff. This is the guard that keeps the committed types honest: if the spec changes and nobody regenerates, CI says so.
3. **Lint** – ESLint over the repository.
4. **Typecheck** – `tsc` with no emit.
5. **Test** – the full suite with coverage; the report is uploaded as an artifact even when tests fail.
6. **Build** – a production build with the secure OIDC branch enabled, uploaded as an artifact from the Node 22 job.

Deployment is intentionally not included: the target environment is unknown, and the build artifact plus the environment-variable contract above is what any host would need.

---

## Security considerations

- **Authorization Code flow with PKCE, public client.** No implicit flow, no client secret. A secret in a browser bundle is not a secret, which is why the client is registered as public and PKCE protects the code exchange.
- **Tokens in `sessionStorage`, scoped to the tab.** They are cleared when the tab closes and are never written to `localStorage` or to a script-readable cookie. This is a deliberate trade-off: it keeps the blast radius of an XSS smaller than `localStorage` would, while avoiding the complexity of a token-relaying backend. A deployment with stricter requirements should move to a BFF that keeps tokens server-side in an `HttpOnly` cookie.
- **The authorization code never lingers.** `onSigninCallback` strips `code` and `state` from the address bar once the exchange completes, so they do not end up in history or in a shared URL.
- **No cross-session API cache.** The query client is replaced on logout and OIDC subject changes, preventing cached customer data from being shown to a later user in the same tab.
- **Mock auth is blocked in production.** A build using mock authentication renders a blocking configuration error unless the demo-only escape hatch was explicitly enabled.
- **Sign-out ends the provider session too** (`signoutRedirect`), not just the local one - otherwise the next sign-in is silently re-authenticated and "sign out" is an illusion.
- **The client is not the security boundary.** The route guard is a usability measure; the API rejects unauthenticated calls regardless of what the browser renders. The mock API enforces this too, rejecting any request without a bearer token.
- **Expired sessions are handled, not ignored.** A `401` from any call clears the local session and the stored token, and the guard sends the user back to the provider.
- **No secrets in the repository.** `.env.example` documents the configuration with no credentials; `.env*.local` is git-ignored. Every `VITE_`-prefixed value is public by definition and is treated as such.
- **No `dangerouslySetInnerHTML` anywhere.** All server content is rendered as text, so React's escaping applies. Error text shown to the user comes from the problem document's `title`/`detail`, which the contract describes as safe to display.
- **Least-privilege CI.** The workflow requests only `contents: read`.

## Accessibility considerations

- **Semantic structure.** One `<h1>` per screen, landmarks (`header`/`main`/`footer`/`nav`/`search`), a real `<table>` with `<caption>` and `<th scope="col">`, and a skip link to the main content region.
- **Forms are properly wired.** Every control has a `<label>`; hints and error messages are linked with `aria-describedby`, and invalid fields carry `aria-invalid`. Validation fires on blur and then re-validates on change, so the form does not scold someone mid-word.
- **Status is never colour alone.** Status and priority badges pair colour with text and a shape marker, so they survive greyscale and colour-vision deficiency.
- **Live regions where they matter.** Result counts and loading announcements use `role="status"` (polite); errors use `role="alert"` (assertive). Focus is not stolen from the filters when results update.
- **Keyboard and focus.** Everything interactive is a real `<button>` or `<a>`, in a sensible tab order, with a visible two-tone focus ring that works on both themes.
- **Responsive without losing information.** Below 900px the table is replaced by cards rather than forced into horizontal scrolling; targets stay at least 40px tall.
- **Respects reduced-motion preferences.** `prefers-reduced-motion` disables shimmer, spin and non-essential transitions.
- **Timestamps are machine-readable.** Relative labels ("3 hours ago") sit inside `<time dateTime>` with the exact value in the title attribute.

---

## Known limitations

- **No real backend.** The OpenAPI document specifies no server, so the mock is the reference implementation. Data lives in memory and resets on reload. Pointing at a real API is a two-variable change.
- **The live OIDC redirect/token exchange is not exercised automatically.** The adapter, state restoration and callback configuration have unit coverage, but an end-to-end test against a containerised Keycloak would cover the external handshake itself.
- **Mock authentication is development-only.** Production blocks it by default. `VITE_ALLOW_MOCK_AUTH_IN_PRODUCTION=true` exists solely for an intentionally public demo and must not be used for a real portal.
- **MSW is bundled in the production build.** It is behind a dynamic import, so it is only downloaded when `VITE_ENABLE_API_MOCKS=true` - but the chunk is still emitted. A deployment that never mocks should strip it from the build.
- **No end-to-end browser tests.** The suite covers the component tree against a mock network; Playwright against a real provider and API would be the next layer.
- **The status note is write-only.** The contract accepts a `note` with a transition but exposes no history endpoint, so previous notes cannot be displayed.
- **No optimistic UI on writes.** Status changes wait for the server response. Given that the endpoint's whole point is version-checked concurrency, showing a change before the server has accepted it would be misleading.
- **Filtering and sorting are server-side only**, as the contract intends. There is no client-side re-sorting of the current page.
- **English only.** Dates and relative times follow the viewer's locale, but the interface copy is not translated.
