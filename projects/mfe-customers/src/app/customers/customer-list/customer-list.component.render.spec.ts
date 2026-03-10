import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { CustomerListComponent } from './customer-list.component';
import { customersDb } from '@mocks/db';
import { CustomersService } from '../services/customers';
import { CustomersServiceSpy } from '../services/customers';

async function setup() {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [CustomerListComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      provideTranslateService(),
      { provide: CustomersService, useClass: CustomersServiceSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(CustomerListComponent);
  const customersService = TestBed.inject(CustomersService) as unknown as CustomersServiceSpy;
  return { fixture, customersService };
}

describe('CustomerListComponent', () => {
  // no HTTP controller to verify when using a spy

  it('should create', async () => {
    // ARRANGE
    const { fixture, customersService } = await setup();

    // ACT — detectChanges() triggers resource() which fires the HTTP request
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(customersService.getAll).toHaveBeenCalled();
  });

  it('should show loading state before data arrives', async () => {
    // ARRANGE
    const { fixture, customersService } = await setup();

    // ACT — resource() fires immediately; loading state is visible before flush
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.state-msg')?.textContent).toContain('customers.list.loading');
    expect(customersService.getAll).toHaveBeenCalled();
  });

  it('should render all customers in a table after data loads', async () => {
    // ARRANGE
    const { fixture, customersService } = await setup();

    // ACT
    customersService.getAll.mockReturnValueOnce(of(customersDb));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(rows.length).toBe(customersDb.length);
  });

  it('should display customer name and email in each row', async () => {
    // ARRANGE
    const { fixture, customersService } = await setup();

    // ACT
    customersService.getAll.mockReturnValueOnce(of(customersDb));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    const firstRow = (fixture.nativeElement as HTMLElement).querySelector('tbody tr');
    expect(firstRow?.textContent).toContain(customersDb[0].name);
    expect(firstRow?.textContent).toContain(customersDb[0].email);
  });

  it('should apply the correct badge class for active/inactive status', async () => {
    // ARRANGE
    const { fixture, customersService } = await setup();

    // ACT
    customersService.getAll.mockReturnValueOnce(of(customersDb));
    fixture.detectChanges();
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
    const { fixture, customersService } = await setup();

    // ACT
    customersService.getAll.mockReturnValueOnce(of(customersDb));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody a');
    expect(links.length).toBe(customersDb.length);
    links.forEach(link => expect(link.textContent).toContain('View'));
  });

  it('should show error state when the API returns an error', async () => {
    // ARRANGE
    const { fixture, customersService } = await setup();

    // ACT
    customersService.getAll.mockReturnValueOnce(throwError(() => new Error('Server error')));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // ASSERT
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.error')?.textContent).toContain('customers.list.error');
  });
});
