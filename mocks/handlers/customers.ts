import { http, HttpResponse, delay } from 'msw';
import { customersDb } from '../db';

const BASE = 'https://api-gateway.example.com/v1';

export const customerHandlers = [
  http.get(`${BASE}/customers`, async () => {
    await delay(400);
    return HttpResponse.json(customersDb);
  }),

  http.get(`${BASE}/customers/:id`, async ({ params }) => {
    await delay(300);
    const customer = customersDb.find((c) => c.id === params['id']);
    if (!customer) {
      return HttpResponse.json({ message: 'Customer not found' }, { status: 404 });
    }
    return HttpResponse.json(customer);
  }),
];
