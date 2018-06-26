/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 *
 */

var parser = require('@babel/parser');

var babelParserOptions = {
  sourceType: 'module',
  strictMode: false,
  plugins: [
    'jsx',
    'flow',
    'estree',
    'doExpressions',
    'objectRestSpread',
    'classProperties',
    'classPrivateProperties',
    'classPrivateMethods',
    'exportDefaultFrom',
    'exportNamespaceFrom',
    'asyncGenerators',
    'functionBind',
    'functionSent',
    'dynamicImport',
    'numericSeparator',
    'optionalChaining',
    'importMeta',
    'bigInt',
    'optionalCatchBinding',
    'throwExpressions',
    'pipelineOperator',
    'nullishCoalescingOperator',
  ],
};

export type Options = {
  legacyDecorators ?: boolean,
};

function buildOptions(options?: Options = {}) {
  const parserOptions = { ...babelParserOptions, plugins: [...babelParserOptions.plugins] };
  if (options.legacyDecorators) {
    parserOptions.plugins.push('decorators-legacy');
  } else {
    parserOptions.plugins.push('decorators');
  }

  return parserOptions;
}

export default function buildParse(options: Options) {
  const parserOptions = buildOptions(options);

  return {
    parse(src: string) {
      var file = parser.parse(src, parserOptions);
      file.program.comments = file.comments;
      return file.program;
    },
  };
}
