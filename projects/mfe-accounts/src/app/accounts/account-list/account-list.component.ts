import { ChangeDetectionStrategy, Component, inject, resource } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AccountsService } from '../services/accounts';
import type { Account } from '../../models';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';

export type { Account } from '../../models';

@Component({
  selector: 'app-account-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DecimalPipe, TranslatePipe],
  templateUrl: './account-list.component.html',
  styleUrls: ['./account-list.component.scss'],
})
/**
 * Shows a list of accounts in tabular form.
 */
export class AccountListComponent {
  private readonly accountsService = inject(AccountsService);

  protected readonly accounts = resource<Account[], unknown>({
    loader: () => firstValueFrom(this.accountsService.getAll()),
  });
}
