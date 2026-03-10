import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { AccountListComponent } from './account-list.component';
import { accountsDb } from '@mocks/db';
import { AccountsService } from '../services/accounts';
import { AccountsServiceSpy } from '../services/accounts';

async function setup() {
  TestBed.resetTestingModule();
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

describe('AccountListComponent', () => {
  // using spy; no HttpTestingController verification required

  it('should create', async () => {
    // ARRANGE
    const { fixture, accountsService } = await setup();

    // ACT — detectChanges() triggers resource() which fires the HTTP request
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(accountsService.getAll).toHaveBeenCalled();
  });

  it('should show loading state initially', async () => {
    // ARRANGE
    const { fixture, accountsService } = await setup();

    // ACT — resource() fires immediately; loading state is visible before flush
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.state-msg')?.textContent).toContain('accounts.list.loading');
    expect(accountsService.getAll).toHaveBeenCalled();
  });

  it('should render all accounts in a table after data loads', async () => {
    // ARRANGE
    const { fixture, accountsService } = await setup();

    // ACT
    accountsService.getAll.mockReturnValueOnce(of(accountsDb));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(rows.length).toBe(accountsDb.length);
  });

  it('should display account number and owner ID', async () => {
    // ARRANGE
    const { fixture, accountsService } = await setup();

    // ACT
    accountsService.getAll.mockReturnValueOnce(of(accountsDb));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    const firstRow = (fixture.nativeElement as HTMLElement).querySelector('tbody tr');
    expect(firstRow?.textContent).toContain(accountsDb[0].accountNumber);
    expect(firstRow?.textContent).toContain(accountsDb[0].ownerId);
  });

  it('should format the balance with 2 decimal places and currency', async () => {
    // ARRANGE
    const { fixture, accountsService } = await setup();

    // ACT
    accountsService.getAll.mockReturnValueOnce(of(accountsDb));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT — accountsDb[0].balance = 4250.75 EUR → "4,250.75 EUR"
    const firstBalance = (fixture.nativeElement as HTMLElement).querySelector('.balance');
    expect(firstBalance?.textContent).toContain('4,250.75');
    expect(firstBalance?.textContent).toContain('EUR');
  });

  it('should apply the correct badge class for each account type', async () => {
    // ARRANGE
    const { fixture, accountsService } = await setup();

    // ACT
    accountsService.getAll.mockReturnValueOnce(of(accountsDb));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    const badges = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.badge'),
    );
    expect(badges.some(b => b.classList.contains('badge--checking'))).toBe(true);
    expect(badges.some(b => b.classList.contains('badge--savings'))).toBe(true);
    expect(badges.some(b => b.classList.contains('badge--credit'))).toBe(true);
  });

  it('should render a "View →" link for each account', async () => {
    // ARRANGE
    const { fixture, accountsService } = await setup();

    // ACT
    accountsService.getAll.mockReturnValueOnce(of(accountsDb));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody a');
    expect(links.length).toBe(accountsDb.length);
    links.forEach(link => expect(link.textContent).toContain('View'));
  });

  it('should show error state when the API returns an error', async () => {
    // ARRANGE
    const { fixture, accountsService } = await setup();

    // ACT
    accountsService.getAll.mockReturnValueOnce(throwError(() => new Error('Server error')));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    expect((fixture.nativeElement as HTMLElement).querySelector('.error')?.textContent).toContain(
      'accounts.list.error',
    );
  });
});
