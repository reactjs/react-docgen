#!/usr/bin/env node
/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

var argv = require('commander');

function collect(val, memo) {
  memo.push(val);
  return memo;
}

argv
    .usage('[path...] [options]')
    .description(
        'Extract meta information from React components.\n' +
        '  If a directory is passed, it is recursively traversed.')
    .option(
        '-o, --out <file>',
        'Store extracted information in the FILE')
    .option(
        '--pretty',
        'pretty print JSON')
    .option(
        '-x, --extension <extension>',
        'File extensions to consider. Repeat to define multiple extensions. Default: js, jsx',
        collect,
        ['js', 'jsx'])
    .option(
        '-e, --exclude <path>',
        'Filename pattern to exclude.',
        collect,
        [])
    .option(
        '-i, --ignore <path>',
        'Folders to ignore',
        collect,
        ['node_modules', '__tests__', '__mocks__'])
    .option(
        '--resolver <resolver>',
        'Resolver name (findAllComponentDefinitions, findExportedComponentDefinition) or path to a module that exports a resolver.',
        'findExportedComponentDefinition')
    .arguments('<path>');

argv.parse(process.argv);

var async = require('async');
var dir = require('node-dir');
var fs = require('fs');
var parser = require('../dist/main');
var path = require('path');

var output = argv.out;
var paths = argv.args || [];
var extensions = new RegExp('\\.(?:' + argv.extension.join('|') + ')$');
var ignoreDir = argv.ignore;
var excludePatterns = argv.exclude;
var resolver;
var errorMessage;

if (argv.resolver) {
  try {
    // Look for built-in resolver
    resolver = require(`../dist/resolver/${argv.resolver}`).default;
  } catch(e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
      throw e;
    }
    const resolverPath = path.resolve(process.cwd(), argv.resolver);
    try {
      // Look for local resolver
      resolver = require(resolverPath);
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND') {
        throw e;
      }
      // Will exit with this error message
      errorMessage = (
        `Unknown resolver: "${argv.resolver}" is neither a built-in resolver ` +
        `nor can it be found locally ("${resolverPath}")`
      );
    }
  }
}

function parse(source) {
  return parser.parse(source, resolver);
}

function writeError(msg, filePath) {
  if (filePath) {
    process.stderr.write('Error with path "' + filePath + '": ');
  }
  process.stderr.write(msg + '\n');
  if (msg instanceof Error) {
    process.stderr.write(msg.stack + '\n');
  }
}

function writeResult(result) {
  result = argv.pretty ?
    JSON.stringify(result, null, 2) :
    JSON.stringify(result);
  if (output) {
    fs.writeFileSync(output, result);
  } else {
    process.stdout.write(result + '\n');
  }
}

function traverseDir(filePath, result, done) {
  dir.readFiles(
    filePath,
    {
      match: extensions,
      exclude:excludePatterns,
      excludeDir: ignoreDir
    },
    function(error, content, filename, next) {
      if (error) {
        throw error;
      }
      try {
        result[filename] = parse(content);
      } catch(error) {
        writeError(error, filename);
      }
      next();
    },
    function(error) {
      if (error) {
        throw error;
      }
      done();
    }
  );
}

/**
 * 1. An error occurred, so exit
 */
if (errorMessage) {
  writeError(errorMessage);
  process.exitCode = 1;
} else if (paths.length === 0) {
  /**
   * 2. No files passed, consume input stream
   */
  var source = '';
  process.stdin.setEncoding('utf8');
  process.stdin.resume();
  var timer = setTimeout(function() {
    process.stderr.write('Still waiting for std input...');
  }, 5000);
  process.stdin.on('data', function (chunk) {
    clearTimeout(timer);
    source += chunk;
  });
  process.stdin.on('end', function () {
    try {
      writeResult(parse(source));
    } catch(error) {
      writeError(error);
    }
  });
} else {
  /**
   * 3. Paths are passed
   */
  var result = Object.create(null);
  async.eachSeries(paths, function(filePath, done) {
    fs.stat(filePath, function(error, stats) {
      if (error) {
        writeError(error, filePath);
        done();
        return;
      }
      if (stats.isDirectory()) {
        try {
          traverseDir(filePath, result, done);
        } catch(error) {
          writeError(error);
          done();
        }
      }
      else {
        try {
          result[filePath] = parse(fs.readFileSync(filePath));
        } catch(error) {
          writeError(error, filePath);
        }
        finally {
          done();
        }
      }
    });
  }, function() {
    var resultsPaths = Object.keys(result);
    if (resultsPaths.length === 0) {
      // we must have gotten an error
      process.exitCode = 1;
    } else if (paths.length === 1) { // a single path?
      fs.stat(paths[0], function(error, stats) {
        writeResult(stats.isDirectory() ? result : result[resultsPaths[0]]);
      });
    } else {
      writeResult(result);
    }
  });
}
