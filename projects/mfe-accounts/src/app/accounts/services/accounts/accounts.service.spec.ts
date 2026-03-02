import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { AccountsService } from './accounts.service';
import { accountsDb } from '@mocks/db';
import { API_BASE_URL } from '../../../core/api.config';

describe('AccountsService', () => {
  let service: AccountsService;
  let controller: HttpTestingController;

  async function setup(baseUrl: string = 'https://api-gateway.example.com/v1') {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        AccountsService,
        { provide: API_BASE_URL, useValue: baseUrl },
      ],
    }).compileComponents();

    service = TestBed.inject(AccountsService);
    controller = TestBed.inject(HttpTestingController);
    return { service, controller };
  }

  afterEach(() => {
    controller.verify();
  });

  it('should be created', async () => {
    // ARRANGE
    await setup();

    // ASSERT
    expect(service).toBeTruthy();
  });

  describe('getAll()', () => {
    it('should fetch all accounts and emit them', async () => {
      // ARRANGE
      const { service, controller } = await setup();
      const expected = accountsDb;

      // ACT
      service.getAll().subscribe(accounts => {
        // ASSERT
        expect(accounts).toEqual(expected);
        expect(accounts.length).toBeGreaterThan(0);
      });

      // ASSERT
      const req = controller.expectOne('https://api-gateway.example.com/v1/accounts');
      expect(req.request.method).toBe('GET');
      req.flush(expected);
    });

    it('should use fallback URL when API_BASE_URL token is not provided', async () => {
      // ARRANGE
      const { service, controller } = await setup('https://not-used.com');
      const expected = accountsDb;

      // ACT
      service.getAll().subscribe(accounts => {
        // ASSERT
        expect(accounts).toEqual(expected);
      });

      // ASSERT — request uses the provided base URL
      const req = controller.expectOne('https://not-used.com/accounts');
      expect(req.request.method).toBe('GET');
      req.flush(expected);
    });
  });

  describe('get(id)', () => {
    it('should fetch a single account by ID and emit it', async () => {
      // ARRANGE
      const { service, controller } = await setup();
      const targetAccount = accountsDb[0]; // 1st account in mock db
      const accountId = targetAccount.id;

      // ACT
      service.get(accountId).subscribe(account => {
        // ASSERT
        expect(account).toEqual(targetAccount);
        expect(account.id).toBe(accountId);
      });

      // ASSERT
      const req = controller.expectOne(`https://api-gateway.example.com/v1/accounts/${accountId}`);
      expect(req.request.method).toBe('GET');
      req.flush(targetAccount);
    });

    it('should handle 404 when account is not found', async () => {
      // ARRANGE
      const { service, controller } = await setup();
      const nonExistentId = 'non-existent-id-12345';

      // ACT
      service.get(nonExistentId).subscribe({
        next: () => {
          // should not reach here
          expect(false).toBe(true);
        },
        error: err => {
          // ASSERT
          expect(err.status).toBe(404);
        },
      });

      // ASSERT
      const req = controller.expectOne(
        `https://api-gateway.example.com/v1/accounts/${nonExistentId}`,
      );
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });
  });
});
