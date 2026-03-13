import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: {
      next: {
        rootDir: 'packages/website/',
      },
      react: {
        // workaround for eslint-plugin-react compat with eslint 10
        // change to 'detect' for auto-detection of react version after eslint-plugin-react will support eslint 10+
        version: '19.2',
      },
    },
    rules: {
      'import/no-anonymous-default-export': 'off',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'public/_pagefind/**',
  ]),
]);

export default eslintConfig;
