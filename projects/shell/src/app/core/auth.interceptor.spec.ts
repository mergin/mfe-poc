import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
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
    http.get('/api/test').subscribe();

    const req = controller.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should add Authorization: Bearer <token> header when token is in sessionStorage', () => {
    sessionStorage.setItem('access_token', 'my-test-token');

    http.get('/api/test').subscribe();

    const req = controller.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-test-token');
    req.flush({});
  });

  it('should forward the request unchanged when no token is present', () => {
    http.get('/api/data', { params: { page: '1' } }).subscribe();

    const req = controller.expectOne((r) => r.url === '/api/data');
    expect(req.request.params.get('page')).toBe('1');
    req.flush([]);
  });

  it('should pass through non-GET requests with the token attached', () => {
    sessionStorage.setItem('access_token', 'post-token');
    const body = { name: 'test' };

    http.post('/api/resource', body).subscribe();

    const req = controller.expectOne('/api/resource');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer post-token');
    req.flush({});
  });
});
