import { ACCOUNTS_ROUTES } from './accounts.routes';
import { routes } from './app.routes';

describe('mfe-accounts app routes', () => {
  it('should redirect root path to accounts', () => {
    // ARRANGE
    const root = routes[0];

    // ASSERT
    expect(root.path).toBe('');
    expect(root.redirectTo).toBe('accounts');
    expect(root.pathMatch).toBe('full');
  });

  it('should mount accounts routes under /accounts', () => {
    // ARRANGE
    const accounts = routes.find(route => route.path === 'accounts');

    // ASSERT
    expect(accounts?.children).toBe(ACCOUNTS_ROUTES);
  });

  it('should redirect unknown paths to accounts', () => {
    // ARRANGE
    const wildcard = routes[routes.length - 1];

    // ASSERT
    expect(wildcard.path).toBe('**');
    expect(wildcard.redirectTo).toBe('accounts');
  });
});
