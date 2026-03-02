import { vi } from 'vitest';
import { Customer } from '../../../models';

export class CustomersServiceSpy {
  /** Spy for {@link CustomersService.getAll} */
  getAll = vi.fn<() => import('rxjs').Observable<Customer[]>>();

  /** Spy for {@link CustomersService.get} */
  get = vi.fn<(id: string) => import('rxjs').Observable<Customer>>();
}
