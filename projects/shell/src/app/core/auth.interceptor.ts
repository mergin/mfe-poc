import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Functional HTTP interceptor that attaches a Bearer token to every outgoing
 * request. In a real implementation this would read from an auth service
 * (e.g. MSAL, OAuth2). Because this interceptor is registered in the shell's
 * provideHttpClient() it is automatically shared with all MFEs that use the
 * same Angular singleton (guaranteed by shareAll in federation.config.js).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // TODO: replace with your real token source (MSAL, cookie, storage…)
  const token = sessionStorage.getItem('access_token');

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
