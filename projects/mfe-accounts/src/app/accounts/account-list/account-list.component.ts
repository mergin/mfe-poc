import { ChangeDetectionStrategy, Component, inject, resource } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';

export interface Account {
  id: string;
  accountNumber: string;
  type: 'checking' | 'savings' | 'credit';
  balance: number;
  currency: string;
  ownerId: string;
}

@Component({
  selector: 'app-account-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="mfe-container">
      <h1>Accounts</h1>

      @if (accounts.isLoading()) {
        <p class="state-msg">Loading accounts…</p>
      } @else if (accounts.error()) {
        <p class="state-msg error">Failed to load accounts. Please try again.</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>Account No.</th>
              <th>Type</th>
              <th>Balance</th>
              <th>Owner ID</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (account of accounts.value(); track account.id) {
              <tr>
                <td>{{ account.accountNumber }}</td>
                <td>
                  <span [class]="'badge badge--' + account.type">{{ account.type }}</span>
                </td>
                <td class="balance">
                  {{ account.balance | number: '1.2-2' }} {{ account.currency }}
                </td>
                <td>{{ account.ownerId }}</td>
                <td><a [routerLink]="[account.id]">View →</a></td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [
    `
      .mfe-container {
        padding: 1.5rem;
      }
      h1 {
        margin-bottom: 1rem;
        font-size: 1.5rem;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        padding: 0.6rem 1rem;
        text-align: left;
        border-bottom: 1px solid #e0e0e0;
      }
      th {
        background: #f5f5f5;
        font-weight: 600;
      }
      .balance {
        font-family: monospace;
      }
      .badge {
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 500;
      }
      .badge--checking {
        background: #e3f0ff;
        color: #0057b8;
      }
      .badge--savings {
        background: #d4f8e8;
        color: #1a7a4a;
      }
      .badge--credit {
        background: #fff3cd;
        color: #7a5a00;
      }
      .state-msg {
        color: #666;
      }
      .error {
        color: #c00;
      }
      a {
        color: #0057b8;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class AccountListComponent {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  protected readonly accounts = resource<Account[], unknown>({
    loader: () => firstValueFrom(this.http.get<Account[]>(`${this.baseUrl}/accounts`)),
  });
}
