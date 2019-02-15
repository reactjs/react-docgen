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

const defaultPlugins = [
  'jsx',
  'flow',
  'asyncGenerators',
  'bigInt',
  'classProperties',
  'classPrivateProperties',
  'classPrivateMethods',
  ['decorators', { decoratorsBeforeExport: false }],
  'doExpressions',
  'dynamicImport',
  'exportDefaultFrom',
  'exportNamespaceFrom',
  'functionBind',
  'functionSent',
  'importMeta',
  'logicalAssignment',
  'nullishCoalescingOperator',
  'numericSeparator',
  'objectRestSpread',
  'optionalCatchBinding',
  'optionalChaining',
  ['pipelineOperator', { proposal: 'minimal' }],
  'throwExpressions',
];

type ParserOptions = {
  plugins?: Array<string | [string, {}]>,
  tokens?: boolean,
};

export type Options = {
  cwd?: string,
  filename?: string,
  parserOptions?: ParserOptions,
};

function buildOptions({
  cwd,
  filename,
  parserOptions,
}: Options): ParserOptions {
  let options = {
    plugins: [],
  };

  if (parserOptions) {
    options = {
      ...parserOptions,
      plugins: parserOptions.plugins ? [...parserOptions.plugins] : [],
    };
  }

  const partialConfig = babel.loadPartialConfig({
    cwd,
    filename,
  });

  if (!partialConfig.hasFilesystemConfig() && options.plugins.length === 0) {
    options.plugins = [...defaultPlugins];
  }

  // Recast needs tokens to be in the tree
  // $FlowIssue tokens is clearly in the Options
  options.tokens = true;
  // Ensure we always have estree plugin enabled, if we add it a second time
  // here it does not matter
  options.plugins.push('estree');

  return options;
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
