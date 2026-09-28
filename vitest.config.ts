import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    // The link check walks every emitted page and stats each internal target,
    // which takes longer than the default on a cold filesystem cache.
    testTimeout: 60_000,
  },
});
