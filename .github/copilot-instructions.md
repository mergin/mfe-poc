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
