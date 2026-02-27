import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';

import { CustomerListComponent } from './customer-list.component';
import { API_BASE_URL } from '../../core/api.config';
import { customersDb } from '@mocks/db';

const BASE = 'https://api-gateway.example.com/v1';

async function setup() {
  await TestBed.configureTestingModule({
    imports: [CustomerListComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(withFetch()),
      provideHttpClientTesting(),
      provideRouter([]),
      { provide: API_BASE_URL, useValue: BASE },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(CustomerListComponent);
  const controller = TestBed.inject(HttpTestingController);
  return { fixture, controller };
}

describe('CustomerListComponent', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('should create', async () => {
    // ARRANGE
    const { fixture, controller } = await setup();

    // ACT — detectChanges() triggers resource() which fires the HTTP request
    fixture.detectChanges();

    // ASSERT
    expect(fixture.componentInstance).toBeTruthy();

    // CLEANUP — flush pending request so afterEach controller.verify() passes
    controller.expectOne(`${BASE}/customers`).flush([]);
  });

  it('should show loading state before data arrives', async () => {
    // ARRANGE
    const { fixture } = await setup();

    // ACT — resource() fires immediately; loading state is visible before flush
    fixture.detectChanges();

    // ASSERT
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.state-msg')?.textContent).toContain('Loading');

    // CLEANUP
    TestBed.inject(HttpTestingController).expectOne(`${BASE}/customers`).flush([]);
  });

  it('should render all customers in a table after data loads', async () => {
    // ARRANGE
    const { fixture, controller } = await setup();

    // ACT
    fixture.detectChanges();
    controller.expectOne(`${BASE}/customers`).flush(customersDb);
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(rows.length).toBe(customersDb.length);
  });

  it('should display customer name and email in each row', async () => {
    // ARRANGE
    const { fixture, controller } = await setup();

    // ACT
    fixture.detectChanges();
    controller.expectOne(`${BASE}/customers`).flush(customersDb);
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    const firstRow = (fixture.nativeElement as HTMLElement).querySelector('tbody tr');
    expect(firstRow?.textContent).toContain(customersDb[0].name);
    expect(firstRow?.textContent).toContain(customersDb[0].email);
  });

  it('should apply the correct badge class for active/inactive status', async () => {
    // ARRANGE
    const { fixture, controller } = await setup();

    // ACT
    fixture.detectChanges();
    controller.expectOne(`${BASE}/customers`).flush(customersDb);
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    const badges = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.badge'),
    );
    expect(badges.some(b => b.classList.contains('badge--active'))).toBe(true);
    expect(badges.some(b => b.classList.contains('badge--inactive'))).toBe(true);
  });

  it('should render a "View →" link for each customer', async () => {
    // ARRANGE
    const { fixture, controller } = await setup();

    // ACT
    fixture.detectChanges();
    controller.expectOne(`${BASE}/customers`).flush(customersDb);
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody a');
    expect(links.length).toBe(customersDb.length);
    links.forEach(link => expect(link.textContent).toContain('View'));
  });

  it('should show error state when the API returns an error', async () => {
    // ARRANGE
    const { fixture, controller } = await setup();

    // ACT
    fixture.detectChanges();
    controller
      .expectOne(`${BASE}/customers`)
      .flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.error')?.textContent).toContain('Failed to load');
  });
});
