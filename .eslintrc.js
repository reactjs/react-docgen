module.exports = {
  parser: '@babel/eslint-parser',
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    strict: ['error', 'never'],
    'no-shadow': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
  },
  env: {
    node: true,
    es6: true,
  },
  globals: {
    ASTNode: true,
    NodePath: true,
    $Exact: true,
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
      files: '@(src|bin)/**/__tests__/*-test.js',
      env: { jest: true },
    },
  ],
};
