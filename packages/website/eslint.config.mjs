import path from 'node:path';
import { globalIgnores } from 'eslint/config';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import tseslint from 'typescript-eslint';
import baseConfig from '../../eslint.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default tseslint.config([
  globalIgnores(['**/.next/']),
  ...baseConfig,
  ...compat.config({
    extends: ['next/core-web-vitals'],
    settings: {
      next: {
        rootDir: __dirname,
      },
    },
    rules: {
      'import/no-anonymous-default-export': 'off',
    },
  }),
]);
