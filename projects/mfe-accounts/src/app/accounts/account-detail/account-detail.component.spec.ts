import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AccountDetailComponent } from './account-detail.component';
import { AccountsService } from '../services/accounts';
import { AccountsServiceSpy } from '../services/accounts';
import { accountsDb } from '@mocks/db';

describe('AccountDetailComponent (unit)', () => {
  async function setup(id: string) {
    await TestBed.configureTestingModule({
      imports: [AccountDetailComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideTranslateService(),
        { provide: AccountsService, useClass: AccountsServiceSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AccountDetailComponent);
    fixture.componentRef.setInput('id', id);
    const accountsService = TestBed.inject(AccountsService) as unknown as AccountsServiceSpy;
    return { fixture, accountsService };
  }

  it('should create', async () => {
    // ARRANGE
    const { fixture } = await setup(accountsDb[0].id);

    // ASSERT
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should request account by id on initial change detection', async () => {
    // ARRANGE
    const { fixture, accountsService } = await setup(accountsDb[0].id);
    accountsService.get.mockReturnValueOnce(of(accountsDb[0]));

    // ACT
    fixture.detectChanges();
    await fixture.whenStable();

    // ASSERT
    expect(accountsService.get).toHaveBeenCalledWith(accountsDb[0].id);
  });
});
