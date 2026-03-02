export interface Account {
  id: string;
  accountNumber: string;
  type: 'checking' | 'savings' | 'credit';
  balance: number;
  currency: string;
  ownerId: string;
}
