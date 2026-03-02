import { ChangeDetectionStrategy, Component, inject, resource } from '@angular/core';
// import { CustomersService } from '../services/customers';
import type { Customer } from '../../models';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { CustomersService } from '../services';

export type { Customer } from '../../models';

@Component({
  selector: 'app-customer-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.scss'],
})
/**
 * Displays a table of all customers retrieved from the API.
 */
export class CustomerListComponent {
  private readonly customersService = inject(CustomersService);

  protected readonly customers = resource<Customer[], unknown>({
    loader: () => firstValueFrom(this.customersService.getAll()),
  });
}
