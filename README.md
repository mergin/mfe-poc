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

```bash
npm test
```

Uses [Vitest](https://vitest.dev/) via `@angular/build:unit-test`.

---

## Connecting a real API

1. Replace `useValue: 'https://api-gateway.example.com/v1'` in `projects/shell/src/app/app.config.ts` with your real gateway URL (or read it from an environment variable).
2. Replace the `sessionStorage.getItem('access_token')` stub in `projects/shell/src/app/core/auth.interceptor.ts` with your real token source (MSAL, Keycloak, etc.).

Both changes are picked up automatically by all MFEs via the shared Angular DI tree.
