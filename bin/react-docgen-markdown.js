#!/usr/bin/env node
const { exec } = require('child_process');
const ps = require('process');
exec(
  'react-docgen -- ' + ps.argv.slice(2).join(' ') + ' | build-docs',
  (err, stdout, stderr) => {
    if (err) {
      throw err;
    }
    console.log(stdout);
    console.error(stderr);
  },
);
