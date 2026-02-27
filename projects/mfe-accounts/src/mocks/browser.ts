import { setupWorker } from 'msw/browser';
import { accountHandlers } from '../../../../mocks/handlers/accounts';

export const worker = setupWorker(...accountHandlers);
