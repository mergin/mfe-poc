import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'customers',
    pathMatch: 'full',
  },
  {
    path: 'customers',
    loadChildren: () =>
      loadRemoteModule('mfe-customers', './Routes').then((m) => m.CUSTOMERS_ROUTES),
  },
  {
    path: 'accounts',
    loadChildren: () =>
      loadRemoteModule('mfe-accounts', './Routes').then((m) => m.ACCOUNTS_ROUTES),
  },
  {
    path: '**',
    redirectTo: 'customers',
  },
];
