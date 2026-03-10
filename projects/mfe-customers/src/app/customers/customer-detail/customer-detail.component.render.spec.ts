import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { CustomerDetailComponent } from './customer-detail.component';
import { customersDb } from '@mocks/db';
import { CustomersService } from '../services/customers';
import { CustomersServiceSpy } from '../services/customers';

async function setup(id: string) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [CustomerDetailComponent],
    providers: [
      provideZonelessChangeDetection(),

      provideRouter([]),
      { provide: CustomersService, useClass: CustomersServiceSpy },
      // No loader — keys are returned as-is in tests (no HTTP request for translations).
      provideTranslateService(),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(CustomerDetailComponent);
  fixture.componentRef.setInput('id', id);
  const customersService = TestBed.inject(CustomersService) as unknown as CustomersServiceSpy;
  return { fixture, customersService };
}

describe('CustomerDetailComponent', () => {
  const customer = customersDb[0]; // Alice Martínez — c-001, active

  it('should create and load customer', async () => {
    const { fixture, customersService } = await setup(customer.id);

    // ACT — detectChanges() triggers resource() which calls the service
    customersService.get.mockReturnValueOnce(of(customer));
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show loading state before data arrives', async () => {
    const { fixture, customersService } = await setup(customer.id);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.state-msg')?.textContent).toContain('customers.detail.loading');
    expect(customersService.get).toHaveBeenCalled();
  });

  it('should render customer name as heading', async () => {
    const { fixture, customersService } = await setup(customer.id);
    customersService.get.mockReturnValueOnce(of(customer));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain(
      customer.name,
    );
  });

  it('should render all detail fields (id, email, status)', async () => {
    const { fixture, customersService } = await setup(customer.id);
    customersService.get.mockReturnValueOnce(of(customer));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(customer.id);
    expect(text).toContain(customer.email);
    expect(text).toContain(customer.status);
  });

  it('should apply the correct badge class for the status', async () => {
    const { fixture, customersService } = await setup(customer.id);
    customersService.get.mockReturnValueOnce(of(customer));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const badge = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.badge');
    expect(badge?.classList.contains(`badge--${customer.status}`)).toBe(true);
  });

  it('should render a back link', async () => {
    const { fixture, customersService } = await setup(customer.id);
    customersService.get.mockReturnValueOnce(of(customer));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const backLink = (fixture.nativeElement as HTMLElement).querySelector('.back-link');
    expect(backLink?.textContent).toContain('customers.list.title');
  });

  it('should show error state when the API returns 404', async () => {
    const { fixture, customersService } = await setup('c-999');
    customersService.get.mockReturnValueOnce(throwError(() => new Error('Not found')));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.error')?.textContent).toContain(
      'customers.detail.error',
    );
  });

  it('should reload data when the id input changes', async () => {
    const secondCustomer = customersDb[1]; // Bob Nguyen — c-002
    const { fixture, customersService } = await setup(customer.id);

    // ACT — initial load
    customersService.get.mockReturnValueOnce(of(customer));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // ACT — trigger input change
    customersService.get.mockReturnValueOnce(of(secondCustomer));
    fixture.componentRef.setInput('id', secondCustomer.id);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain(
      secondCustomer.name,
    );
  });
});
