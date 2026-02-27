import { http, HttpResponse, delay } from 'msw';
import { accountsDb } from '../db';

const BASE = 'https://api-gateway.example.com/v1';

export const accountHandlers = [
  http.get(`${BASE}/accounts`, async () => {
    await delay(400);
    return HttpResponse.json(accountsDb);
  }),

  http.get(`${BASE}/accounts/:id`, async ({ params }) => {
    await delay(300);
    const account = accountsDb.find((a) => a.id === params['id']);
    if (!account) {
      return HttpResponse.json({ message: 'Account not found' }, { status: 404 });
    }
    return HttpResponse.json(account);
  }),
];
