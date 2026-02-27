import { InjectionToken } from '@angular/core';

/**
 * Re-exported so each MFE can reference the token locally without importing
 * from the shell. At runtime, the singleton value provided by the shell is used.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
