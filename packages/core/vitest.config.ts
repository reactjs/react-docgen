import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'core',
    include: ['**/__tests__/**/*-test.ts'],
    coverage: {
      include: ['src/**'],
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
