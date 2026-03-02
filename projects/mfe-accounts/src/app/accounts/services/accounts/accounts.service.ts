import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../core/api.config';
import { Observable } from 'rxjs';
import type { Account } from '../../../models';

/**
 * Service responsible for retrieving account information from the API.
 */

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private readonly _injector = inject(Injector);

  /**
   * Returns all accounts available to the user.
   * @returns An observable emitting an array of {@link Account} entities.
   */
  getAll(): Observable<Account[]> {
    return runInInjectionContext(this._injector, () => {
      const base = inject(API_BASE_URL, { optional: true }) ?? 'https://api-gateway.example.com/v1';
      if (!inject(API_BASE_URL, { optional: true })) {
        console.warn('API_BASE_URL not found in injector; using fallback', base);
      }
      return inject(HttpClient).get<Account[]>(`${base}/accounts`);
    });
  }

  /**
   * Loads details for a single account.
   * @param id Identifier of the account to retrieve.
   * @returns Observable that emits the {@link Account} record.
   */
  get(id: string): Observable<Account> {
    return runInInjectionContext(this._injector, () => {
      const base = inject(API_BASE_URL, { optional: true }) ?? 'https://api-gateway.example.com/v1';
      if (!inject(API_BASE_URL, { optional: true })) {
        console.warn('API_BASE_URL not found in injector; using fallback', base);
      }
      return inject(HttpClient).get<Account>(`${base}/accounts/${id}`);
    });
  }
}
