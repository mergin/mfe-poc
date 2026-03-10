import { API_BASE_URL } from './api.config';

describe('shell API_BASE_URL token', () => {
  it('should export a token named API_BASE_URL', () => {
    // ASSERT
    expect(API_BASE_URL).toBeTruthy();
    expect(API_BASE_URL.toString()).toContain('API_BASE_URL');
  });
});
