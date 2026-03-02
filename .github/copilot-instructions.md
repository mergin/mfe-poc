You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.
- Do not write arrow functions in templates (they are not supported).

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

### Service + Spy generation conventions

- Place generated services in a `services` folder next to the feature they belong to. Example:
  - `projects/<project>/src/app/<feature>/services/<service-name>/<service-name>.service.ts`
  - Tests and spies are co-located in the same folder:
    - `<service-name>.service.spec.ts`
    - `<service-name>.service.spy.ts`
- Every folder that contains services (and their spies) **must** also include an `index.ts` file that re-exports the public symbols (service class, spy, and any types). A higher‑level `services/index.ts` can in turn aggregate subfolders. Consumers should import from the directory path (e.g. `import { CustomersService } from '../services/customers';`) instead of reaching into named files.
- Domain types used by services (e.g. `Customer`, `Account`) should **not** live inside the service file. Instead, create a `models` folder (next to `services` or at the app root) containing interface/type definitions plus its own `index.ts` export barrel. Import types from the model index (e.g. `import type { Customer } from '../../models';`).

### API token provisioning

- The `API_BASE_URL` token must be provided by the shell at the root level for normal operation, because remote services can be instantiated before their own routes activate (see NG0201 errors). However, each micro‑frontend **should also** provide the same token in its own `app.config.ts` so it can run independently during development or e2e tests. Setting the value in both places keeps the behaviour predictable and avoids temporally‑early injection failures.
- The spy must export a class named `<ServiceName>Spy` that implements `Partial<OriginalService>` and uses `vi.fn()` for each method so tests can assert calls and stub return values.
- Tests should import the spy from the service folder and provide it via the TestBed providers (e.g. `{ provide: MyService, useClass: MyServiceSpy }`). Prefer spies in component/unit tests instead of exercising `HttpTestingController` directly when the intent is to isolate component logic.
- When generating services, prefer exposing observable-returning methods (e.g. `getAll(): Observable<T[]>`) so callers can easily `of(...)`, `throwError(...)` or use other Rx helpers in tests.

### Models & Interfaces

- All domain models, enums, and shared interfaces go into a `models` directory. Keep models small and focused.
- Each `models` directory requires an `index.ts` barrel exporting every type so other code can import with a single path.
- Do **not** reference models via relative paths to service files; always use the `models` barrel.

### Documentation

- Every public method in services or components must be documented with a JSDoc comment explaining its purpose and parameters/return values when applicable.
- Component and service classes should also have a brief JSDoc description at the top.
- Spies should include comments above each mocked function indicating which original method they mimic.

## Code Style — Prettier

All generated code must conform to `.prettierrc`. Key rules:

- **Line length**: max 100 characters (`printWidth: 100`)
- **Indentation**: 2 spaces — never tabs
- **Quotes**: single quotes for strings (`singleQuote: true`)
- **Semicolons**: always required (`semi: true`)
- **Trailing commas**: always, including function parameters (`trailingComma: "all"`)
- **Arrow function parens**: omit when there is a single parameter (`arrowParens: "avoid"`) — write `x => x` not `(x) => x`
- **HTML attributes**: one attribute per line in templates (`singleAttributePerLine: true`)
- **HTML parser**: Angular parser is used for `.html` files — do not use generic HTML formatting conventions

Run `npm run format` to auto-format all `.ts`, `.html`, and `.scss` files under `projects/`.

## Code Style — ESLint

All generated code must pass `npm run lint` without errors. Key enforced rules:

### TypeScript (`*.ts`)

- No unused variables (`@typescript-eslint/no-unused-vars`) — remove or prefix with `_` if intentionally unused, but prefer removing
- All `typescript-eslint` recommended rules apply

### Angular HTML templates (`*.html`)

- **Self-closing tags**: always use self-closing syntax for void/empty elements (`prefer-self-closing-tags`) — e.g. `<input />` not `<input>`
- **Control flow**: always use native `@if`, `@for`, `@switch` — never `*ngIf`, `*ngFor`, `*ngSwitch` (`prefer-control-flow`)
- **Image optimisation**: prefer `ngSrc` over `src` on `<img>` elements (`prefer-ngsrc`)
- **Equality**: always use `===` / `!==` in template expressions (`eqeqeq`)

### General

- `eslint-config-prettier` is active — do not add ESLint formatting rules that conflict with Prettier
- Run `npm run lint` to check all three projects; `npm run lint:shell`, `npm run lint:mfe-customers`, `npm run lint:mfe-accounts` to check individually
- All `lint:*` scripts run with `--fix`, so auto-fixable issues are corrected automatically

## Unit Testing

### Framework & Runner

