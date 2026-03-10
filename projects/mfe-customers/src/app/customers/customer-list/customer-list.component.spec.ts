import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { CustomerListComponent } from './customer-list.component';
import { CustomersService } from '../services/customers';
import { CustomersServiceSpy } from '../services/customers';
import { customersDb } from '@mocks/db';

describe('CustomerListComponent (unit)', () => {
  async function setup() {
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

  it('should create', async () => {
    // ARRANGE
    const { fixture } = await setup();

    // ASSERT
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should request customers on initial change detection', async () => {
    // ARRANGE
    const { fixture, customersService } = await setup();
    customersService.getAll.mockReturnValueOnce(of(customersDb));

    // ACT
    fixture.detectChanges();
    await fixture.whenStable();

    // ASSERT
    expect(customersService.getAll).toHaveBeenCalledTimes(1);
  });
});
