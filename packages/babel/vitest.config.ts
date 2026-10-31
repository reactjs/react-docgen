import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'babel-adapter',
    include: ['**/__tests__/**/*-test.ts'],
  },
});
