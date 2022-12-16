'use strict';

module.exports = {
  extends: ['../../.eslintrc.cjs', 'plugin:@next/next/recommended'],
  settings: {
    next: {
      rootDir: __dirname,
    },
  },
};
