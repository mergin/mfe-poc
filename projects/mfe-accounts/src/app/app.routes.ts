import { Routes } from '@angular/router';
import { ACCOUNTS_ROUTES } from './accounts.routes';

/**
 * Used only when running mfe-accounts as a standalone app (ng serve mfe-accounts).
 * When loaded via the shell, the shell's app.routes.ts uses ACCOUNTS_ROUTES directly.
 */
export const routes: Routes = [
  { path: '', redirectTo: 'accounts', pathMatch: 'full' },
  { path: 'accounts', children: ACCOUNTS_ROUTES },
  { path: '**', redirectTo: 'accounts' },
];
