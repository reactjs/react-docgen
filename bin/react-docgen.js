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

const argv = require('commander');
const ParseStream = require('../dist/parse-stream').default;

function collect(val, memo) {
  memo.push(val);
  return memo;
}

var defaultExtensions = ['js', 'jsx'];
var defaultExclude = [];
var defaultIgnore = ['node_modules', '__tests__', '__mocks__'];

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
    'File extensions to consider. Repeat to define multiple extensions. Default: ' + JSON.stringify(defaultExtensions),
    collect,
    ['js', 'jsx'])
  .option(
    '-e, --exclude <path>',
    'Filename or regex to exclude. Default: ' + JSON.stringify(defaultExclude),
    collect,
    [])
  .option(
    '-i, --ignore <path>',
    'Folders to ignore. Default: ' + JSON.stringify(defaultIgnore),
    collect,
    ['node_modules', '__tests__', '__mocks__'])
  .option(
    '--resolver <resolver>',
    'Resolver name (findAllComponentDefinitions, findExportedComponentDefinition) or path to a module that exports ' +
    'a resolver. Default: findExportedComponentDefinition',
    'findExportedComponentDefinition')
  .arguments('<path>');

argv.parse(process.argv);

function writeWarning(warning) {
  const { filePath, error, where } = warning;
  if (filePath) {
    process.stderr.write('Error with path "' + filePath + '": ');
  }

  process.stderr.write(error + '\n');
  if (error instanceof Error) {
    process.stderr.write(error.stack + '\n');
  }
}

function writeResult() {
  const text = pretty ?
    JSON.stringify(result, null, 2) :
    JSON.stringify(result);

  if (output) {
    fs.writeFileSync(output, text);
  } else {
    process.stdout.write(text + '\n');
  }
}

const pretty = argv.pretty;
const output = argv.out;
const result = {};

// Setup the ParseStream and handle the output
const parser = new ParseStream({
  exclude: argv.exclude,
  extension: argv.extension,
  ignore: argv.ignore,
  paths: argv.args || [],
  resolver: argv.resolver
})
.on('warning', writeWarning)
.on('end', writeResult)
.on('error', err => { throw err })
.on('readable', () => {
  while (data = parser.read()) {
    result[data.file] = data.ast;
  }
});

/**
 * 1. No files passed, consume input stream
 */
if (!Array.isArray(argv.args) || !argv.args.length) {
  // var source = '';
  // process.stdin.setEncoding('utf8');
  // process.stdin.resume();
  // var timer = setTimeout(function() {
  //   process.stderr.write('Still waiting for std input...');
  // }, 5000);
  // process.stdin.on('data', function (chunk) {
  //   clearTimeout(timer);
  //   source += chunk;
  // });
  // process.stdin.on('end', function () {
  //   try {
  //     writeResult(parse(source));
  //   } catch(error) {
  //     writeError(error);
  //   }
  // });
}

