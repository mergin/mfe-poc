import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

async function bootstrap() {
  if (
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
  ) {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
  return bootstrapApplication(App, appConfig);
}

bootstrap().catch(err => console.error(err));
