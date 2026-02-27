# Microfrontend POC

An Angular **micro-frontend proof-of-concept** built with [Native Federation](https://www.npmjs.com/package/@angular-architects/native-federation) and Angular 21.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Shell  :4200                       │
│                                                     │
│  ┌─────────────────┐   ┌─────────────────────────┐  │
│  │  Navigation /   │   │     <router-outlet>     │  │
│  │  Header         │   │                         │  │
│  └─────────────────┘   │  /customers  → MFE ──┐  │  │
│                         │  /accounts   → MFE ──┼──┼──┤
└─────────────────────────┼─────────────────────┼──┘  │
                          │                     │     │
          ┌───────────────┘        ┌────────────┘     │
          ▼                        ▼                  │
┌──────────────────┐    ┌──────────────────┐          │
│  mfe-customers   │    │  mfe-accounts    │          │
│  :4201           │    │  :4202           │          │
│                  │    │                  │          │
│  /               │    │  /               │          │
│  /:id (detail)   │    │  /:id (detail)   │          │
└──────────────────┘    └──────────────────┘
```

### Key design decisions

| Concern | Solution |
|---|---|
| Module federation | `@angular-architects/native-federation` — ES import maps, no Webpack |
| Shared singletons | `shareAll({ singleton: true })` in each `federation.config.js` |
| HTTP client | Provided **once** in the shell; automatically shared with all MFEs |
| Auth | `authInterceptor` in the shell attaches `Authorization: Bearer <token>` to every request |
| API base URL | `API_BASE_URL` injection token provided in the shell as `https://api-gateway.example.com/v1` |
| Change detection | `OnPush` everywhere |
| State | Angular `resource()` + signals |
| Routing | `withComponentInputBinding()` — route params map directly to `input()` signals |

### Project layout

```
mfe-poc/
├── angular.json                      # Monorepo config (3 projects)
├── package.json
│
└── projects/
    ├── shell/                        # Host application (port 4200)
    │   ├── federation.config.js      # Native Federation host config
    │   └── src/app/
    │       ├── app.ts                # Root component (nav + router-outlet)
    │       ├── app.routes.ts         # loadRemoteModule → CUSTOMERS_ROUTES / ACCOUNTS_ROUTES
    │       ├── app.config.ts         # provideRouter, provideHttpClient + authInterceptor, API_BASE_URL
    │       └── core/
    │           ├── api.config.ts     # InjectionToken<string> API_BASE_URL
    │           └── auth.interceptor.ts  # HttpInterceptorFn — Bearer token from sessionStorage
    │
    ├── mfe-customers/                # Customers remote (port 4201)
    │   ├── federation.config.js      # exposes: { './Routes': customers.routes.ts }
    │   └── src/app/
    │       ├── customers.routes.ts   # CUSTOMERS_ROUTES (exposed to shell)
    │       ├── app.routes.ts         # Standalone wrapper (for ng serve mfe-customers)
    │       └── customers/
    │           ├── customer-list/    # List component — resource() + HttpClient
    │           └── customer-detail/ # Detail component — input(:id) → resource()
    │
    └── mfe-accounts/                 # Accounts remote (port 4202)
        ├── federation.config.js      # exposes: { './Routes': accounts.routes.ts }
        └── src/app/
            ├── accounts.routes.ts    # ACCOUNTS_ROUTES (exposed to shell)
            ├── app.routes.ts         # Standalone wrapper (for ng serve mfe-accounts)
            └── accounts/
                ├── account-list/    # List component — resource() + HttpClient
                └── account-detail/ # Detail component — input(:id) → resource()
```

### How federation works

```
shell/public/federation.manifest.json
  └── "mfe-customers" → http://localhost:4201/remoteEntry.json
  └── "mfe-accounts"  → http://localhost:4202/remoteEntry.json

shell/app.routes.ts
  └── loadRemoteModule('mfe-customers', './Routes') → CUSTOMERS_ROUTES
  └── loadRemoteModule('mfe-accounts',  './Routes') → ACCOUNTS_ROUTES
```

The shell has **zero knowledge** of internal MFE routes. Each remote exposes only its route array.

---

## Prerequisites

```bash
node >= 20
npm  >= 11
```

## How to run

### All three apps in parallel (recommended)

```bash
npm run start:all
```

Opens colour-coded output for all three processes. Then visit **http://localhost:4200**.

> The shell lazy-loads each remote on first navigation. Both remotes **must** be running for the shell to work.

### Individually

```bash
npm run start:shell          # http://localhost:4200  (requires remotes running)
npm run start:mfe-customers  # http://localhost:4201  (standalone)
npm run start:mfe-accounts   # http://localhost:4202  (standalone)
```

---

## How to build

```bash
# Full production build (remotes first, then shell — order matters)
npm run build:all

# Individual builds
npm run build:mfe-customers
npm run build:mfe-accounts
npm run build:shell
```

Output lands in `dist/<project>/browser/`.

---

## Running tests

The test suite uses [Vitest](https://vitest.dev/) via `@angular/build:unit-test` with `HttpTestingController` for HTTP interception. **No running servers are required.**

### Commands

| Command | What it does |
|---|---|
| `npm run test:shell` | Runs shell tests only (watch-free) |
| `npm run test:customers` | Runs mfe-customers tests only |
| `npm run test:accounts` | Runs mfe-accounts tests only |
| `npm run test:all` | Runs all three suites sequentially |
| `npm run test:all:log` | Runs all three suites with coverage and writes `test-result.log` |

### Quick run

```bash
# Run all tests once (no watch mode)
npm run test:all

# Run all tests + coverage, save results to test-result.log
npm run test:all:log
```

### What is tested

| Project | Spec files | Tests | What's covered |
|---|---|---|---|
| `shell` | 2 | 8 | App component (nav, router-outlet), `authInterceptor` (token injection, passthrough) |
| `mfe-customers` | 3 | 17 | App root, `CustomerListComponent` (loading, rows, badges, links, error), `CustomerDetailComponent` (fields, badge, 404, input change) |
| `mfe-accounts` | 3 | 19 | App root, `AccountListComponent` (balance format, badge types, error), `AccountDetailComponent` (fields, balance, 404, input change) |
| **Total** | **8** | **44** | |

### Test stack

- **Runner**: Vitest 4 (managed by `@angular/build:unit-test`, jsdom environment)
- **HTTP mocking**: `HttpTestingController` — no network calls, no running servers needed
- **Mock data**: shared fixture in `mocks/db.ts` (`customersDb`, `accountsDb`)
- **Globals**: `describe`/`it`/`expect`/`beforeAll` etc. are available globally via `"types": ["vitest/globals"]` in `tsconfig.spec.json`

> **Note:** `msw/node` (Service Worker mocking) is intentionally **not** used in unit tests — importing it causes the `@angular/build:unit-test` Vitest runner to hang. MSW is wired for browser-only use (`mocks/handlers/`) and is available for future integration/e2e tests.

---

### Coverage report (`npm run test:all:log`)

Running `npm run test:all:log` executes `scripts/test-all-log.sh`, which:

1. Runs each project with `--coverage` (using [`@vitest/coverage-v8`](https://vitest.dev/guide/coverage))
2. Prints live feedback in the terminal as each suite completes
3. Prints a consolidated coverage summary table at the end
4. Writes a full human-readable report to **`test-result.log`** in the project root

#### Terminal output (example)

```
  ██████████████████████████████████████████████
  ██  MFE-POC  ·  Unit Tests + Coverage        ██
  ██████████████████████████████████████████████

  ▶  Testing  shell ...
  ✔  shell → 8 tests in 2 file(s) · 5.70s
     Stmts: 100%  Branch: 100%  Funcs: 100%  Lines: 100%

  ▶  Testing  mfe-customers ...
  ✔  mfe-customers → 17 tests in 3 file(s) · 8.18s
     Stmts: 100%  Branch: 92.5%  Funcs: 100%  Lines: 100%

  ▶  Testing  mfe-accounts ...
  ✔  mfe-accounts → 19 tests in 3 file(s) · 7.10s
     Stmts: 100%  Branch: 92.5%  Funcs: 100%  Lines: 100%

  ────────────────────────────────────────────────────────
  Coverage Summary

  Project            |  Stmts | Branch |  Funcs |  Lines
  ───────────────────────────────────────────────────────
  shell              |    100 |    100 |    100 |    100 | 8 tests · 5.70s
  mfe-customers      |    100 |   92.5 |    100 |    100 | 17 tests · 8.18s
  mfe-accounts       |    100 |   92.5 |    100 |    100 | 19 tests · 7.10s

  ────────────────────────────────────────────────────────
  ✔  ALL TESTS PASSED  ·  44 tests across 8 spec file(s)
  Log: .../test-result.log
  ────────────────────────────────────────────────────────
```

#### `test-result.log` structure

The log file is overwritten on every run and contains three sections per project:

```
════════════════════════════════════════════════════════════
  MFE-POC · Unit Test & Coverage Report
  Generated: 2026-02-26 09:00:00
════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────┐
│  Project : shell                                         │
│  Status  : PASSED ✔                                     │
│  Files   : 2 passed                                      │
│  Tests   : 8 passed                                      │
│  Duration: 5.70s                                         │
└─────────────────────────────────────────────────────────┘

  ── Coverage ───────────────────────────────────────────
  (v8 coverage table — Stmts / Branch / Funcs / Lines per file)

  ── Full Output ────────────────────────────────────────
  (raw Vitest output for debugging — build times, test names, etc.)

────────────────────────────────────────────────────────────
... (repeated for mfe-customers and mfe-accounts) ...

════════════════════════════════════════════════════════════
  SUMMARY
════════════════════════════════════════════════════════════
  Result    : ALL PASSED ✔
  Total     : 44 tests  |  8 spec files
  Completed : 2026-02-26 09:00:35
════════════════════════════════════════════════════════════
```

> `test-result.log` is listed in `.gitignore` — it is a local artefact and is not committed.

---

## API mocking with MSW

[Mock Service Worker (MSW)](https://mswjs.io/) is used to intercept HTTP requests in the browser during local development, so the apps can run fully without a real backend.

### How it works

MSW uses a **Service Worker** registered in each app's `public/` folder to intercept `fetch` requests at the network level. The worker is started automatically at bootstrap **only on `localhost`** — it is a no-op in production builds.

```
Bootstrap (localhost only)
  └── bootstrap.ts
        └── import './mocks/browser'
              └── setupWorker(...handlers)   ← MSW Service Worker
                    └── worker.start()       ← registered in <project>/public/mockServiceWorker.js
```

### File layout

```
mfe-poc/
├── mocks/                              # Workspace-level shared mock data & handlers
│   ├── db.ts                           # In-memory fixture data (customersDb, accountsDb)
│   ├── server.ts                       # MSW Node server (for future integration/e2e tests only)
│   └── handlers/
│       ├── customers.ts                # GET /customers, GET /customers/:id
│       └── accounts.ts                 # GET /accounts, GET /accounts/:id
│
└── projects/
    ├── shell/src/mocks/browser.ts      # setupWorker(customerHandlers, accountHandlers)
    ├── mfe-customers/src/mocks/browser.ts  # setupWorker(customerHandlers)
    └── mfe-accounts/src/mocks/browser.ts   # setupWorker(accountHandlers)
```

The shell aggregates **both** handler sets so a single worker intercepts every API call regardless of which MFE originated it. Each standalone MFE registers only its own handlers for independent `ng serve`.

### Mock data (`mocks/db.ts`)

| Collection | Records | Fields |
|---|---|---|
| `customersDb` | 5 customers | `id`, `name`, `email`, `status` (`active`\|`inactive`) |
| `accountsDb` | 6 accounts | `id`, `accountNumber`, `type` (`checking`\|`savings`\|`credit`), `balance`, `currency`, `ownerId` |

Types are defined inline in `db.ts` (not imported from MFE source) to avoid cross-project TypeScript compilation boundaries.

### Handlers (`mocks/handlers/`)

All handlers simulate realistic network latency via MSW's `delay()` helper.

| Method | URL | Response | Delay |
|---|---|---|---|
| `GET` | `/v1/customers` | Array of all customers | 400 ms |
| `GET` | `/v1/customers/:id` | Single customer or `404` | 300 ms |
| `GET` | `/v1/accounts` | Array of all accounts | 400 ms |
| `GET` | `/v1/accounts/:id` | Single account or `404` | 300 ms |

The base URL matches the `API_BASE_URL` token value: `https://api-gateway.example.com/v1`.

### Activating the mocks

MSW is **active by default on `localhost`** — no flags or environment variables needed. The check in `bootstrap.ts` is:

```typescript
if (typeof window !== 'undefined' && location.hostname === 'localhost') {
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}
```

`onUnhandledRequest: 'bypass'` means any request that does not match a handler (e.g. federation `remoteEntry.json` fetches) passes through to the network unchanged.

To **disable** the mocks while keeping `ng serve` running, open DevTools and unregister the Service Worker under **Application → Service Workers**.

### Adding a new handler

1. Add your fixture records to `mocks/db.ts`.
2. Add a handler to the relevant file in `mocks/handlers/` (or create a new one).
3. Register the handler in the appropriate `browser.ts` files.

```typescript
// mocks/handlers/customers.ts
http.get(`${BASE}/customers/:id/orders`, async ({ params }) => {
  await delay(200);
  return HttpResponse.json(ordersDb.filter(o => o.customerId === params['id']));
}),
```

### MSW and unit tests

MSW's **`msw/node`** (`mocks/server.ts`) is **not used in unit tests**. Importing it causes the `@angular/build:unit-test` Vitest runner to hang indefinitely due to Node HTTP patching conflicts. Unit tests use Angular's `HttpTestingController` instead.

`mocks/server.ts` is kept for use in future **integration or e2e** test suites that run outside the Angular test builder (e.g. Playwright, or a plain Vitest config targeting Node).

1. Replace `useValue: 'https://api-gateway.example.com/v1'` in `projects/shell/src/app/app.config.ts` with your real gateway URL (or read it from an environment variable).
2. Replace the `sessionStorage.getItem('access_token')` stub in `projects/shell/src/app/core/auth.interceptor.ts` with your real token source (MSAL, Keycloak, etc.).

Both changes are picked up automatically by all MFEs via the shared Angular DI tree.
