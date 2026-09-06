import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'cli',
    include: ['**/__tests__/**/*-test.ts', '**/tests/integration/**/*-test.ts'],
    testTimeout: 30_000,
    deps: {
      interopDefault: false,
    },
    coverage: {
      include: ['src/**'],
      exclude: ['**/__tests__/**'],
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
