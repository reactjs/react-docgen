module.exports = {
  parser: 'babel-eslint',
  extends: ['eslint:recommended', 'prettier'],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module"
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
      files: 'website/**/*.js',
      env: { browser: true },
      rules: {
        // conflicts with jsx
        'no-unused-vars': 'off',
      },
    },
    {
      files: '@(src|bin)/**/__tests__/*-test.js',
      env: { jest: true },
    },
  ],
};
