import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';

import { CustomerDetailComponent } from './customer-detail.component';
import { API_BASE_URL } from '../../core/api.config';
import { customersDb } from '@mocks/db';

const BASE = 'https://api-gateway.example.com/v1';

async function setup(id: string) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [CustomerDetailComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(withFetch()),
      provideHttpClientTesting(),
      provideRouter([]),
      { provide: API_BASE_URL, useValue: BASE },
      // No loader — keys are returned as-is in tests (no HTTP request for translations).
      provideTranslateService(),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(CustomerDetailComponent);
  fixture.componentRef.setInput('id', id);
  const controller = TestBed.inject(HttpTestingController);
  return { fixture, controller };
}

describe('CustomerDetailComponent', () => {
  const customer = customersDb[0]; // Alice Martínez — c-001, active

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('should create', async () => {
    // ARRANGE
    const { fixture, controller } = await setup(customer.id);

    // ACT — detectChanges() triggers resource() which fires the HTTP request
    fixture.detectChanges();

    // ASSERT
    expect(fixture.componentInstance).toBeTruthy();

    // CLEANUP — flush pending request so afterEach controller.verify() passes
    controller.expectOne(`${BASE}/customers/${customer.id}`).flush(customer);
  });

  it('should show loading state before data arrives', async () => {
    // ARRANGE
    const { fixture } = await setup(customer.id);

    // ACT — resource() fires immediately; loading state is visible before flush
    fixture.detectChanges();

    // ASSERT
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.state-msg')?.textContent).toContain('customers.detail.loading');

    // CLEANUP
    TestBed.inject(HttpTestingController)
      .expectOne(`${BASE}/customers/${customer.id}`)
      .flush(customer);
  });

  it('should render customer name as heading', async () => {
    // ARRANGE
    const { fixture, controller } = await setup(customer.id);

    // ACT
    fixture.detectChanges();
    controller.expectOne(`${BASE}/customers/${customer.id}`).flush(customer);
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain(
      customer.name,
    );
  });

  it('should render all detail fields (id, email, status)', async () => {
    // ARRANGE
    const { fixture, controller } = await setup(customer.id);

    // ACT
    fixture.detectChanges();
    controller.expectOne(`${BASE}/customers/${customer.id}`).flush(customer);
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(customer.id);
    expect(text).toContain(customer.email);
    expect(text).toContain(customer.status);
  });

  it('should apply the correct badge class for the status', async () => {
    // ARRANGE
    const { fixture, controller } = await setup(customer.id);

    // ACT
    fixture.detectChanges();
    controller.expectOne(`${BASE}/customers/${customer.id}`).flush(customer);
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    const badge = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.badge');
    expect(badge?.classList.contains(`badge--${customer.status}`)).toBe(true);
  });

  it('should render a back link', async () => {
    // ARRANGE
    const { fixture, controller } = await setup(customer.id);

    // ACT
    fixture.detectChanges();
    controller.expectOne(`${BASE}/customers/${customer.id}`).flush(customer);
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    const backLink = (fixture.nativeElement as HTMLElement).querySelector('.back-link');
    expect(backLink?.textContent).toContain('customers.list.title');
  });

  it('should show error state when the API returns 404', async () => {
    // ARRANGE
    const { fixture, controller } = await setup('c-999');

    // ACT
    fixture.detectChanges();
    controller
      .expectOne(`${BASE}/customers/c-999`)
      .flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    expect((fixture.nativeElement as HTMLElement).querySelector('.error')?.textContent).toContain(
      'customers.detail.error',
    );
  });

  it('should reload data when the id input changes', async () => {
    // ARRANGE
    const secondCustomer = customersDb[1]; // Bob Nguyen — c-002
    const { fixture, controller } = await setup(customer.id);

    // ACT — initial load
    fixture.detectChanges();
    controller.expectOne(`${BASE}/customers/${customer.id}`).flush(customer);
    await fixture.whenStable();
    fixture.detectChanges();

    // ACT — trigger input change
    fixture.componentRef.setInput('id', secondCustomer.id);
    fixture.detectChanges();
    controller.expectOne(`${BASE}/customers/${secondCustomer.id}`).flush(secondCustomer);
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain(
      secondCustomer.name,
    );
  });
});
