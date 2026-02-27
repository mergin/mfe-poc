import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';

import { AccountListComponent } from './account-list.component';
import { API_BASE_URL } from '../../core/api.config';
import { accountsDb } from '@mocks/db';

const BASE = 'https://api-gateway.example.com/v1';

async function setup() {
  await TestBed.configureTestingModule({
    imports: [AccountListComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(withFetch()),
      provideHttpClientTesting(),
      provideRouter([]),
      { provide: API_BASE_URL, useValue: BASE },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AccountListComponent);
  const controller = TestBed.inject(HttpTestingController);
  return { fixture, controller };
}

describe('AccountListComponent', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('should create', async () => {
    const { fixture, controller } = await setup();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    controller.expectOne(`${BASE}/accounts`).flush([]);
  });

  it('should show loading state initially', async () => {
    const { fixture } = await setup();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.state-msg')?.textContent).toContain('Loading');
    TestBed.inject(HttpTestingController).expectOne(`${BASE}/accounts`).flush([]);
  });

  it('should render all accounts in a table after data loads', async () => {
    const { fixture, controller } = await setup();
    fixture.detectChanges();

    controller.expectOne(`${BASE}/accounts`).flush(accountsDb);
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(rows.length).toBe(accountsDb.length);
  });

  it('should display account number and owner ID', async () => {
    const { fixture, controller } = await setup();
    fixture.detectChanges();

    controller.expectOne(`${BASE}/accounts`).flush(accountsDb);
    await fixture.whenStable();
    fixture.detectChanges();

    const firstRow = (fixture.nativeElement as HTMLElement).querySelector('tbody tr');
    expect(firstRow?.textContent).toContain(accountsDb[0].accountNumber);
    expect(firstRow?.textContent).toContain(accountsDb[0].ownerId);
  });

  it('should format the balance with 2 decimal places and currency', async () => {
    const { fixture, controller } = await setup();
    fixture.detectChanges();

    controller.expectOne(`${BASE}/accounts`).flush(accountsDb);
    await fixture.whenStable();
    fixture.detectChanges();

    // accountsDb[0].balance = 4250.75 EUR → "4,250.75 EUR"
    const firstBalance = (fixture.nativeElement as HTMLElement).querySelector('.balance');
    expect(firstBalance?.textContent).toContain('4,250.75');
    expect(firstBalance?.textContent).toContain('EUR');
  });

  it('should apply the correct badge class for each account type', async () => {
    const { fixture, controller } = await setup();
    fixture.detectChanges();

    controller.expectOne(`${BASE}/accounts`).flush(accountsDb);
    await fixture.whenStable();
    fixture.detectChanges();

    const badges = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.badge'),
    );
    expect(badges.some((b) => b.classList.contains('badge--checking'))).toBe(true);
    expect(badges.some((b) => b.classList.contains('badge--savings'))).toBe(true);
    expect(badges.some((b) => b.classList.contains('badge--credit'))).toBe(true);
  });

  it('should render a "View →" link for each account', async () => {
    const { fixture, controller } = await setup();
    fixture.detectChanges();

    controller.expectOne(`${BASE}/accounts`).flush(accountsDb);
    await fixture.whenStable();
    fixture.detectChanges();

    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody a');
    expect(links.length).toBe(accountsDb.length);
    links.forEach((link) => expect(link.textContent).toContain('View'));
  });

  it('should show error state when the API returns an error', async () => {
    const { fixture, controller } = await setup();
    fixture.detectChanges();

    controller
      .expectOne(`${BASE}/accounts`)
      .flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.error')?.textContent,
    ).toContain('Failed to load');
  });
});
