import { CUSTOMERS_ROUTES } from './customers.routes';
import { routes } from './app.routes';

describe('mfe-customers app routes', () => {
  it('should redirect root path to customers', () => {
    // ARRANGE
    const root = routes[0];

    // ASSERT
    expect(root.path).toBe('');
    expect(root.redirectTo).toBe('customers');
    expect(root.pathMatch).toBe('full');
  });

  it('should mount customers routes under /customers', () => {
    // ARRANGE
    const customers = routes.find(route => route.path === 'customers');

    // ASSERT
    expect(customers?.children).toBe(CUSTOMERS_ROUTES);
  });

  it('should redirect unknown paths to customers', () => {
    // ARRANGE
    const wildcard = routes[routes.length - 1];

    // ASSERT
    expect(wildcard.path).toBe('**');
    expect(wildcard.redirectTo).toBe('customers');
  });
});
