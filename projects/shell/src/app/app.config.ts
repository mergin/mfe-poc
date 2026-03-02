import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { API_BASE_URL } from './core/api.config';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    // HttpClient is provided here once and shared as a singleton with all MFEs.
    // The authInterceptor runs for every request made by any MFE.
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    // API base URL is common to all microfrontends; provide it at the shell level so
    // services injected before a child route loads still have the token available.
    { provide: API_BASE_URL, useValue: 'https://api-gateway.example.com/v1' },
    // TranslateService is provided once here and shared as a singleton with all MFEs.
    // `lang` triggers the initial HTTP load of /i18n/en.json immediately at bootstrap.
    // `defaultLanguage` is the fallback used when a key is missing in the active language.
    provideTranslateService({ lang: 'en', defaultLanguage: 'en' }),
    provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
  ],
};
