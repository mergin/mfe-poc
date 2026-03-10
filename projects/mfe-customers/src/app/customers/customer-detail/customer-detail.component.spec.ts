import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { CustomerDetailComponent } from './customer-detail.component';
import { CustomersService } from '../services/customers';
import { CustomersServiceSpy } from '../services/customers';
import { customersDb } from '@mocks/db';

describe('CustomerDetailComponent (unit)', () => {
  async function setup(id: string) {
    await TestBed.configureTestingModule({
      imports: [CustomerDetailComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideTranslateService(),
        { provide: CustomersService, useClass: CustomersServiceSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CustomerDetailComponent);
    fixture.componentRef.setInput('id', id);
    const customersService = TestBed.inject(CustomersService) as unknown as CustomersServiceSpy;
    return { fixture, customersService };
  }

  it('should create', async () => {
    // ARRANGE
    const { fixture } = await setup(customersDb[0].id);

    // ASSERT
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should request customer by id on initial change detection', async () => {
    // ARRANGE
    const { fixture, customersService } = await setup(customersDb[0].id);
    customersService.get.mockReturnValueOnce(of(customersDb[0]));

    // ACT
    fixture.detectChanges();
    await fixture.whenStable();

    // ASSERT
    expect(customersService.get).toHaveBeenCalledWith(customersDb[0].id);
  });
});
