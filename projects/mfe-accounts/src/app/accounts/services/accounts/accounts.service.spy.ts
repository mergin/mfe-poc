import { vi } from 'vitest';
import { Account } from '../../../models';

export class AccountsServiceSpy {
  /** Spy for {@link AccountsService.getAll} */
  getAll = vi.fn<() => import('rxjs').Observable<Account[]>>();

  /** Spy for {@link AccountsService.get} */
  get = vi.fn<(id: string) => import('rxjs').Observable<Account>>();
}
