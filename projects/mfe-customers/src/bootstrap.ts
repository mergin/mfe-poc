import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

async function bootstrap() {
  // start MSW in development environments (localhost or private IPs).
  // `location.hostname` is `'localhost'` when opening 4200/4201/etc, but some
  // tools or network setups use `127.0.0.1` or a LAN address.  We keep the
  // check broad but avoid enabling in production.
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
