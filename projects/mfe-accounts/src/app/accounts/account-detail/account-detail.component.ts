import { ChangeDetectionStrategy, Component, inject, input, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';
import type { Account } from '../account-list/account-list.component';

@Component({
  selector: 'app-account-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="mfe-container">
      <a
        routerLink=".."
        class="back-link"
        >← Back to accounts</a
      >

      @if (account.isLoading()) {
        <p class="state-msg">Loading…</p>
      } @else if (account.error()) {
        <p class="state-msg error">Account not found.</p>
      } @else {
        @let a = account.value()!;
        <h1>Account {{ a.accountNumber }}</h1>
        <dl class="detail-grid">
          <dt>ID</dt>
          <dd>{{ a.id }}</dd>
          <dt>Type</dt>
          <dd>
            <span [class]="'badge badge--' + a.type">{{ a.type }}</span>
          </dd>
          <dt>Balance</dt>
          <dd class="balance">{{ a.balance | number: '1.2-2' }} {{ a.currency }}</dd>
          <dt>Owner ID</dt>
          <dd>{{ a.ownerId }}</dd>
        </dl>
      }
    </div>
  `,
  styles: [
    `
      .mfe-container {
        padding: 1.5rem;
      }
      .back-link {
        color: #0057b8;
        text-decoration: none;
        font-size: 0.9rem;
      }
      .back-link:hover {
        text-decoration: underline;
      }
      h1 {
        margin: 1rem 0;
        font-size: 1.5rem;
      }
      .detail-grid {
        display: grid;
        grid-template-columns: 10rem 1fr;
        gap: 0.5rem 1rem;
      }
      dt {
        font-weight: 600;
        color: #555;
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
    `,
  ],
})
export class AccountDetailComponent {
  readonly id = input.required<string>();

  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  protected readonly account = resource<Account, string>({
    params: () => this.id(),
    loader: ({ params: id }) =>
      firstValueFrom(this.http.get<Account>(`${this.baseUrl}/accounts/${id}`)),
  });
}
