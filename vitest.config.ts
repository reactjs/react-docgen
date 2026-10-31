import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const packages = [
  'babel',
  'core',
  'hermes',
  'react-docgen',
  'react-docgen-cli',
  'typescript',
];
const alias = Object.fromEntries(
  ['babel', 'core', 'hermes', 'typescript'].map((name) => [
    `@react-docgen/${name}`,
    fileURLToPath(new URL(`./packages/${name}/src/index.ts`, import.meta.url)),
  ]),
);

export default defineConfig({
  test: {
    projects: packages.map((name) => ({
      extends: `./packages/${name}/vitest.config.ts`,
      root: `./packages/${name}`,
      resolve: { alias },
      test: { name },
    })),
    coverage: {
      provider: 'v8',
      include: packages.map((name) => `packages/${name}/src/**`),
      exclude: ['**/__tests__/**', '**/__mocks__/**', '**/__fixtures__/**'],
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        'packages/react-docgen/src/**': {
          statements: 84,
          branches: 74,
          functions: 94,
          lines: 84,
        },
      },
    },
  },
});
