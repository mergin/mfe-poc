import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { AccountDetailComponent } from './account-detail.component';
import { AccountsService } from '../services/accounts';
import { AccountsServiceSpy } from '../services/accounts';
import { accountsDb } from '@mocks/db';

async function setup(id: string) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [AccountDetailComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      // No loader — keys are returned as-is in tests (no HTTP request for translations).
      provideTranslateService(),
      { provide: AccountsService, useClass: AccountsServiceSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AccountDetailComponent);
  fixture.componentRef.setInput('id', id);
  const accountsService = TestBed.inject(AccountsService) as unknown as AccountsServiceSpy;
  return { fixture, accountsService };
}

describe('AccountDetailComponent', () => {
  const account = accountsDb[0]; // ES12-0049-0001 — checking — c-001

  afterEach(() => {
    /* no HTTP to verify when using spy */
  });

  it('should create and load customer', async () => {
    const { fixture, accountsService } = await setup(account.id);
    accountsService.get.mockReturnValueOnce(of(account));
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show loading state before data arrives', async () => {
    const { fixture, accountsService } = await setup(account.id);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.state-msg')?.textContent).toContain('accounts.detail.loading');
    expect(accountsService.get).toHaveBeenCalled();
  });

  it('should render account number in the heading', async () => {
    const { fixture, accountsService } = await setup(account.id);
    accountsService.get.mockReturnValueOnce(of(account));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain(
      account.accountNumber,
    );
  });

  it('should render all detail fields (id, type, currency, ownerId)', async () => {
    const { fixture, accountsService } = await setup(account.id);
    accountsService.get.mockReturnValueOnce(of(account));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(account.id);
    expect(text).toContain(account.type);
    expect(text).toContain(account.currency);
    expect(text).toContain(account.ownerId);
  });

  it('should format the balance with 2 decimal places', async () => {
    const { fixture, accountsService } = await setup(account.id);
    accountsService.get.mockReturnValueOnce(of(account));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const balanceEl = (fixture.nativeElement as HTMLElement).querySelector('.balance');
    expect(balanceEl?.textContent).toContain('4,250.75');
    expect(balanceEl?.textContent).toContain('EUR');
  });

  it('should apply the correct badge class for the account type', async () => {
    const { fixture, accountsService } = await setup(account.id);
    accountsService.get.mockReturnValueOnce(of(account));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const badge = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.badge');
    expect(badge?.classList.contains(`badge--${account.type}`)).toBe(true);
  });

  it('should render a back link', async () => {
    const { fixture, accountsService } = await setup(account.id);
    accountsService.get.mockReturnValueOnce(of(account));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.back-link')?.textContent,
    ).toContain('accounts.list.title');
  });

  it('should show error state when the API returns 404', async () => {
    const { fixture, accountsService } = await setup('a-999');
    accountsService.get.mockReturnValueOnce(throwError(() => new Error('Not found')));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.error')?.textContent).toContain(
      'accounts.detail.error',
    );
  });

  it('should reload data when the id input changes', async () => {
    const secondAccount = accountsDb[1]; // ES12-0049-0002 — savings
    const { fixture, accountsService } = await setup(account.id);

    // ACT — initial load
    accountsService.get.mockReturnValueOnce(of(account));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // ACT — trigger input change
    accountsService.get.mockReturnValueOnce(of(secondAccount));
    fixture.componentRef.setInput('id', secondAccount.id);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain(
      secondAccount.accountNumber,
    );
  });
});
