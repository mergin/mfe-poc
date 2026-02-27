// Shared mock data for both MFEs.
// Types are inlined here (not imported from MFE source) to avoid
// cross-project TypeScript compilation boundaries.

export interface Customer {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

export interface Account {
  id: string;
  accountNumber: string;
  type: 'checking' | 'savings' | 'credit';
  balance: number;
  currency: string;
  ownerId: string;
}

export const customersDb: Customer[] = [
  { id: 'c-001', name: 'Alice Martínez', email: 'alice@example.com',  status: 'active'   },
  { id: 'c-002', name: 'Bob Nguyen',      email: 'bob@example.com',    status: 'active'   },
  { id: 'c-003', name: 'Carol Obi',       email: 'carol@example.com',  status: 'inactive' },
  { id: 'c-004', name: 'David Kim',       email: 'david@example.com',  status: 'active'   },
  { id: 'c-005', name: 'Eva Rossi',       email: 'eva@example.com',    status: 'inactive' },
];

export const accountsDb: Account[] = [
  { id: 'a-001', accountNumber: 'ES12-0049-0001', type: 'checking', balance:  4_250.75, currency: 'EUR', ownerId: 'c-001' },
  { id: 'a-002', accountNumber: 'ES12-0049-0002', type: 'savings',  balance: 18_900.00, currency: 'EUR', ownerId: 'c-001' },
  { id: 'a-003', accountNumber: 'ES12-0049-0003', type: 'checking', balance:  1_035.20, currency: 'EUR', ownerId: 'c-002' },
  { id: 'a-004', accountNumber: 'ES12-0049-0004', type: 'credit',   balance:   -540.00, currency: 'EUR', ownerId: 'c-002' },
  { id: 'a-005', accountNumber: 'ES12-0049-0005', type: 'savings',  balance:  7_600.00, currency: 'EUR', ownerId: 'c-003' },
  { id: 'a-006', accountNumber: 'ES12-0049-0006', type: 'checking', balance:    320.10, currency: 'EUR', ownerId: 'c-004' },
];
