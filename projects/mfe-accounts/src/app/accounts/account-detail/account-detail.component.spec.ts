import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';

import { AccountDetailComponent } from './account-detail.component';
import { API_BASE_URL } from '../../core/api.config';
import { accountsDb } from '@mocks/db';

const BASE = 'https://api-gateway.example.com/v1';

async function setup(id: string) {
  await TestBed.configureTestingModule({
    imports: [AccountDetailComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(withFetch()),
      provideHttpClientTesting(),
      provideRouter([]),
      { provide: API_BASE_URL, useValue: BASE },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AccountDetailComponent);
  fixture.componentRef.setInput('id', id);
  const controller = TestBed.inject(HttpTestingController);
  return { fixture, controller };
}

describe('AccountDetailComponent', () => {
  const account = accountsDb[0]; // ES12-0049-0001 — checking — c-001

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('should create', async () => {
    const { fixture, controller } = await setup(account.id);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    controller.expectOne(`${BASE}/accounts/${account.id}`).flush(account);
  });

  it('should show loading state before data arrives', async () => {
    const { fixture } = await setup(account.id);
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.state-msg')?.textContent,
    ).toContain('Loading');
    TestBed.inject(HttpTestingController)
      .expectOne(`${BASE}/accounts/${account.id}`)
      .flush(account);
  });

  it('should render account number in the heading', async () => {
    const { fixture, controller } = await setup(account.id);
    fixture.detectChanges();

    controller.expectOne(`${BASE}/accounts/${account.id}`).flush(account);
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain(
      account.accountNumber,
    );
  });

  it('should render all detail fields (id, type, currency, ownerId)', async () => {
    const { fixture, controller } = await setup(account.id);
    fixture.detectChanges();

    controller.expectOne(`${BASE}/accounts/${account.id}`).flush(account);
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(account.id);
    expect(text).toContain(account.type);
    expect(text).toContain(account.currency);
    expect(text).toContain(account.ownerId);
  });

  it('should format the balance with 2 decimal places', async () => {
    const { fixture, controller } = await setup(account.id);
    fixture.detectChanges();

    controller.expectOne(`${BASE}/accounts/${account.id}`).flush(account);
    await fixture.whenStable();
    fixture.detectChanges();

    // balance = 4250.75 → "4,250.75"
    const balanceEl = (fixture.nativeElement as HTMLElement).querySelector('.balance');
    expect(balanceEl?.textContent).toContain('4,250.75');
    expect(balanceEl?.textContent).toContain('EUR');
  });

  it('should apply the correct badge class for the account type', async () => {
    const { fixture, controller } = await setup(account.id);
    fixture.detectChanges();

    controller.expectOne(`${BASE}/accounts/${account.id}`).flush(account);
    await fixture.whenStable();
    fixture.detectChanges();

    const badge = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.badge');
    expect(badge?.classList.contains(`badge--${account.type}`)).toBe(true);
  });

  it('should render a back link', async () => {
    const { fixture, controller } = await setup(account.id);
    fixture.detectChanges();

    controller.expectOne(`${BASE}/accounts/${account.id}`).flush(account);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.back-link')?.textContent,
    ).toContain('Back');
  });

  it('should show error state when the API returns 404', async () => {
    const { fixture, controller } = await setup('a-999');
    fixture.detectChanges();

    controller
      .expectOne(`${BASE}/accounts/a-999`)
      .flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.error')?.textContent,
    ).toContain('not found');
  });

  it('should reload data when the id input changes', async () => {
    const secondAccount = accountsDb[1]; // ES12-0049-0002 — savings

    const { fixture, controller } = await setup(account.id);
    fixture.detectChanges();

    controller.expectOne(`${BASE}/accounts/${account.id}`).flush(account);
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentRef.setInput('id', secondAccount.id);
    fixture.detectChanges();

    controller.expectOne(`${BASE}/accounts/${secondAccount.id}`).flush(secondAccount);
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain(
      secondAccount.accountNumber,
    );
  });
});
