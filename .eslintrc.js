module.exports = {
  parser: 'babel-eslint',
  extends: ['eslint:recommended', 'prettier'],
  plugins: ['prettier'],
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
