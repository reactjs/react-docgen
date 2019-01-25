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

const babel = require('@babel/core');

const babelParserOptions = {
  sourceType: 'module',
  strictMode: false,
  tokens: true,
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
    ['pipelineOperator', { proposal: 'minimal' }],
    'nullishCoalescingOperator',
  ],
};

export type Options = {
  cwd?: string,
  filename?: string,
  legacyDecorators?: boolean,
  decoratorsBeforeExport?: boolean,
};

function buildOptions(options: Options) {
  const parserOptions = {
    strictMode: false,
    tokens: true,
    plugins: [],
  };

  if (options.legacyDecorators) {
    parserOptions.plugins.push('decorators-legacy');
  }

  const partialConfig = babel.loadPartialConfig({
    cwd: options.cwd,
    filename: options.filename,
  });

  if (!partialConfig.hasFilesystemConfig()) {
    parserOptions.plugins = [...babelParserOptions.plugins];

    if (!options.legacyDecorators) {
      parserOptions.plugins.push([
        'decorators',
        { decoratorsBeforeExport: options.decoratorsBeforeExport || false },
      ]);
    }
  }

  return parserOptions;
}

export default function buildParse(options?: Options = {}) {
  const parserOpts = buildOptions(options);

  return {
    parse(src: string) {
      return babel.parseSync(src, {
        parserOpts,
        cwd: options.cwd,
        filename: options.filename,
      });
    },
  };
}
