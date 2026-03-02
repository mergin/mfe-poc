import { ChangeDetectionStrategy, Component, inject, input, resource } from '@angular/core';
import { CustomersService } from '../services/customers';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { Customer } from '../../models';

@Component({
  selector: 'app-customer-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.scss'],
})
/**
 * Shows detailed information for a single customer.
 */
export class CustomerDetailComponent {
  // withComponentInputBinding() in the shell's provideRouter() maps :id → this input
  readonly id = input.required<string>();

  private readonly customersService = inject(CustomersService);

  protected readonly customer = resource<Customer, string>({
    params: () => this.id(),
    loader: ({ params: id }) => firstValueFrom(this.customersService.get(id)),
  });
}
