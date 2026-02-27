import { Routes } from '@angular/router';
import { CUSTOMERS_ROUTES } from './customers.routes';

/**
 * Used only when running mfe-customers as a standalone app (ng serve mfe-customers).
 * When loaded via the shell, the shell's app.routes.ts uses CUSTOMERS_ROUTES directly.
 */
export const routes: Routes = [
  { path: '', redirectTo: 'customers', pathMatch: 'full' },
  { path: 'customers', children: CUSTOMERS_ROUTES },
  { path: '**', redirectTo: 'customers' },
];
