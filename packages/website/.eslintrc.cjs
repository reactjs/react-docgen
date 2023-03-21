'use strict';

module.exports = {
  extends: ['../../.eslintrc.cjs', 'plugin:@next/next/recommended'],
  root: true,
  settings: {
    next: {
      rootDir: __dirname,
    },
  },
};
