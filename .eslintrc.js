'use strict';

module.exports = {
  root: true,
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    'no-shadow': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    strict: ['error', 'never'],
  },
  env: {
    node: true,
    es6: true,
  },
  overrides: [
    {
      files: ['*rc.js', '*.config.js'],
      parserOptions: {
        ecmaVersion: 2019,
        sourceType: 'script',
      },
      rules: {
        strict: ['error', 'global'],
      },
    },
    {
      files: '**/*.ts',
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/no-duplicate-imports': 'error',
        '@typescript-eslint/sort-type-union-intersection-members': 'error',
      },
    },
    {
      files: '@(src|bin)/**/__tests__/*-test.js',
      env: { jest: true },
    },
  ],
};
