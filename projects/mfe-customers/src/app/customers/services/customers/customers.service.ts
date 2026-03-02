import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../core/api.config';
import { Observable } from 'rxjs';
import type { Customer } from '../../../models';

/**
 * Service responsible for retrieving customer data from the server.
 */

@Injectable({ providedIn: 'root' })
export class CustomersService {
  // capture the injector at construction time so we can run `inject()` later
  // inside `runInInjectionContext` from a valid context.
  private readonly _injector = inject(Injector);

  /**
   * Retrieves the complete list of customers.
   * @returns Observable emitting an array of {@link Customer} objects.
   */
  getAll(): Observable<Customer[]> {
    return runInInjectionContext(this._injector, () => {
      const base = inject(API_BASE_URL, { optional: true }) ?? 'https://api-gateway.example.com/v1';
      return inject(HttpClient).get<Customer[]>(`${base}/customers`);
    });
  }

  /**
   * Fetches a single customer by its unique identifier.
   * @param id The ID of the customer to load.
   * @returns Observable emitting the requested {@link Customer}.
   */
  get(id: string): Observable<Customer> {
    return runInInjectionContext(this._injector, () => {
      const base = inject(API_BASE_URL, { optional: true }) ?? 'https://api-gateway.example.com/v1';
      return inject(HttpClient).get<Customer>(`${base}/customers/${id}`);
    });
  }
}
