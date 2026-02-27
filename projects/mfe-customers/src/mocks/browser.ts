import { setupWorker } from 'msw/browser';
import { customerHandlers } from '../../../../mocks/handlers/customers';

export const worker = setupWorker(...customerHandlers);
