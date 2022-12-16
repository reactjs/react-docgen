import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/__tests__/**/*-test.ts', '**/tests/integration/**/*-test.ts'],
    testTimeout: 30_000,
    deps: {
      interopDefault: false,
    },
    coverage: {
      include: ['no-coverage'],
    },
  },
});
