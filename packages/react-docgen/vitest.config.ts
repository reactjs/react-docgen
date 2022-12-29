import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'lib',
    setupFiles: ['./tests/setupTestFramework.ts'],
    include: ['**/__tests__/**/*-test.ts', '**/tests/integration/**/*-test.ts'],
    deps: {
      interopDefault: false,
    },
    coverage: {
      all: true,
      include: ['src/**'],
      provider: 'c8',
      reporter: ['text', 'lcov'],
    },
  },
});
