import { ChangeDetectionStrategy, Component, inject, input, resource } from '@angular/core';
import { AccountsService } from '../services/accounts';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import type { Account } from '../../models';

@Component({
  selector: 'app-account-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DecimalPipe, TranslatePipe],
  templateUrl: './account-detail.component.html',
  styleUrls: ['./account-detail.component.scss'],
})
/**
 * Displays detailed information for a chosen account.
 */
export class AccountDetailComponent {
  readonly id = input.required<string>();

  private readonly accountsService = inject(AccountsService);

  protected readonly account = resource<Account, string>({
    params: () => this.id(),
    loader: ({ params: id }) => firstValueFrom(this.accountsService.get(id)),
  });
}
