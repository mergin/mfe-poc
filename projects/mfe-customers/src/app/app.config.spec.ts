import { API_BASE_URL } from './core/api.config';
import { appConfig } from './app.config';

describe('mfe-customers appConfig', () => {
  it('should define providers', () => {
    // ASSERT
    expect(appConfig.providers).toBeTruthy();
    expect(appConfig.providers?.length).toBeGreaterThan(0);
  });

  it('should provide API_BASE_URL value', () => {
    // ARRANGE
    const providers = appConfig.providers as Array<{ provide?: unknown; useValue?: string }>;
    const apiProvider = providers.find(provider => provider?.provide === API_BASE_URL);

    // ASSERT
    expect(apiProvider?.useValue).toBe('https://api-gateway.example.com/v1');
  });
});
