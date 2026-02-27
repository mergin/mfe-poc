import { setupWorker } from 'msw/browser';
import { customerHandlers } from '../../../../mocks/handlers/customers';
import { accountHandlers } from '../../../../mocks/handlers/accounts';

// The shell aggregates handlers from both MFEs so a single Service Worker
// intercepts every API request regardless of which remote made it.
export const worker = setupWorker(...customerHandlers, ...accountHandlers);
