import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideChildTranslateService } from '@ngx-translate/core';
import { API_BASE_URL } from './core/api.config';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    // Provide API_BASE_URL locally as well so the remote can run standalone without
    // relying on the shell and so that the token exists before any route-level
    // providers are processed.  The value matches the shell's configuration.
    { provide: API_BASE_URL, useValue: 'https://api-gateway.example.com/v1' },
    // Inherits the TranslateService singleton from the shell — does not create a new instance.
    provideChildTranslateService({ extend: true }),
  ],
};
