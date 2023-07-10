'use strict';

module.exports = {
  root: true,
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    'no-shadow': 'error',
    'no-var': 'error',
    'padding-line-between-statements': [
      'error',
      // Require newline before return
      { blankLine: 'always', prev: '*', next: 'return' },
      // Require newline after a batch of variable declarations
      { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
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
  env: {
    node: true,
    es6: true,
  },
  overrides: [
    {
      files: ['**/*.cjs'],
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'script',
      },
      rules: {
        strict: ['error', 'global'],
      },
    },
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/strict',
        'plugin:@typescript-eslint/stylistic',
      ],
      rules: {
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': 'error',
        '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
        '@typescript-eslint/consistent-type-imports': 'error',
        //'@typescript-eslint/no-duplicate-imports': 'error', //import plugin
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/sort-type-constituents': 'error',
      },
    },
  ],
};
