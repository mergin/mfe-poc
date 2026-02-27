import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration shared by all three projects (referenced via
 * `runnerConfig: "vitest.config.ts"` in angular.json test targets).
 *
 * NOTE: @angular/build:unit-test manages the Vitest pool and environment
 * internally.  This file is limited to settings the builder exposes as
 * pass-through, e.g. the `server.deps` inline list.
 */
export default defineConfig({
  test: {
    // Inline msw so Vite processes it as ESM instead of trying to load
    // the CJS bundle, which avoids "require is not defined" in ESM context.
    server: {
      deps: {
        inline: ['msw'],
      },
    },
  },
});
