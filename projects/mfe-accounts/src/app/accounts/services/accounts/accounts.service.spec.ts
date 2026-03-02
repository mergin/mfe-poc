import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AccountsService } from './accounts.service';
import { API_BASE_URL } from '../../../core/api.config';

describe('AccountsService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        AccountsService,
        { provide: API_BASE_URL, useValue: 'https://api-gateway.example.com/v1' },
      ],
    }).compileComponents();
  });

  it('should be created', () => {
    const service = TestBed.inject(AccountsService);
    expect(service).toBeTruthy();
  });
});
