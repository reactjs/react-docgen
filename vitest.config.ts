import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./tests/setupTestFramework.ts'],
    include: ['**/__tests__/**/*-test.ts', '**/tests/integration/**/*-test.ts'],
    testTimeout: 30_000,
    deps: {
      interopDefault: false,
    },
    coverage: {
      all: true,
      include: ['packages/react-docgen/src/**'],
      provider: 'c8',
      reporter: ['text', 'lcov'],
    },
  },
});
