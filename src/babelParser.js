/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
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

type BabelOptions = {
  cwd?: string,
  filename?: string,
  envName?: string,
  babelrc?: boolean,
  root?: string,
  rootMode?: string,
  configFile?: string | false,
  babelrcRoots?: true | string | string[],
};

export type Options = BabelOptions & {
  parserOptions?: ParserOptions,
};

function buildOptions(
  parserOptions: ?ParserOptions,
  babelOptions: BabelOptions,
): ParserOptions {
  let parserOpts = {
    plugins: [],
  };

  if (parserOptions) {
    parserOpts = {
      ...parserOptions,
      plugins: parserOptions.plugins ? [...parserOptions.plugins] : [],
    };
  }

  const partialConfig = babel.loadPartialConfig(babelOptions);

  if (!partialConfig.hasFilesystemConfig() && parserOpts.plugins.length === 0) {
    parserOpts.plugins = [...defaultPlugins];
  }

  // Recast needs tokens to be in the tree
  // $FlowIssue tokens is clearly in the Options
  parserOpts.tokens = true;
  // Ensure we always have estree plugin enabled, if we add it a second time
  // here it does not matter
  parserOpts.plugins.push('estree');

  return parserOpts;
}

export default function buildParse(options?: Options = {}) {
  const { parserOptions, ...babelOptions } = options;
  const parserOpts = buildOptions(parserOptions, babelOptions);

  return {
    parse(src: string) {
      return babel.parseSync(src, {
        parserOpts,
        ...babelOptions,
      });
    },
  };
}
