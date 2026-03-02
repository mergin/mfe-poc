import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CustomersService } from './customers.service';
import { API_BASE_URL } from '../../../core/api.config';

describe('CustomersService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        CustomersService,
        { provide: API_BASE_URL, useValue: 'https://api-gateway.example.com/v1' },
      ],
    }).compileComponents();
  });

  it('should be created', () => {
    const service = TestBed.inject(CustomersService);
    expect(service).toBeTruthy();
  });
});
