import { Routes } from '@angular/router';
import { API_BASE_URL } from './core/api.config';

export const ACCOUNTS_ROUTES: Routes = [
  {
    path: '',
    // Provide the token at the route level so it is available to all child
    // components regardless of which injector tree loaded this route array.
    providers: [{ provide: API_BASE_URL, useValue: 'https://api-gateway.example.com/v1' }],
    children: [
      {
        path: '',
        title: 'Accounts',
        loadComponent: () =>
          import('./accounts/account-list/account-list.component').then(
            (m) => m.AccountListComponent,
          ),
      },
      {
        path: ':id',
        title: 'Account Detail',
        loadComponent: () =>
          import('./accounts/account-detail/account-detail.component').then(
            (m) => m.AccountDetailComponent,
          ),
      },
    ],
  },
];
