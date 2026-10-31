import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'hermes',
    include: ['**/__tests__/**/*-test.ts', '**/tests/integration/**/*-test.ts'],
  },
});
