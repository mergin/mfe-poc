/**
 * MSW Node server used by Vitest tests.
 * Import `server` in a `beforeAll` / `afterAll` pair, or use the provided
 * `setupMswServer()` helper that wires everything up automatically.
 */
import { setupServer } from 'msw/node';
import { customerHandlers } from './handlers/customers';
import { accountHandlers } from './handlers/accounts';

export const server = setupServer(...customerHandlers, ...accountHandlers);

/**
 * Call once at suite-level (outside describe) to wire beforeAll / afterEach /
 * afterAll automatically.  Individual tests can still override handlers with
 * `server.use(...)`.
 */
export function setupMswServer(): void {
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}