- Tests run with **Vitest 4** via `@angular/build:unit-test` (jsdom environment).
- Use `ng test <project> --no-watch` per project, or `npm run test:all` to run all three projects sequentially.
- Vitest globals (`describe`, `it`, `expect`, `beforeEach`, `afterEach`) are available without imports — do NOT import them.
- Spec files are co-located with their source files and named `*.spec.ts`.

### TestBed Setup

- Always include `provideZonelessChangeDetection()` in the `providers` array — the app is zoneless.
- Always pair `provideHttpClient(withFetch())` with `provideHttpClientTesting()` for any component or service that uses `HttpClient`.
- Always include `provideRouter([])` for any component that uses router directives (`routerLink`, `router-outlet`).
- Override `InjectionToken` values (e.g. `API_BASE_URL`) via `{ provide: API_BASE_URL, useValue: '...' }`.
- Extract TestBed configuration into a named `async function setup(...)` factory at the top of the `describe` block. Return `{ fixture, controller }` (and any other dependencies needed by the tests).
- Always call `await TestBed.configureTestingModule(...).compileComponents()` inside the setup factory.
- Always add `afterEach(() => TestBed.inject(HttpTestingController).verify())` to catch unexpected or unmatched HTTP requests.

### HTTP Interception

- Use `HttpTestingController` exclusively for intercepting HTTP calls — do **not** use MSW inside unit tests (MSW is for the browser dev environment only).
- `resource()` fires its HTTP request **immediately on component creation**, before `fixture.detectChanges()`. The correct sequence to fully render loaded data is always:
  ```
  fixture.detectChanges();                        // triggers the request
  controller.expectOne(url).flush(data);          // resolve it
  await fixture.whenStable();                     // let signals propagate
  fixture.detectChanges();                        // re-render with new state
  ```
- To assert the **loading state**, do NOT flush — assert immediately after the first `detectChanges()`, then flush in a `// CLEANUP` block at the end.
- When a component has a required `input()`, set it via `fixture.componentRef.setInput('name', value)` inside the setup factory, before returning.

### AAA Structure

- Every test MUST be structured with `// ARRANGE`, `// ACT`, `// ASSERT` comments.
- Add a `// CLEANUP` section (after ASSERT) whenever a `flush()` is needed solely to satisfy `controller.verify()` in `afterEach` — i.e. when the flush is not part of the assertion itself.
- For tests that exercise **input changes** triggering a reload, use two separate `// ACT` blocks labelled `// ACT — initial load` and `// ACT — trigger input change`.
- Inline comments on ACT steps should explain _why_ the step is needed when it is non-obvious (e.g. `// ACT — detectChanges() triggers resource() which fires the HTTP request`).

### Fixture Data

- Import shared fixture data from `@mocks/db` (path alias pointing to `mocks/db.ts` in each project).
- Pin the subject under test to a specific fixture record at the top of the `describe` block (e.g. `const customer = customersDb[0];`) and add a comment identifying the record.
- Use a different fixture record (e.g. `customersDb[1]`) for input-change / reload tests.

### What to Test

For every component, write tests covering:

1. **Creation** — `expect(fixture.componentInstance).toBeTruthy()`
2. **Loading state** — assert `.state-msg` contains `'Loading'` before flush
3. **Successful data rendering** — assert all key fields appear in the DOM
4. **Badge / derived CSS classes** — assert `classList.contains('badge--<value>')`
5. **Links** — assert `href` or `textContent` of anchor elements
6. **Error state** — flush with `{ status: 4xx/5xx }` and assert `.error` element
7. **Input reactivity** — for components with `input.required<string>()`, assert a reload occurs after `setInput()`

## Known Warnings

### Mock service worker

- In development we register the MSW worker so HTTP calls are intercepted. Bootstrap
  code checks `location.hostname` and only starts the worker on allowed hosts
  (e.g. `'localhost'`, `'127.0.0.1'`, `'[::1]'`). If you open the app with a
  different hostname or via a remote device the worker may not start and you’ll
  see real network requests. Adjust the condition to suit your environment or
  use an environment flag instead.

### `unit-test` builder / Native Federation compatibility

When running tests you will see:

```
The 'buildTarget' is configured to use '@angular-architects/native-federation:build',
which is not supported. The 'unit-test' builder is designed to work with
'@angular/build:application' or '@angular/build:ng-packagr'.
Unexpected behavior or build failures may occur.
```

**This is a false alarm — ignore it.** The `@angular/build:unit-test` builder checks the project's
`build` architect target and warns when it is not the standard `@angular/build:application`. Native
Federation replaces that builder with its own wrapper (`@angular-architects/native-federation:build`),
which is itself a thin wrapper around `@angular/build:application`. The unit-test builder runs its
own Vite/Vitest pipeline and does not actually invoke the federation build, so the warning has no
effect on test correctness or coverage. All tests still compile and run normally.
