import { ChangeDetectionStrategy, Component, inject, input, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';
import type { Customer } from '../customer-list/customer-list.component';

@Component({
  selector: 'app-customer-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="mfe-container">
      <a
        routerLink=".."
        class="back-link"
        >← Back to customers</a
      >

      @if (customer.isLoading()) {
        <p class="state-msg">Loading…</p>
      } @else if (customer.error()) {
        <p class="state-msg error">Customer not found.</p>
      } @else {
        @let c = customer.value()!;
        <h1>{{ c.name }}</h1>
        <dl class="detail-grid">
          <dt>ID</dt>
          <dd>{{ c.id }}</dd>
          <dt>Email</dt>
          <dd>{{ c.email }}</dd>
          <dt>Status</dt>
          <dd>
            <span [class]="'badge badge--' + c.status">{{ c.status }}</span>
          </dd>
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
      .badge {
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 500;
      }
      .badge--active {
        background: #d4f8e8;
        color: #1a7a4a;
      }
      .badge--inactive {
        background: #fde8e8;
        color: #a02020;
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
export class CustomerDetailComponent {
  // withComponentInputBinding() in the shell's provideRouter() maps :id → this input
  readonly id = input.required<string>();

  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  protected readonly customer = resource<Customer, string>({
    params: () => this.id(),
    loader: ({ params: id }) =>
      firstValueFrom(this.http.get<Customer>(`${this.baseUrl}/customers/${id}`)),
  });
}
