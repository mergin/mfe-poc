import { InjectionToken } from '@angular/core';

/**
 * Base URL of the API Gateway. Provided once in the shell's app.config.ts
 * and shared to every MFE via Native Federation's singleton mechanism.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
