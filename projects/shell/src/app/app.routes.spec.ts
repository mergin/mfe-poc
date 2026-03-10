import { loadRemoteModule } from '@angular-architects/native-federation';
import { routes } from './app.routes';

vi.mock('@angular-architects/native-federation', () => ({
  loadRemoteModule: vi.fn(),
}));

describe('shell app routes', () => {
  it('should redirect root path to customers', () => {
    // ARRANGE
    const root = routes[0];

    // ASSERT
    expect(root.path).toBe('');
    expect(root.redirectTo).toBe('customers');
    expect(root.pathMatch).toBe('full');
  });

  it('should lazy-load customers remote routes', async () => {
    // ARRANGE
    const customersRoute = routes.find(route => route.path === 'customers');
    const mockedLoadRemoteModule = vi.mocked(loadRemoteModule);
    mockedLoadRemoteModule.mockResolvedValueOnce({
      CUSTOMERS_ROUTES: [{ path: '' }],
    } as never);

    // ACT
    const loadedRoutes = await customersRoute?.loadChildren?.();

    // ASSERT
    expect(mockedLoadRemoteModule).toHaveBeenCalledWith('mfe-customers', './Routes');
    expect(loadedRoutes).toEqual([{ path: '' }]);
  });

  it('should lazy-load accounts remote routes', async () => {
    // ARRANGE
    const accountsRoute = routes.find(route => route.path === 'accounts');
    const mockedLoadRemoteModule = vi.mocked(loadRemoteModule);
    mockedLoadRemoteModule.mockResolvedValueOnce({
      ACCOUNTS_ROUTES: [{ path: '' }],
    } as never);

    // ACT
    const loadedRoutes = await accountsRoute?.loadChildren?.();

    // ASSERT
    expect(mockedLoadRemoteModule).toHaveBeenCalledWith('mfe-accounts', './Routes');
    expect(loadedRoutes).toEqual([{ path: '' }]);
  });

  it('should redirect unknown paths to customers', () => {
    // ARRANGE
    const wildcard = routes[routes.length - 1];

    // ASSERT
    expect(wildcard.path).toBe('**');
    expect(wildcard.redirectTo).toBe('customers');
  });
});
