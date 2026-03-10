# Microfrontend POC

An Angular **micro-frontend proof-of-concept** built with [Native Federation](https://www.npmjs.com/package/@angular-architects/native-federation) and Angular 21.

## Table of contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [How to run](#how-to-run)
- [How to build](#how-to-build)
- [Server-side rendering (SSR)](#server-side-rendering-ssr)
- [Linting and formatting](#linting-and-formatting)
- [Styling](#styling)
- [Commit conventions](#commit-conventions)
- [Running tests](#running-tests)
- [CI overview](#ci-overview)
- [API mocking with MSW](#api-mocking-with-msw)
- [Internationalisation (i18n)](#internationalisation-i18n)
- [Adapting for production](#adapting-for-production)

---

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

| Concern            | Solution                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Module federation  | `@angular-architects/native-federation` — ES import maps, no Webpack                                                                             |
| Shared singletons  | `shareAll({ singleton: true })` in each `federation.config.js`                                                                                   |
| HTTP client        | Provided **once** in the shell; automatically shared with all MFEs                                                                               |
| Auth               | `authInterceptor` in the shell attaches `Authorization: Bearer <token>` to every request                                                         |
| API base URL       | `API_BASE_URL` injection token provided in the shell as `https://api-gateway.example.com/v1`                                                     |
| Translations       | `TranslateService` provided **once** in the shell; MFEs use `provideChildTranslateService`                                                       |
| Change detection   | `OnPush` everywhere                                                                                                                              |
| State              | Angular `resource()` + signals                                                                                                                   |
| Routing            | `withComponentInputBinding()` — route params map directly to `input()` signals                                                                   |
| Deferred injection | Services use `runInInjectionContext` with a captured `Injector` so early/zoneless instantiation can still access `API_BASE_URL` and `HttpClient` |
| Styling            | Shared SCSS utilities in `styles/` (spacing scale, media-query mixins, utility classes) imported by each project's `styles.scss`                 |

### Project layout

```
mfe-poc/
├── angular.json                       # Monorepo config (3 projects)
├── eslint.config.mjs                  # ESLint flat config (TS + Angular templates + Prettier)
├── commitlint.config.js               # Conventional-commit rules (extends @commitlint/config-angular)
├── vitest.config.ts                   # Vitest workspace config
├── playwright.config.ts               # Playwright E2E config (baseURL, webServer, reporters)
├── tsconfig.json                      # Root TypeScript config
├── package.json
├── e2e/                               # End-to-end test suites (Playwright)
│   ├── shell/
│   │   └── navigation.spec.ts
│   ├── customers/
│   │   └── list-detail.spec.ts
│   └── accounts/
│       └── list-detail.spec.ts
├── .editorconfig                      # Editor defaults (indent, charset, newline) for all contributors
├── .gitignore
├── .prettierrc                        # Prettier config
├── .github/
│   └── workflows/
│       └── ci.yml                     # Lint + unit + e2e in CI; uploads Playwright artifacts
├── .husky/
│   ├── pre-commit                     # Runs lint-staged on every commit
│   └── commit-msg                     # Runs commitlint on the commit message
├── scripts/
│   └── test-all-log.sh                # Runs unit + render + e2e and writes test-result.log
├── public/
│   └── mockServiceWorker.js           # Workspace-level MSW worker copy (source for npx msw init)
│
├── mocks/                             # Workspace-level shared mock data & MSW handlers
│   ├── db.ts                          # In-memory fixture data (customersDb, accountsDb)
│   ├── server.ts                      # MSW Node server (future integration/e2e use only)
│   └── handlers/
│       ├── customers.ts               # GET /customers, GET /customers/:id
│       ├── accounts.ts                # GET /accounts, GET /accounts/:id
│       └── index.ts
│
├── styles/
│   ├── _variables.scss                # Shared tokens (spacing, colors, breakpoints, typography)
│   └── utilities.scss                 # Shared utility classes and responsive/helper mixins
│
└── projects/
    ├── shell/                         # Host application (port 4200)
    │   ├── federation.config.js       # Native Federation host config
    │   ├── public/
    │   │   ├── favicon.ico
    │   │   ├── federation.manifest.json  # Remote entry URLs for mfe-customers & mfe-accounts
    │   │   ├── mockServiceWorker.js   # MSW Service Worker
    │   │   └── i18n/
    │   │       └── en.json            # English translations (served at /i18n/en.json)
    │   └── src/
    │       ├── main.ts                # initFederation → bootstrap
    │       ├── bootstrap.ts           # bootstrapApplication (starts MSW on localhost)
    │       ├── bootstrap-server.ts    # SSR bootstrap
    │       ├── mocks/
    │       │   └── browser.ts         # setupWorker(customerHandlers, accountHandlers)
    │       └── app/
    │           ├── app.ts             # Root component (nav + router-outlet)
    │           ├── app.html           # Shell layout template
    │           ├── app.routes.ts      # loadRemoteModule → CUSTOMERS_ROUTES / ACCOUNTS_ROUTES
    │           ├── app.routes.server.ts
    │           ├── app.config.ts      # provideRouter, provideHttpClient, provideTranslateService
    │           ├── app.config.server.ts
    │           ├── app.render.spec.ts # Shell root render tests
    │           └── core/
    │               ├── api.config.ts        # InjectionToken<string> API_BASE_URL
    │               ├── auth.interceptor.ts  # HttpInterceptorFn — Bearer token from sessionStorage
    │               └── auth.interceptor.spec.ts
    │
    ├── mfe-customers/                 # Customers remote (port 4201)
    │   ├── federation.config.js       # exposes: { './Routes': customers.routes.ts }
    │   └── src/
    │       ├── main.ts
    │       ├── bootstrap.ts           # bootstrapApplication (starts MSW on localhost)
    │       ├── bootstrap-server.ts
    │       ├── mocks/
    │       │   └── browser.ts         # setupWorker(customerHandlers)
    │       └── app/
    │           ├── app.ts
    │           ├── app.html
    │           ├── app.routes.ts      # Standalone wrapper (for ng serve mfe-customers)
    │           ├── app.routes.server.ts
    │           ├── app.config.ts      # provideRouter, provideHttpClient, provideChildTranslateService
    │           ├── app.config.server.ts
    │           ├── app.render.spec.ts
    │           ├── customers.routes.ts  # CUSTOMERS_ROUTES (exposed to shell)
    │           ├── core/
    │           │   └── api.config.ts
    │           ├── models/
    │           │   ├── customer.ts
    │           │   └── index.ts
    │           └── customers/
    │               ├── customer-list/   # List component — resource() + CustomersService
    │               ├── customer-detail/ # Detail component — input(:id) → resource()
    │               └── services/
    │                   ├── index.ts
    │                   └── customers/
    │                       ├── customers.service.ts
    │                       ├── customers.service.spec.ts
    │                       ├── customers.service.spy.ts
    │                       └── index.ts
    │
    └── mfe-accounts/                  # Accounts remote (port 4202)
        ├── federation.config.js       # exposes: { './Routes': accounts.routes.ts }
        └── src/
            ├── main.ts
            ├── bootstrap.ts           # bootstrapApplication (starts MSW on localhost)
            ├── bootstrap-server.ts
            ├── mocks/
            │   └── browser.ts         # setupWorker(accountHandlers)
            └── app/
                ├── app.ts
                ├── app.html
                ├── app.routes.ts      # Standalone wrapper (for ng serve mfe-accounts)
                ├── app.routes.server.ts
                ├── app.config.ts      # provideRouter, provideHttpClient, provideChildTranslateService
                ├── app.config.server.ts
                ├── app.render.spec.ts
                ├── accounts.routes.ts  # ACCOUNTS_ROUTES (exposed to shell)
                ├── core/
                │   └── api.config.ts
                ├── models/
                │   ├── account.ts
                │   └── index.ts
                └── accounts/
                    ├── account-list/   # List component — resource() + AccountsService
                    ├── account-detail/ # Detail component — input(:id) → resource()
                    └── services/
                        ├── index.ts
                        └── accounts/
                            ├── accounts.service.ts
                            ├── accounts.service.spec.ts
                            ├── accounts.service.spy.ts
                            └── index.ts
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

> This project pins its package manager via `"packageManager": "npm@11.8.0"` in `package.json`.
> If you use [Corepack](https://nodejs.org/api/corepack.html), run `corepack enable` once so npm is
> automatically resolved to the pinned version on every `npm` invocation.

---

## Getting started

```bash
# 1. Clone the repository
git clone https://github.com/mergin/mfe-poc.git
cd mfe-poc

# 2. Install dependencies
#    The `prepare` script runs automatically and installs the Husky git hooks.
npm install
```

That's it — no additional setup steps are needed. MSW Service Worker files are already committed to
each project's `public/` folder, so you don't need to run `npx msw init` manually.

---

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

Output lands in `dist/<project>/browser/` (CSR assets) and `dist/<project>/server/` (SSR server bundle).

---

## Server-side rendering (SSR)

All three applications are configured for Angular SSR via `@angular/ssr`. SSR is enabled automatically
in production builds — no extra flags are needed.

### Serve the SSR bundles locally

After running a production build, you can serve each SSR server locally:

```bash
npm run serve:ssr:shell          # http://localhost:4000
npm run serve:ssr:mfe-customers  # http://localhost:4000
npm run serve:ssr:mfe-accounts   # http://localhost:4000
```

Each command starts the Express server generated by `@angular/ssr` at `dist/<project>/server/server.mjs`.

> **Note:** MSW (the mock Service Worker) is browser-only and does **not** run during SSR. In SSR mode
> the app will attempt real network requests, so point `API_BASE_URL` at a real or locally running
> API server before serving SSR builds.

---

## Linting and formatting

### Commands

| Command                      | What it does                                               |
| ---------------------------- | ---------------------------------------------------------- |
| `npm run lint`               | Lint all three projects sequentially (with `--fix`)        |
| `npm run lint:shell`         | Lint `shell` only                                          |
| `npm run lint:mfe-customers` | Lint `mfe-customers` only                                  |
| `npm run lint:mfe-accounts`  | Lint `mfe-accounts` only                                   |
| `npm run format`             | Format all `.ts`, `.html`, `.scss` files under `projects/` |

### Linting

ESLint is configured in `eslint.config.mjs` (flat config) with three rule sets:

- **TypeScript** (`*.ts`) — `typescript-eslint` recommended rules, including `no-unused-vars`
- **Angular templates** (`*.html`) — `angular-eslint` template rules:
  - `prefer-self-closing-tags` — e.g. `<input />` not `<input>` _(error)_
  - `prefer-control-flow` — `@if`/`@for`/`@switch` only, no structural directives _(error)_
  - `eqeqeq` — `===`/`!==` only in template expressions _(error)_
  - `prefer-ngsrc` — prefer `ngSrc` over `src` on `<img>` elements _(warning)_
- **Prettier compatibility** — `eslint-config-prettier` disables any ESLint rules that would conflict with Prettier

All `lint:*` scripts run with `--fix`, so auto-fixable issues (self-closing tags, control flow migration) are corrected automatically.

### Formatting

Prettier is configured in `.prettierrc`. Key settings:

| Setting                  | Value                                             |
| ------------------------ | ------------------------------------------------- |
| `printWidth`             | `100`                                             |
| `tabWidth`               | `2` (spaces, never tabs)                          |
| `singleQuote`            | `true`                                            |
| `semi`                   | `true`                                            |
| `trailingComma`          | `"all"` (including function parameters)           |
| `arrowParens`            | `"avoid"` — `x => x`, not `(x) => x`              |
| `singleAttributePerLine` | `true` — one HTML attribute per line              |
| HTML parser              | `"angular"` — understands Angular template syntax |

### Pre-commit hook

[Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged) run automatically on every `git commit`, processing only the staged files:

| Staged file          | Steps run                           |
| -------------------- | ----------------------------------- |
| `projects/**/*.ts`   | `eslint --fix` → `prettier --write` |
| `projects/**/*.html` | `eslint --fix` → `prettier --write` |
| `projects/**/*.scss` | `prettier --write`                  |

The hook is installed automatically via the `prepare` script when running `npm install` on a fresh clone.

---

## Styling

Shared SCSS utilities reside in the top‑level `styles/` directory, which is automatically imported in every project's `src/styles.scss`.

### Sass Import Syntax

Use modern `@use` syntax instead of deprecated `@import`:

```scss
// ✅ Correct: Modern @use syntax
@use '../../../styles/utilities' as utilities;
@use './mixins' as mixins;

// ❌ Avoid: Deprecated @import syntax
@import '../../../styles/utilities';
```

When using `@use`, access namespace members with the dot notation (e.g., `utilities.$breakpoints`, `mixins.flex-center`).

The library includes:

- **CSS Custom Properties (Preferred):**
  - Spacing scale: `--spacing-sm`, `--spacing-md`, `--spacing-lg`, `--spacing-xl`
  - Breakpoints: `--breakpoint-mobile`, `--breakpoint-tablet`, `--breakpoint-desktop`, `--breakpoint-wide`
  - Colors: `--color-primary`, `--color-success`, `--color-error`, `--color-gray-*`, etc.
  - Typography: `--font-family-base`, `--font-size-base`, `--line-height-base`
- **SCSS Variables:**
  - Available for use in mixins and Sass-specific computations
  - Map to the same values as CSS custom properties
  - Internally used by responsive and helper mixins
- **Utility classes:** auto‑generated margin/padding/gap helpers such as
  `.margin-top-md`, `.padding-lg`, `.gap-sm`, and the shorthand `.margin-md`/`.padding-lg`
- **Responsive mixins:**
  - `@include media(<breakpoint>)` for min-width queries
  - Shorthand helpers `@include on-mobile`, `@include on-tablet`, `@include on-desktop`, `@include on-wide`
- **Helper mixins:**
  - `@include flex-center`, `@include flex-column`, `@include truncate`, `@include line-clamp(<n>)`,
    `@include smooth-transition`

### CSS Variables vs SCSS Variables

**Use CSS custom properties (CSS variables) by default** — they are available at runtime, can be overridden dynamically, and work directly in templates.

```scss
// ✅ Preferred in component styles
.card {
  padding: var(--spacing-md);
  background-color: var(--color-primary);

  @include on-tablet {
    padding: var(--spacing-lg);
  }
}

// ✅ Directly in templates
<div style="margin-top: var(--spacing-lg); color: var(--color-primary);">
  Content
</div>
```

Use SCSS variables **only** when you need compile-time computation (e.g., in mixin implementations that loop over breakpoints or spacing sizes):

```scss
// ✅ SCSS variables in mixin implementation (already done)
@each $size-name, $size-value in $spacing-sizes {
  .margin-#{$size-name} {
    margin: $size-value;
  }
}

// ❌ Avoid in component styles when CSS variables would work
.card {
  padding: $spacing-md; // Don't do this; use var(--spacing-md) instead
}
```

Example use in component stylesheets:

```scss
.card {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: var(--spacing-md);
  background-color: var(--color-gray-50);

  @include on-tablet {
    width: 48%;
    padding: var(--spacing-lg);
  }

  @include on-desktop {
    width: 32%;
  }
}

.title {
  @include line-clamp(3);
  margin-top: var(--spacing-lg);
  color: var(--color-primary);
}
```

Templates can leverage utility classes directly:

```html
<div class="margin-top-md padding-bottom-lg">Content</div>
```

---

## Commit conventions

Commit messages are enforced by [commitlint](https://commitlint.js.org/) using the [`@commitlint/config-angular`](https://github.com/conventional-changelog/commitlint/tree/master/@commitlint/config-angular) preset. The hook runs automatically via Husky on every `git commit`.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type       | When to use                                     |
| ---------- | ----------------------------------------------- |
| `feat`     | A new feature                                   |
| `fix`      | A bug fix                                       |
| `docs`     | Documentation changes only                      |
| `style`    | Formatting, whitespace — no logic change        |
| `refactor` | Code change that is neither a fix nor a feature |
| `perf`     | Performance improvement                         |
| `test`     | Adding or updating tests                        |
| `build`    | Build process, tooling, dependency updates      |
| `ci`       | CI/CD configuration changes                     |
| `revert`   | Reverts a previous commit                       |

### Scopes

Scopes are optional but recommended. Allowed values are restricted to this monorepo's projects and shared concerns:

| Scope       | What it covers                                  |
| ----------- | ----------------------------------------------- |
| `shell`     | `projects/shell`                                |
| `customers` | `projects/mfe-customers`                        |
| `accounts`  | `projects/mfe-accounts`                         |
| `mocks`     | `mocks/` — shared MSW handlers and fixture data |
| `deps`      | Dependency updates                              |
| `ci`        | CI/CD pipeline                                  |
| `release`   | Version bumps / changelogs                      |

### Rules

- **Subject** must be lowercase and must not end with a period
- **Subject** must not be empty
- **Type** must be one of the values listed above
- **Scope** must be one of the values listed above (when provided)
- **Header** (type + scope + subject) must not exceed **100 characters**

### Examples

```bash
# Valid
feat(customers): add search filter to customer list
fix(accounts): correct balance rounding on detail page
test(shell): add router-outlet assertion to app spec
build(deps): upgrade angular to 21.2.0
docs: update README with commit conventions
refactor(accounts): extract balance formatter to shared pipe
ci: add lint step to github actions workflow

# Invalid — rejected by commitlint
qwe                              # no type
added search filter              # no type
feat: Added search filter        # subject must be lowercase
feat(payments): add filter       # unknown scope
fix(accounts): correct balance.  # subject must not end with a period
chore(deps): bump typescript     # `chore` is not a valid type — use `build`
```

---

## Running tests

This repository has three automated test layers:

- **Unit tests** (`*.spec.ts`) with [Vitest](https://vitest.dev/) via `@angular/build:unit-test`.
- **Render tests** (`*.render.spec.ts`) with Vitest + TestBed.
- **End-to-end tests** with [Playwright](https://playwright.dev/) from the top-level `e2e/` folder.

Unit tests run without servers; Playwright tests start all three apps automatically using `start:all`.
For pipeline behavior and CI artifacts, see [CI overview](#ci-overview).

Render tests follow the `*.render.spec.ts` naming convention and live next to the component they verify.

### Testing conventions

Common patterns across all projects:

- Each `describe` block defines an `async function setup(...)` factory returning
  `{ fixture, controller, ... }` to simplify reuse.
- Providers always include `provideZonelessChangeDetection()` and pairing
  `provideHttpClient(withFetch())` with `provideHttpClientTesting()`.
- Components that use router directives call `provideRouter([])`.
- When HTTP dependencies are injected, tests prefer a spy (`<Service>Spy`) rather
  than exercising `HttpTestingController` directly.
- Tests follow the `// ARRANGE` / `// ACT` / `// ASSERT` structure and add a
  `// CLEANUP` section for any flushes needed solely to satisfy `controller.verify()`.
- Required `input()` values are set via `fixture.componentRef.setInput(...)` inside
  the setup factory before returning.

### Commands

| Command                    | What it does                                                             |
| -------------------------- | ------------------------------------------------------------------------ |
| `npm run test:shell`       | Runs shell unit tests only (watch-free)                                  |
| `npm run test:customers`   | Runs mfe-customers unit tests only                                       |
| `npm run test:accounts`    | Runs mfe-accounts unit tests only                                        |
| `npm run test:all`         | Runs all three unit suites sequentially                                  |
| `npm run test:render`      | Runs only `*.render.spec.ts` files across shell, customers, and accounts |
| `npm run test:all:log`     | Runs unit + render + e2e and writes a consolidated `test-result.log`     |
| `npm run test:e2e`         | Runs Playwright end-to-end tests from `e2e/`                             |
| `npm run test:e2e:headed`  | Runs Playwright in headed mode for local debugging                       |
| `npm run test:e2e:install` | Installs Chromium for Playwright                                         |
| `npm run test:ci`          | Runs `test:all` (unit) and `test:e2e` (end-to-end)                       |

### Quick run

```bash
# Run all tests once (no watch mode)
npm run test:all

# Run end-to-end tests
npm run test:e2e

# Run render-only tests (*.render.spec.ts)
npm run test:render

# Run full CI-equivalent suite (unit + e2e)
npm run test:ci

# Run unit + render + e2e with consolidated log output
npm run test:all:log
```

### End-to-end tests (Playwright)

All E2E specs live under the top-level `e2e/` folder and are grouped by domain:

- `e2e/shell/navigation.spec.ts` — shell navigation between remotes
- `e2e/customers/list-detail.spec.ts` — customers list, detail, and back navigation
- `e2e/accounts/list-detail.spec.ts` — accounts list, detail, and back navigation

Playwright uses `playwright.config.ts` with:

- `baseURL: http://127.0.0.1:4200`
- `webServer.command: npm run start:all`
- reporters: HTML + JUnit (`test-results/e2e-junit.xml`)

### What is tested

| Layer         | Location              | What's covered                                                                         |
| ------------- | --------------------- | -------------------------------------------------------------------------------------- |
| Unit / render | `projects/**.spec.ts` | Shell app + interceptor, customers components/services, accounts components/services   |
| End-to-end    | `e2e/**/*.spec.ts`    | Shell route switching, customers list/detail/back flow, accounts list/detail/back flow |

### Test stack

- **Runner**: Vitest 4 (managed by `@angular/build:unit-test`, jsdom environment)
- **HTTP mocking**: `HttpTestingController` — no network calls, no running servers needed
- **Mock data**: shared fixture in `mocks/db.ts` (`customersDb`, `accountsDb`)
- **Globals**: `describe`/`it`/`expect`/`beforeAll` etc. are available globally via `"types": ["vitest/globals"]` in `tsconfig.spec.json`

> **Note:** `msw/node` (Service Worker mocking) is intentionally **not** used in unit tests — importing it causes the `@angular/build:unit-test` Vitest runner to hang. Unit tests use Angular testing utilities, while Playwright E2E runs against the browser apps started by `start:all`.

---

### Consolidated test report (`npm run test:all:log`)

Running `npm run test:all:log` executes `scripts/test-all-log.sh`, which:

1. Runs **unit tests** via `npm run test:all`.
2. Runs **render tests** via `npm run test:render`.
3. Runs **e2e tests** via `npm run test:e2e`.
4. Prints a layer summary in the terminal.
5. Writes a full consolidated report to **`test-result.log`** in the project root.

#### Terminal output (example)

```
  ██████████████████████████████████████████████
  ██  MFE-POC  ·  Unit + Render + E2E Tests    ██
  ██████████████████████████████████████████████

  ▶  Unit tests (coverage) ...
  ✔  Unit → 87 tests in 25 file(s)

  ▶  Render tests ...
  ✔  Render → 40 tests in 7 file(s)

  ▶  E2E tests (Playwright) ...
  ✔  E2E → 3 test(s)

  ──────────────────────────────────────────────────────────────────────
  Test Layer Summary

  Layer      |    Tests |    Files
  ────────────────────────────────────
  Unit       |       87 |       25
  Render     |       40 |        7
  E2E        |        3 |        -

  ✔  ALL TESTS PASSED · 130 tests
  Log: .../test-result.log
  ──────────────────────────────────────────────────────────────────────
```

#### `test-result.log` structure

The log file is overwritten on every run and contains one section per test layer:

- Unit (`npm run test:all`)
- Render (`npm run test:render`)
- E2E (`npm run test:e2e`)

Each section includes status, summary counts, and full command output. The footer includes totals by layer and overall result.

### Troubleshooting (`test-all-log.sh`)

Common issues and quick fixes:

- **Native Federation warning during `ng test`**
  - Message about `@angular-architects/native-federation:build` not being supported by `unit-test` can appear.
  - This is expected in this workspace and does not indicate test failure by itself.

- **Playwright browser not installed**
  - Symptom: e2e phase fails before tests start.
  - Fix: run `npm run test:e2e:install`.

- **E2E fails because ports are already in use**
  - Symptom: `start:all` cannot start one or more apps.
  - Fix: stop existing dev servers, then rerun `npm run test:e2e` or `npm run test:all:log`.

- **E2E selector strict-mode failures**
  - Symptom: Playwright reports that a locator matches multiple elements.
  - Fix: prefer explicit selectors (role + exact name, or stable class hooks like `.back-link`).

- **Script exits with failures in one layer**
  - `test-result.log` includes separate sections for unit, render, and e2e output.
  - Check the failing phase section first, then rerun only that command (`test:all`, `test:render`, or `test:e2e`).

### CI troubleshooting (GitHub Actions)

The CI workflow in `.github/workflows/ci.yml` runs:

1. `npm ci`
2. `npm run lint`
3. `npm run test:e2e:install`
4. `npm run test:ci`

If CI fails, use this checklist:

- **`npm ci` fails**
  - Run `npm ci` locally and ensure `package-lock.json` is committed and in sync with `package.json`.

- **`test:e2e:install` fails**
  - Usually transient network/download issues when fetching Playwright Chromium.
  - Re-run the pipeline; if persistent, verify npm registry/network restrictions in CI.

- **`test:ci` fails in E2E**
  - Check uploaded artifacts: `playwright-report`, `playwright-test-results`, and `playwright-junit`.
  - Review PR annotations from the `Publish Playwright test annotations` step.

- **Only one test layer fails**
  - Reproduce locally with the exact command:
    - unit: `npm run test:all`
    - render: `npm run test:render`
    - e2e: `npm run test:e2e`

> `test-result.log` is listed in `.gitignore` — it is a local artefact and is not committed.

---

## CI overview

CI is defined in `.github/workflows/ci.yml` and runs on push to `master` and pull requests.

Pipeline steps:

1. `npm ci`
2. `npm run lint`
3. `npm run test:e2e:install`
4. `npm run test:ci` (unit + e2e)

On every run, CI uploads `playwright-junit` and publishes Playwright PR annotations.
On failures, it also uploads `playwright-report` and `playwright-test-results` artifacts.

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

See the [Project layout](#project-layout) tree above. The relevant files are:

- `mocks/` — shared fixture data and handlers (workspace root)
- `projects/<app>/src/mocks/browser.ts` — per-app Service Worker setup

The shell aggregates **both** handler sets so a single worker intercepts every API call regardless of which MFE originated it. Each standalone MFE registers only its own handlers for independent `ng serve`.

### Mock data (`mocks/db.ts`)

| Collection    | Records     | Fields                                                                                            |
| ------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| `customersDb` | 5 customers | `id`, `name`, `email`, `status` (`active`\|`inactive`)                                            |
| `accountsDb`  | 6 accounts  | `id`, `accountNumber`, `type` (`checking`\|`savings`\|`credit`), `balance`, `currency`, `ownerId` |

Types are defined inline in `db.ts` (not imported from MFE source) to avoid cross-project TypeScript compilation boundaries.

### Handlers (`mocks/handlers/`)

All handlers simulate realistic network latency via MSW's `delay()` helper.

| Method | URL                 | Response                 | Delay  |
| ------ | ------------------- | ------------------------ | ------ |
| `GET`  | `/v1/customers`     | Array of all customers   | 400 ms |
| `GET`  | `/v1/customers/:id` | Single customer or `404` | 300 ms |
| `GET`  | `/v1/accounts`      | Array of all accounts    | 400 ms |
| `GET`  | `/v1/accounts/:id`  | Single account or `404`  | 300 ms |

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

`mocks/server.ts` is kept for **Node-based integration tests** outside the Angular test builder. Current browser E2E coverage is provided by Playwright specs in `e2e/`.

---

## Internationalisation (i18n)

Translations are handled by [`@ngx-translate/core`](https://github.com/ngx-translate/core) v17
with [`@ngx-translate/http-loader`](https://github.com/ngx-translate/http-loader) v17.

### How it works

```
Bootstrap (shell)
  └── app.config.ts
        ├── provideTranslateService({ lang: 'en', defaultLanguage: 'en' })
        │     └── triggers translate.use('en') at bootstrap
        │           └── HTTP GET /i18n/en.json  ← loaded once, cached for the session
        └── provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' })
```

`TranslateService` is provided **once in the shell** and shared as a singleton with all MFEs via
Angular's DI tree. Each MFE's `app.config.ts` calls `provideChildTranslateService({ extend: true })`
— this wires the MFE into the shell's existing service without creating a new instance or firing
another network request.

Templates use the `TranslatePipe` to render keys:

```html
<!-- static key -->
<h1>{{ 'customers.list.title' | translate }}</h1>

<!-- dynamic key (badge label driven by data) -->
<span [class]="'badge badge--' + customer.status">
  {{ 'customers.detail.status.' + customer.status | translate }}
</span>
```

### Translation files

All translation files live under **`projects/shell/public/i18n/`** — they are served as static
assets by the shell and loaded at runtime via HTTP.

| File                                 | Language |
| ------------------------------------ | -------- |
| `projects/shell/public/i18n/en.json` | English  |

#### Key structure (`en.json`)

```
nav
  .customers           Navigation link label
  .accounts            Navigation link label

customers
  .list
    .title             Page heading
    .loading           Loading state message
    .error             Error state message
  .detail
    .title             Page heading
    .loading           Loading state message
    .error             Error state message
    .fields
      .name            Field label
      .email           Field label
      .status          Field label
    .status
      .active          Badge label
      .inactive        Badge label

accounts
  .list
    .title             Page heading
    .loading           Loading state message
    .error             Error state message
  .detail
    .title             Page heading
    .loading           Loading state message
    .error             Error state message
    .fields
      .accountNumber   Field label
      .type            Field label
      .balance         Field label
      .currency        Field label
    .type
      .checking        Badge label
      .savings         Badge label
      .credit          Badge label
```

### Adding a new language

1. Create `projects/shell/public/i18n/<locale>.json` with the same key structure as `en.json`.
2. Switch the active language at runtime:

```typescript
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

const translate = inject(TranslateService);
translate.use('fr'); // triggers GET /i18n/fr.json on first call
```

The loader caches each locale after the first load — subsequent `use('fr')` calls do not fire a
new request.

### Translations in unit tests

No HTTP loader is registered in the test environment. `TranslatePipe` therefore returns the raw
translation key as-is (e.g. `customers.list.title`). All spec files provide the service without a
loader:

```typescript
// In setup() — no loader, no HTTP request for translations
provideTranslateService(),
```

DOM assertions target the raw key rather than the English string:

```typescript
// ✅ correct — matches what the pipe returns in tests
expect(el.querySelector('.error')?.textContent).toContain('customers.list.error');

// ❌ wrong — the English string is never rendered in the test environment
expect(el.querySelector('.error')?.textContent).toContain('Failed to load');
```

---

## Adapting for production

This POC ships with two stubs that must be replaced before real deployment:

### 1. API base URL

In `projects/shell/src/app/app.config.ts`, replace the hardcoded mock URL with your real gateway:

```typescript
{ provide: API_BASE_URL, useValue: 'https://your-real-gateway.example.com/v1' }
```

Or read it from an environment variable / Angular build-time token as required by your infrastructure.

### 2. Auth token source

In `projects/shell/src/app/core/auth.interceptor.ts`, replace the `sessionStorage` stub:

```typescript
// Replace this:
const token = sessionStorage.getItem('access_token');

// With your real token source, e.g. MSAL:
const token = await msalInstance.acquireTokenSilent(...);
// or Keycloak:
const token = keycloak.token;
```

Both changes are picked up automatically by all MFEs via the shared Angular DI tree — only the shell needs to be updated.
