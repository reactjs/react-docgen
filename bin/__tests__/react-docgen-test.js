/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*global jest, describe, pit, expect, afterEach*/

"use strict";

jest.autoMockOff();

var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var temp = require('temp');
require('es6-promise').polyfill();

function run(args, stdin) {
  return new Promise(resolve => {
    var docgen = child_process.spawn(
      path.join(__dirname, '../react-docgen.js'),
      args
    );
    var stdout = '';
    var stderr = '';
    docgen.stdout.on('data', data => stdout += data);
    docgen.stderr.on('data', data => stderr += data);
    docgen.on('close', () => resolve([stdout, stderr]));
    if (stdin) {
      docgen.stdin.write(stdin);
    }
    docgen.stdin.end();
  });
}

var component = fs.readFileSync(
  path.join(__dirname, '../../example/components/Component.js')
);

describe('react-docgen CLI', () => {
  var tempDir;
  var tempComponents = [];
  var tempNoComponents = [];

  function createTempfiles(suffix, dir) {
    if (!tempDir) {
      tempDir = temp.mkdirSync();
    }
    if (!dir) {
      dir = tempDir;
    } else {
      dir = path.join(tempDir, dir);
      try {
        fs.mkdirSync(dir);
      } catch(error) {
        if (error.message.indexOf('EEXIST') === -1) {
          throw error;
        }
      }
    }
    if (!suffix) {
      suffix = 'js';
    }

    var componentPath = path.join(dir,  'Component.' + suffix);
    var componentFile = fs.openSync(componentPath, 'w');
    fs.writeSync(componentFile, component.toString());
    fs.closeSync(componentFile);
    var noComponentPath = path.join(dir, 'NoComponent.' + suffix);
    var noComponentFile = fs.openSync(noComponentPath, 'w');
    fs.writeSync(noComponentFile, '{}');
    fs.closeSync(noComponentFile);

    tempComponents.push(componentPath);
    tempNoComponents.push(noComponentPath);

    return dir;
  }

  afterEach(() => {
    if (tempDir) {
      rimraf.sync(tempDir);
    }
    tempDir = null;
    tempComponents.length = 0;
    tempNoComponents.length = 0;
  });

  pit('reads from stdin', () => {
    return run(null, component).then(([stdout, stderr]) => {
      expect(stdout.length > 0).toBe(true);
      expect(stderr.length).toBe(0);
    });
  });

  pit('reads files provided as command line arguments', () => {
    createTempfiles();
    return run(tempComponents.concat(tempNoComponents)).then(
      ([stdout, stderr]) => {
        expect(stdout).toContain('Component');
        expect(stderr).toContain('NoComponent');
      }
    );
  });

  pit('reads directories provided as command line arguments', () => {
    var tempDir = createTempfiles();
    return run([tempDir]).then(([stdout, stderr]) => {
      expect(stdout).toContain('Component');
      expect(stderr).toContain('NoComponent');
    });
  });

  pit('considers js and jsx by default', () => {
    var tempDir = createTempfiles();
    createTempfiles('jsx');
    createTempfiles('foo');
    return run([tempDir]).then(([stdout, stderr]) => {
      expect(stdout).toContain('Component.js');
      expect(stdout).toContain('Component.jsx');
      expect(stdout).not.toContain('Component.foo');

      expect(stderr).toContain('NoComponent.js');
      expect(stderr).toContain('NoComponent.jsx');
      expect(stderr).not.toContain('NoComponent.foo');
    });
  });

  pit('considers files with the specified extension', () => {
    createTempfiles('foo');
    createTempfiles('bar');

    var verify = ([stdout, stderr]) => {
      expect(stdout).toContain('Component.foo');
      expect(stdout).toContain('Component.bar');

      expect(stderr).toContain('NoComponent.foo');
      expect(stderr).toContain('NoComponent.bar');
    };


    return Promise.all([
      run(['--extension=foo', '--extension=bar', tempDir]).then(verify),
      run(['-x', 'foo', '-x', 'bar', tempDir]).then(verify),
    ]);
  });

  pit('ignores files in node_modules and __tests__ by default', () => {
    createTempfiles(null, 'node_modules');
    createTempfiles(null, '__tests__');

    return run([tempDir]).then(([stdout, stderr]) => {
      expect(stdout).toBe('');
      expect(stderr).toBe('');
    });
  });

  pit('ignores specified folders', () => {
    createTempfiles(null, 'foo');

    var verify = ([stdout, stderr]) => {
      expect(stdout).toBe('');
      expect(stderr).toBe('');
    };

    return Promise.all([
        run(['--ignore=foo', tempDir]).then(verify),
        run(['-i', 'foo', tempDir]).then(verify)
    ]);
  });

  pit('writes to stdout', () => {
    return run(null, component).then(([stdout, stderr]) => {
      expect(stdout.length > 0).toBe(true);
      expect(stderr.length).toBe(0);
    });
  });

  pit('writes to stderr', () => {
    return run(null, '{}').then(([stdout, stderr]) => {
      expect(stderr.length > 0).toBe(true);
      expect(stdout.length).toBe(0);
    });
  });

  pit('writes to a file if provided', function() {
    var outFile = temp.openSync();
    createTempfiles();

    var verify = ([stdout, stderr]) => {
      expect(fs.readFileSync(outFile.path)).not.toBe('');
      expect(stdout).toBe('');
    };

    return Promise.all([
      run(['--out=' + outFile.path, tempDir]).then(verify),
      run(['-o',  outFile.path, tempDir]).then(verify),
    ]);
  });

});
