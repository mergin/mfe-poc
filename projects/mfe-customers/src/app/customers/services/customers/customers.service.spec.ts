import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { CustomersService } from './customers.service';
import { customersDb } from '@mocks/db';
import { API_BASE_URL } from '../../../core/api.config';

describe('CustomersService', () => {
  let service: CustomersService;
  let controller: HttpTestingController;

  async function setup(baseUrl: string = 'https://api-gateway.example.com/v1') {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        CustomersService,
        { provide: API_BASE_URL, useValue: baseUrl },
      ],
    }).compileComponents();

    service = TestBed.inject(CustomersService);
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
    it('should fetch all customers and emit them', async () => {
      // ARRANGE
      const { service, controller } = await setup();
      const expected = customersDb;

      // ACT
      service.getAll().subscribe(customers => {
        // ASSERT
        expect(customers).toEqual(expected);
        expect(customers.length).toBeGreaterThan(0);
      });

      // ASSERT
      const req = controller.expectOne('https://api-gateway.example.com/v1/customers');
      expect(req.request.method).toBe('GET');
      req.flush(expected);
    });

    it('should use fallback URL when API_BASE_URL token is not provided', async () => {
      // ARRANGE
      const { service, controller } = await setup('https://not-used.com');
      const expected = customersDb;

      // ACT
      service.getAll().subscribe(customers => {
        // ASSERT
        expect(customers).toEqual(expected);
      });

      // ASSERT — request uses the provided base URL
      const req = controller.expectOne('https://not-used.com/customers');
      expect(req.request.method).toBe('GET');
      req.flush(expected);
    });
  });

  describe('get(id)', () => {
    it('should fetch a single customer by ID and emit it', async () => {
      // ARRANGE
      const { service, controller } = await setup();
      const targetCustomer = customersDb[0]; // 1st customer in mock db
      const customerId = targetCustomer.id;

      // ACT
      service.get(customerId).subscribe(customer => {
        // ASSERT
        expect(customer).toEqual(targetCustomer);
        expect(customer.id).toBe(customerId);
      });

      // ASSERT
      const req = controller.expectOne(
        `https://api-gateway.example.com/v1/customers/${customerId}`,
      );
      expect(req.request.method).toBe('GET');
      req.flush(targetCustomer);
    });

    it('should handle 404 when customer is not found', async () => {
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
        `https://api-gateway.example.com/v1/customers/${nonExistentId}`,
      );
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });
  });
});
