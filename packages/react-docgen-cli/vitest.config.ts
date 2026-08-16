import { createRequire } from 'node:module';
import { defineConfig } from 'vitest/config';

const require = createRequire(import.meta.url);
const babel7Aliases =
  process.env.BABEL_VERSION === '7'
    ? {
        '@babel/core': require.resolve('babel7-core'),
        '@babel/traverse': require.resolve('babel7-traverse'),
        '@babel/types': require.resolve('babel7-types'),
      }
    : {};

export default defineConfig({
  resolve: {
    alias: babel7Aliases,
  },
  test: {
    name: 'cli',
    include: ['**/__tests__/**/*-test.ts', '**/tests/integration/**/*-test.ts'],
    testTimeout: 30_000,
    deps: {
      interopDefault: false,
    },
    coverage: {
      include: ['src/**'],
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
