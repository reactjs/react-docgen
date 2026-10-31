import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'typescript',
    include: ['**/__tests__/**/*-test.ts', '**/tests/integration/**/*-test.ts'],
    coverage: {
      include: ['src/**'],
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
