import { globalIgnores } from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

export default tseslint.config([
  globalIgnores([
    'benchmark/suites/',
    '**/__fixtures__/',
    '**/dist/',
    '**/.nx/',
    '**/coverage',
    '**/node_modules',
    'packages/website/next-env.d.ts',
  ]),
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs', '**/*.ts', '**/*.tsx'],
    languageOptions: {
      globals: {
        ...globals.node,
      },

      ecmaVersion: 2022,
      sourceType: 'module',
    },

    rules: {
      'no-shadow': 'error',
      'no-var': 'error',

      'padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: '*',
          next: 'return',
        },
        {
          blankLine: 'always',
          prev: ['const', 'let', 'var'],
          next: '*',
        },
        {
          blankLine: 'any',
          prev: ['const', 'let', 'var'],
          next: ['const', 'let', 'var'],
        },
        {
          blankLine: 'never',
          prev: ['import'],
          next: ['import'],
        },
      ],

      'prefer-const': 'error',
    },
  },
  {
    files: ['**/*.cjs'],

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
    },

    rules: {
      strict: ['error', 'global'],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],

    extends: [
      tseslint.configs.recommended,
      tseslint.configs.strict,
      tseslint.configs.stylistic,
    ],

    rules: {
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',

      '@typescript-eslint/array-type': [
        'error',
        {
          default: 'array-simple',
        },
      ],

      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/sort-type-constituents': 'error',
    },
  },
  prettierRecommended,
]);
