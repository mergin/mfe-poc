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
    // ARRANGE
    const { fixture, controller } = await setup();

    // ACT — detectChanges() triggers resource() which fires the HTTP request
    fixture.detectChanges();

    // ASSERT
    expect(fixture.componentInstance).toBeTruthy();

    // CLEANUP — flush pending request so afterEach controller.verify() passes
    controller.expectOne(`${BASE}/accounts`).flush([]);
  });

  it('should show loading state initially', async () => {
    // ARRANGE
    const { fixture } = await setup();

    // ACT — resource() fires immediately; loading state is visible before flush
    fixture.detectChanges();

    // ASSERT
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.state-msg')?.textContent).toContain('Loading');

    // CLEANUP
    TestBed.inject(HttpTestingController).expectOne(`${BASE}/accounts`).flush([]);
  });

  it('should render all accounts in a table after data loads', async () => {
    // ARRANGE
    const { fixture, controller } = await setup();

    // ACT
    fixture.detectChanges();
    controller.expectOne(`${BASE}/accounts`).flush(accountsDb);
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(rows.length).toBe(accountsDb.length);
  });

  it('should display account number and owner ID', async () => {
    // ARRANGE
    const { fixture, controller } = await setup();

    // ACT
    fixture.detectChanges();
    controller.expectOne(`${BASE}/accounts`).flush(accountsDb);
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    const firstRow = (fixture.nativeElement as HTMLElement).querySelector('tbody tr');
    expect(firstRow?.textContent).toContain(accountsDb[0].accountNumber);
    expect(firstRow?.textContent).toContain(accountsDb[0].ownerId);
  });

  it('should format the balance with 2 decimal places and currency', async () => {
    // ARRANGE
    const { fixture, controller } = await setup();

    // ACT
    fixture.detectChanges();
    controller.expectOne(`${BASE}/accounts`).flush(accountsDb);
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT — accountsDb[0].balance = 4250.75 EUR → "4,250.75 EUR"
    const firstBalance = (fixture.nativeElement as HTMLElement).querySelector('.balance');
    expect(firstBalance?.textContent).toContain('4,250.75');
    expect(firstBalance?.textContent).toContain('EUR');
  });

  it('should apply the correct badge class for each account type', async () => {
    // ARRANGE
    const { fixture, controller } = await setup();

    // ACT
    fixture.detectChanges();
    controller.expectOne(`${BASE}/accounts`).flush(accountsDb);
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    const badges = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.badge'),
    );
    expect(badges.some((b) => b.classList.contains('badge--checking'))).toBe(true);
    expect(badges.some((b) => b.classList.contains('badge--savings'))).toBe(true);
    expect(badges.some((b) => b.classList.contains('badge--credit'))).toBe(true);
  });

  it('should render a "View →" link for each account', async () => {
    // ARRANGE
    const { fixture, controller } = await setup();

    // ACT
    fixture.detectChanges();
    controller.expectOne(`${BASE}/accounts`).flush(accountsDb);
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody a');
    expect(links.length).toBe(accountsDb.length);
    links.forEach((link) => expect(link.textContent).toContain('View'));
  });

  it('should show error state when the API returns an error', async () => {
    // ARRANGE
    const { fixture, controller } = await setup();

    // ACT
    fixture.detectChanges();
    controller
      .expectOne(`${BASE}/accounts`)
      .flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.error')?.textContent,
    ).toContain('Failed to load');
  });
});
