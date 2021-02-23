'use strict';

module.exports = {
  extends: ['../.eslintrc.js'],
  parser: '@babel/eslint-parser',
  parserOptions: {
    babelOptions: {
      root: __dirname,
    },
  },
  env: { browser: true },
  rules: {
    // conflicts with jsx
    'no-unused-vars': 'off',
  },
};
