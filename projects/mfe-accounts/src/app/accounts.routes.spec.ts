import { API_BASE_URL } from './core/api.config';
import { ACCOUNTS_ROUTES } from './accounts.routes';

describe('ACCOUNTS_ROUTES', () => {
  it('should provide API_BASE_URL at the root route', () => {
    // ARRANGE
    const root = ACCOUNTS_ROUTES[0];
    const provider = root.providers?.[0] as { provide: unknown; useValue: string };

    // ASSERT
    expect(root.path).toBe('');
    expect(provider.provide).toBe(API_BASE_URL);
    expect(provider.useValue).toBe('https://api-gateway.example.com/v1');
  });

  it('should define list and detail child routes', () => {
    // ARRANGE
    const root = ACCOUNTS_ROUTES[0];
    const children = root.children ?? [];

    // ASSERT
    expect(children.length).toBe(2);
    expect(children[0].path).toBe('');
    expect(children[0].title).toBe('Accounts');
    expect(children[1].path).toBe(':id');
    expect(children[1].title).toBe('Account Detail');
  });

  it('should lazy-load components for both child routes', () => {
    // ARRANGE
    const children = ACCOUNTS_ROUTES[0].children ?? [];

    // ASSERT
    expect(typeof children[0].loadComponent).toBe('function');
    expect(typeof children[1].loadComponent).toBe('function');
  });
});
