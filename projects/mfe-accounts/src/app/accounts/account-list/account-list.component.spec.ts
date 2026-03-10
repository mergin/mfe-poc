import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AccountListComponent } from './account-list.component';
import { AccountsService } from '../services/accounts';
import { AccountsServiceSpy } from '../services/accounts';
import { accountsDb } from '@mocks/db';

describe('AccountListComponent (unit)', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [AccountListComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideTranslateService(),
        { provide: AccountsService, useClass: AccountsServiceSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AccountListComponent);
    const accountsService = TestBed.inject(AccountsService) as unknown as AccountsServiceSpy;
    return { fixture, accountsService };
  }

  it('should create', async () => {
    // ARRANGE
    const { fixture } = await setup();

    // ASSERT
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should request accounts on initial change detection', async () => {
    // ARRANGE
    const { fixture, accountsService } = await setup();
    accountsService.getAll.mockReturnValueOnce(of(accountsDb));

    // ACT
    fixture.detectChanges();
    await fixture.whenStable();

    // ASSERT
    expect(accountsService.getAll).toHaveBeenCalledTimes(1);
  });
});
