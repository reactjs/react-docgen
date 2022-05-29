module.exports = {
  parser: '@babel/eslint-parser',
  extends: ['eslint:recommended', 'prettier'],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    strict: ['error', 'never'],
    'no-shadow': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'prettier/prettier': 'error',
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
      files: '@(src|bin)/**/__tests__/*-test.js',
      env: { jest: true },
    },
  ],
};
