import { Routes } from '@angular/router';
import { API_BASE_URL } from './core/api.config';

export const CUSTOMERS_ROUTES: Routes = [
  {
    path: '',
    // Provide the token at the route level so it is available to all child
    // components regardless of which injector tree loaded this route array.
    providers: [{ provide: API_BASE_URL, useValue: 'https://api-gateway.example.com/v1' }],
    children: [
      {
        path: '',
        title: 'Customers',
        loadComponent: () =>
          import('./customers/customer-list/customer-list.component').then(
            m => m.CustomerListComponent,
          ),
      },
      {
        path: ':id',
        title: 'Customer Detail',
        loadComponent: () =>
          import('./customers/customer-detail/customer-detail.component').then(
            m => m.CustomerDetailComponent,
          ),
      },
    ],
  },
];
