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
      include: ['src/**'],
      exclude: [
        '**/__mocks__/**',
        '**/__snapshots__/**',
        '**/__tests__/**',
        '**/*-test.ts',
      ],
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        statements: 84,
        branches: 74,
        functions: 94,
        lines: 84,
      },
    },
  },
});
