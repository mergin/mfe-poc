import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    sessionStorage.clear();
  });

  afterEach(() => {
    controller.verify();
    sessionStorage.clear();
  });

  it('should not add Authorization header when no token is stored', () => {
    // ARRANGE — sessionStorage is empty (cleared in beforeEach)

    // ACT
    http.get('/api/test').subscribe();

    // ASSERT
    const req = controller.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);

    // CLEANUP
    req.flush({});
  });

  it('should add Authorization: Bearer <token> header when token is in sessionStorage', () => {
    // ARRANGE
    sessionStorage.setItem('access_token', 'my-test-token');

    // ACT
    http.get('/api/test').subscribe();

    // ASSERT
    const req = controller.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-test-token');

    // CLEANUP
    req.flush({});
  });

  it('should forward the request unchanged when no token is present', () => {
    // ARRANGE — sessionStorage is empty (cleared in beforeEach)

    // ACT
    http.get('/api/data', { params: { page: '1' } }).subscribe();

    // ASSERT
    const req = controller.expectOne(r => r.url === '/api/data');
    expect(req.request.params.get('page')).toBe('1');

    // CLEANUP
    req.flush([]);
  });

  it('should pass through non-GET requests with the token attached', () => {
    // ARRANGE
    sessionStorage.setItem('access_token', 'post-token');
    const body = { name: 'test' };

    // ACT
    http.post('/api/resource', body).subscribe();

    // ASSERT
    const req = controller.expectOne('/api/resource');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer post-token');

    // CLEANUP
    req.flush({});
  });
});
