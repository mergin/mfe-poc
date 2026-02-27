import { ChangeDetectionStrategy, Component, inject, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';

export interface Customer {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-customer-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="mfe-container">
      <h1>Customers</h1>

      @if (customers.isLoading()) {
        <p class="state-msg">Loading customers…</p>
      } @else if (customers.error()) {
        <p class="state-msg error">Failed to load customers. Please try again.</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (customer of customers.value(); track customer.id) {
              <tr>
                <td>{{ customer.name }}</td>
                <td>{{ customer.email }}</td>
                <td>
                  <span [class]="'badge badge--' + customer.status">
                    {{ customer.status }}
                  </span>
                </td>
                <td>
                  <a [routerLink]="[customer.id]">View →</a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .mfe-container { padding: 1.5rem; }
    h1 { margin-bottom: 1rem; font-size: 1.5rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: .6rem 1rem; text-align: left; border-bottom: 1px solid #e0e0e0; }
    th { background: #f5f5f5; font-weight: 600; }
    .badge { padding: .2rem .6rem; border-radius: 999px; font-size: .8rem; font-weight: 500; }
    .badge--active { background: #d4f8e8; color: #1a7a4a; }
    .badge--inactive { background: #fde8e8; color: #a02020; }
    .state-msg { color: #666; }
    .error { color: #c00; }
    a { color: #0057b8; text-decoration: none; }
    a:hover { text-decoration: underline; }
  `],
})
export class CustomerListComponent {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  protected readonly customers = resource<Customer[], unknown>({
    loader: () =>
      firstValueFrom(
        this.http.get<Customer[]>(`${this.baseUrl}/customers`),
      ),
  });
}
